import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { NotificationItem } from '../types/Notification';
import { API_BASE_URL, getUnreadCount, getNotifications, markOneRead } from '../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Dynamic import for notifee so the app doesn't crash if bundler can't resolve internal files yet
let notifee: any = null;
let AndroidImportance: any = { HIGH: 4 };
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const lib = require('@notifee/react-native');
  notifee = lib.default || lib;
  if (lib.AndroidImportance) AndroidImportance = lib.AndroidImportance;
} catch (e: any) {
  console.warn('[Notifications] notifee not available:', e?.message || e);
}

interface NotificationsContextValue {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  markRead: (id: number) => Promise<void>;
  connectionStatus: string; // 'idle' | 'connecting' | 'connected' | 'error'
  reconnect: () => Promise<void>;
  testLocalNotification: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);

export const useNotifications = () => {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider');
  return ctx;
};

const PAGE_SIZE = 20;

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const clientRef = useRef<Client | null>(null);
  const tokenRef = useRef<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const reconnectAttemptsRef = useRef(0);
  const lastMessageTimeRef = useRef<number>(0);
  const deliveredRef = useRef<Set<number>>(new Set());

  const addOrUpdate = useCallback((n: NotificationItem) => {
    setNotifications(prev => {
      const exists = prev.find(i => i.id === n.id);
      if (exists) return prev.map(i => (i.id === n.id ? { ...i, ...n } : i));
      return [n, ...prev];
    });
    if (!n.read) setUnreadCount(c => c + 1);
    // Show local notification once per new id (even if server marks read=true)
    if (!deliveredRef.current.has(n.id)) {
      deliveredRef.current.add(n.id);
      console.log('[Notifications] triggering local notification for id', n.id, 'read=', n.read);
      displayLocalNotification(n).catch(()=>{});
    } else {
      // Debug path when duplicate arrives
      console.log('[Notifications] skip local notification duplicate id', n.id);
    }
  }, []);

  const bootstrap = useCallback(async () => {
    try {
      setLoading(true);
      const [count, listData] = await Promise.all([
        getUnreadCount(),
        getNotifications(0, PAGE_SIZE, false),
      ]);
      setUnreadCount(count);
      const list = listData.content ?? listData;
      setNotifications(list);
      setPage(0);
      if (list.length < PAGE_SIZE) setHasMore(false); else setHasMore(true);
    } finally { setLoading(false); }
  }, []);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    const next = page + 1;
    const listData = await getNotifications(next, PAGE_SIZE, false);
    const list = listData.content ?? listData;
  setNotifications(prev => [...prev, ...list.filter((n: NotificationItem) => !prev.find(p => p.id === n.id))]);
    setPage(next);
    if (list.length < PAGE_SIZE) setHasMore(false);
  }, [hasMore, loading, page]);

  const markRead = useCallback(async (id: number) => {
    await markOneRead(id);
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
    setUnreadCount(c => Math.max(0, c - 1));
  }, []);

  const refresh = useCallback(async () => bootstrap(), [bootstrap]);

  const initWebSocket = useCallback((token: string) => {
    // Cleanup old client first
    clientRef.current?.deactivate();
    setConnectionStatus('connecting');
    reconnectAttemptsRef.current = 0;
    const client = new Client({
      webSocketFactory: () => new SockJS(`${API_BASE_URL}/ws`),
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: str => console.log('[STOMP]', str),
      connectHeaders: { Authorization: `Bearer ${token}` },
      onConnect: () => {
        setConnectionStatus('connected');
        console.log('[Notifications] STOMP connected');
        try {
          client.subscribe('/user/queue/notifications', (msg: any) => {
            console.log('[Notifications] WS message raw via /user/queue/notifications', msg.body);
            lastMessageTimeRef.current = Date.now();
            try { const n: NotificationItem = JSON.parse(msg.body); addOrUpdate(n); } catch (e) { console.warn('Parse notification error', e); }
          });
        } catch (e) { console.warn('[Notifications] subscribe failed', e); }
        if (notifications.length === 0) bootstrap();
      },
      onStompError: frame => {
        console.warn('[Notifications] STOMP error', frame.headers['message']);
        setConnectionStatus('error');
      },
      onWebSocketClose: evt => {
        console.warn('[Notifications] WebSocket closed', (evt as any)?.code, (evt as any)?.reason);
        if (connectionStatus !== 'error') setConnectionStatus('idle');
      },
      onWebSocketError: e => {
        console.warn('[Notifications] WebSocket error', e);
        setConnectionStatus('error');
      }
    });
    clientRef.current = client;
    client.activate();
  }, [addOrUpdate, bootstrap, notifications.length, connectionStatus]);

  const reconnect = useCallback(async () => {
    const token = await AsyncStorage.getItem('jwtToken');
    if (token) {
      console.log('[Notifications] Manual reconnect triggered');
      initWebSocket(token);
    }
  }, [initWebSocket]);

  // Ensure channel + permission for local notifications
  useEffect(() => {
    if (notifee) {
      (async () => {
        try {
          const perm = await notifee.requestPermission();
          console.log('[Notifications] permission result', perm);
          await notifee.createChannel({ id: 'default', name: 'Default', importance: AndroidImportance.HIGH });
        } catch (e) {
          console.warn('[Notifications] permission/channel init error', e);
        }
      })();
    } else {
      console.log('[Notifications] notifee unavailable - local notifications disabled');
    }
  }, []);

  const displayLocalNotification = async (n: NotificationItem) => {
    if (!notifee) { console.log('[Notifications] skip local notification (lib missing)'); return; }
    try {
      await notifee.displayNotification({
        title: n.title || 'New Notification',
        body: n.message,
        android: { channelId: 'default', pressAction: { id: 'default' } },
        data: { notificationId: String(n.id), relatedAppointmentId: n.relatedAppointmentId ? String(n.relatedAppointmentId) : '' },
      });
    } catch (e) {
      console.warn('[Notifications] displayNotification error', e);
    }
  };

  const testLocalNotification = useCallback(async () => {
    await displayLocalNotification({
      id: Date.now(),
      type: 'TEST',
      title: 'Test Local Notification',
      message: 'This is a manual test notification',
      read: false,
      createdAt: new Date().toISOString(),
    } as NotificationItem);
  }, []);

  // Poll for token appearance / change (e.g., after login) then init websocket
  useEffect(() => {
    let cancelled = false;
    const interval = setInterval(async () => {
      try {
        const current = await AsyncStorage.getItem('jwtToken');
        if (cancelled) return;
        if (current && current !== tokenRef.current) {
          tokenRef.current = current;
            console.log('[Notifications] Detected token change, initializing WebSocket');
          initWebSocket(current);
          if (notifications.length === 0) bootstrap();
        }
      } catch {}
    }, 3000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [initWebSocket, bootstrap, notifications.length]);

  // Manual retry if in error state every 15s
  useEffect(() => {
    if (connectionStatus !== 'error') return;
    const t = setTimeout(async () => {
      const token = await AsyncStorage.getItem('jwtToken');
      if (token) initWebSocket(token);
    }, 15000);
    return () => clearTimeout(t);
  }, [connectionStatus, initWebSocket]);

  useEffect(() => { bootstrap(); }, [bootstrap]);

  // Polling fallback: if no WS messages for >30s or WS not connected, fetch unread count & latest page
  useEffect(() => {
    const interval = setInterval(async () => {
      const idleTooLong = Date.now() - (lastMessageTimeRef.current || 0) > 30000;
      if (connectionStatus !== 'connected' || idleTooLong) {
        try {
          const [count, listData] = await Promise.all([
            getUnreadCount(),
            getNotifications(0, PAGE_SIZE, false),
          ]);
          setUnreadCount(count);
          const list = listData.content ?? listData;
          setNotifications(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const map = new Map<number, NotificationItem>();
            [...list, ...prev].forEach(n => map.set(n.id, n));
            const merged = Array.from(map.values()).sort((a,b)=> new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime());
            // Trigger local notifications for newly discovered ones
            merged.forEach(n => {
              if (!existingIds.has(n.id) && !deliveredRef.current.has(n.id)) {
                deliveredRef.current.add(n.id);
                console.log('[Notifications] polling discovered new id', n.id);
                displayLocalNotification(n).catch(()=>{});
              }
            });
            return merged;
          });
        } catch (e) {
          console.warn('[Notifications] polling fallback error', e);
        }
      }
    }, 5000); // faster polling since WS not connected
    return () => clearInterval(interval);
  }, [connectionStatus]);

  return (
  <NotificationsContext.Provider value={{ notifications, unreadCount, loading, loadMore, refresh, markRead, connectionStatus, reconnect, testLocalNotification }}>
      {children}
    </NotificationsContext.Provider>
  );
};
