import React, { useState, useEffect, createContext, useContext } from 'react';
import { db, collection, query, where, onSnapshot, orderBy, limit, doc, updateDoc, getCurrentUser } from '../lib/db';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, Info, AlertTriangle, CloudRain, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';
import { safeLocalStorage } from '../lib/storage';

interface Notification {
  id: string;
  title: string;
  body: string;
  type: 'info' | 'warning' | 'weather' | 'success';
  userId?: string;
  read: boolean;
  createdAt: any;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  requestPushPermission: () => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [toast, setToast] = useState<Notification | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    let unsubscribe: () => void = () => {};

    const setupListener = () => {
      const user = getCurrentUser();
      try {
        const q = query(
          collection(db, 'notifications'),
          orderBy('createdAt', 'desc'),
          limit(20)
        );

        unsubscribe = onSnapshot(q, (snapshot) => {
          const allNotifs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Notification));
          // Filter for this user or global notifications
          const filteredNotifs = allNotifs.filter(
            n => !n.userId || n.userId === 'all' || (user && (n.userId === user.id || n.userId === user._id))
          );

          if (filteredNotifs.length > 0) {
            const newest = filteredNotifs[0];
            const lastSeenId = safeLocalStorage.getItem('last_notif_id');

            if (newest.id !== lastSeenId && !newest.read) {
              setToast(newest);
              safeLocalStorage.setItem('last_notif_id', newest.id);
              setTimeout(() => setToast(null), 5000);

              if (typeof window !== 'undefined' && 'Notification' in window && (window.Notification as any).permission === 'granted' && document.hidden) {
                new window.Notification(newest.title, { body: newest.body });
              }
            }
          }
          setNotifications(filteredNotifs);
        }, (err) => {
          console.error("Notifications snapshot error:", err);
        });
      } catch (err) {
        console.error("Failed to setup notifications:", err);
      }
    };

    setupListener();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (e) {
      console.error("Error marking notification as read", e);
    }
  };

  const requestPushPermission = async () => {
    if (!('Notification' in window)) return false;
    
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, requestPushPermission }}>
      {children}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-20 right-4 z-50 max-w-sm bg-white dark:bg-dark-surface border border-organic-green/20 shadow-2xl rounded-2xl p-4 flex items-start gap-4"
          >
            <div className={cn(
              "p-2 rounded-xl text-white mt-0.5",
              toast.type === 'warning' ? "bg-amber-500" :
              toast.type === 'weather' ? "bg-blue-500" :
              toast.type === 'success' ? "bg-emerald-500" : "bg-organic-green"
            )}>
              {toast.type === 'warning' && <AlertTriangle size={18} />}
              {toast.type === 'weather' && <CloudRain size={18} />}
              {toast.type === 'success' && <CheckCircle2 size={18} />}
              {toast.type === 'info' && <Info size={18} />}
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-black text-organic-dark dark:text-white uppercase tracking-tight">
                {toast.title}
              </h4>
              <p className="text-xs text-organic-dark/60 dark:text-gray-300 font-medium mt-0.5 line-clamp-2">
                {toast.body}
              </p>
            </div>
            <button 
              onClick={() => setToast(null)}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
  return context;
}
