import React, { useState, useEffect, createContext, useContext } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit, doc, updateDoc, Timestamp, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase';
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
  userId: string;
  read: boolean;
  createdAt: Timestamp;
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

    const setupListener = (authUser: any) => {
      if (!authUser) {
        setNotifications([]);
        return;
      }

      try {
        const q = query(
          collection(db, 'notifications'),
          where('userId', 'in', [authUser.uid, 'all']),
          orderBy('createdAt', 'desc'),
          limit(20)
        );

        unsubscribe = onSnapshot(q, (snapshot) => {
          const newNotifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
          
          if (newNotifs.length > 0) {
            const newest = newNotifs[0];
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
          setNotifications(newNotifs);
        }, (err) => {
          console.error("Notifications snapshot error:", err);
        });
      } catch (err) {
        console.error("Failed to setup notifications:", err);
      }
    };

    const authUnsub = onAuthStateChanged(auth, (user) => {
      if (unsubscribe) unsubscribe();
      setupListener(user);
    });

    return () => {
      authUnsub();
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
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
      
      {/* Global Notification Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={() => setToast(null)}
            className="fixed top-24 right-4 z-[100] max-w-sm w-full bg-white rounded-3xl shadow-2xl border border-organic-green/10 overflow-hidden cursor-pointer group"
          >
            <div className="flex p-5 gap-4">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg",
                toast.type === 'warning' ? "bg-amber-500 text-white" :
                toast.type === 'weather' ? "bg-blue-500 text-white" :
                toast.type === 'success' ? "bg-green-500 text-white" : "bg-organic-green text-white"
              )}>
                {toast.type === 'warning' ? <AlertTriangle size={20} /> :
                 toast.type === 'weather' ? <CloudRain size={20} /> :
                 toast.type === 'success' ? <CheckCircle2 size={20} /> : <Bell size={20} />}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-black text-organic-dark text-sm truncate uppercase tracking-tight">{toast.title}</h4>
                <p className="text-xs text-organic-dark/60 font-medium line-clamp-2 mt-1">{toast.body}</p>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); setToast(null); }}
                className="text-organic-dark/20 hover:text-organic-dark/60 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="h-1 w-full bg-gray-100">
              <motion.div 
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 5, ease: "linear" }}
                className="h-full bg-organic-green"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
