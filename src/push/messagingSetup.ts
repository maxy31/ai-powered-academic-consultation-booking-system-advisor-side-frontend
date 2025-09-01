import { getApp, getApps, initializeApp } from '@react-native-firebase/app';
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import { safeNavigate } from '../navigation/navigationRef';
import { API_BASE_URL } from '../api/client';

// Ensure a default Firebase app exists early (defensive for rare auto-init delays)
try {
  if (!getApps().length) {
    initializeApp({
      appId: '1:23485212227:android:96f452e88bcec725c656f6',
      projectId: 'academicconsultationbooking',
      apiKey: 'AIzaSyBP-cbZvQN9tKZ-kPjb_XH1Q_Y07fqATCk',
      storageBucket: 'academicconsultationbooking.firebasestorage.app',
      messagingSenderId: '23485212227'
    });
    console.log('[Firebase] Initialized (modular)');
  } else {
    console.log('[Firebase] Apps already initialized:', getApps().map(a=>a.name).join(','));
  }
} catch (e) { console.log('[Firebase] modular init failed', e); }

// Call once after login (or app start if token persisted)
export async function initPush(afterToken?: (t:string)=>void) {
  try {
    const apps = getApps();
    console.log('[FCM init] Existing Firebase apps:', apps.map(a=>a.name));
  } catch (e) { console.log('[FCM init] list apps error', e); }
  // Android <13 auto granted; still call for consistency
  await messaging().requestPermission();
  const fcmToken = await messaging().getToken();
  if (fcmToken) {
  console.log('[FCM] Token acquired =>', fcmToken);
    await AsyncStorage.setItem('fcmToken', fcmToken);
    try {
      const jwt = await AsyncStorage.getItem('jwtToken');
      await fetch(`${API_BASE_URL}/api/notifications/device-token`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json', Authorization: jwt?`Bearer ${jwt}`:'' },
        body: JSON.stringify({ token: fcmToken })
      });
    } catch {}
    afterToken?.(fcmToken);
  }
  await notifee.createChannel({ id:'default', name:'Default', importance: AndroidImportance.HIGH });

  // Foreground messages
  messaging().onMessage(async remoteMessage => {
    const rawTitle = remoteMessage.notification?.title || remoteMessage.data?.title || 'Notification';
    const rawBody = remoteMessage.notification?.body || remoteMessage.data?.body || (remoteMessage.data?.message as string) || '';
    const title = typeof rawTitle === 'string' ? rawTitle : JSON.stringify(rawTitle);
    const body = typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody);
    const data: Record<string,string> = {};
    Object.entries(remoteMessage.data || {}).forEach(([k,v])=>{ if (typeof v === 'string') data[k]=v; else data[k]=JSON.stringify(v); });
    await notifee.displayNotification({ title, body, android:{ channelId:'default', pressAction:{ id:'default' } }, data });
  });

  // Token refresh handling
  messaging().onTokenRefresh(async newToken => {
    console.log('[FCM] Token refreshed =>', newToken);
    await AsyncStorage.setItem('fcmToken', newToken);
    try {
      const jwt = await AsyncStorage.getItem('jwtToken');
      await fetch(`${API_BASE_URL}/api/notifications/device-token`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json', Authorization: jwt?`Bearer ${jwt}`:'' },
        body: JSON.stringify({ token: newToken })
      });
    } catch {}
  });

  // Foreground tap events
  notifee.onForegroundEvent(async ({ type, detail }) => {
    if (type === EventType.PRESS) {
      const data = detail.notification?.data;
      console.log('[Notifee] Foreground press', data);
      if (data) {
        safeNavigate('Notifications');
      }
    }
  });
}

// Background / quit handler
authRegisterBackground();
function authRegisterBackground(){
  messaging().setBackgroundMessageHandler(async remoteMessage => {
    const rawTitle = remoteMessage.notification?.title || remoteMessage.data?.title || 'Notification';
    const rawBody = remoteMessage.notification?.body || remoteMessage.data?.body || (remoteMessage.data?.message as string) || '';
    const title = typeof rawTitle === 'string' ? rawTitle : JSON.stringify(rawTitle);
    const body = typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody);
    const data: Record<string,string> = {};
    Object.entries(remoteMessage.data || {}).forEach(([k,v])=>{ if (typeof v === 'string') data[k]=v; else data[k]=JSON.stringify(v); });
    await notifee.displayNotification({ title, body, android:{ channelId:'default', pressAction:{ id:'default' } }, data });
  });
}
