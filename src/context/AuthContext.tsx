import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initPush } from '../push/messagingSetup';

interface AuthContextValue {
  token: string | null;
  loading: boolean; // bootstrapping
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('jwtToken');
        if (stored) {
          setToken(stored);
          try { await initPush(); } catch {}
        }
      } finally { setLoading(false); }
    })();
  }, []);

  const login = useCallback(async (t: string) => {
    await AsyncStorage.setItem('jwtToken', t);
    setToken(t);
    try { await initPush(); } catch {}
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem('jwtToken');
    setToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
