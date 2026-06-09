import { createContext, use, useState, useCallback, useEffect, useRef, useMemo, type ReactNode } from 'react';
import type { AppNotification } from '../types/domain';
import { initialNotifications, incomingPool } from '../data/notifications';
import { fetchNotifications } from '../lib/db';
import { useAuth } from '../lib/auth';

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

const NotificationContext = createContext<NotificationState>({
  notifications: [],
  unreadCount: 0,
  markAsRead: () => {},
  markAllAsRead: () => {},
});

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    initialNotifications.map(n => ({ ...n }))
  );
  const fetchedFromDb = useRef(false);
  const poolIndex = useRef(0);

  useEffect(() => {
    if (!user?.id || fetchedFromDb.current) return;
    fetchNotifications(user.id).then(dbNotifications => {
      if (dbNotifications.length > 0) {
        setNotifications(dbNotifications);
      }
      fetchedFromDb.current = true;
    });
  }, [user?.id]);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  useEffect(() => {
    if (incomingPool.length === 0 || fetchedFromDb) return;
    const interval = setInterval(() => {
      if (poolIndex.current >= incomingPool.length) return;
      const item = incomingPool[poolIndex.current];
      poolIndex.current += 1;
      setNotifications(prev => [{ ...item, createdAt: new Date().toISOString() } as AppNotification, ...prev]);
    }, 35000);
    return () => clearInterval(interval);
  }, [fetchedFromDb]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const value = useMemo(() => ({ notifications, unreadCount, markAsRead, markAllAsRead }), [notifications, unreadCount, markAsRead, markAllAsRead]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return use(NotificationContext);
}
