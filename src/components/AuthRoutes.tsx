import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { safeLocalStorage } from '../lib/storage';
import { LoadingScreen } from './Loaders';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bypass, setBypass] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
      console.warn("ProtectedRoute: Auth took too long, attempting bypass check");
    }, 5000);

    let bypassActive = false;
    try {
      // Check MongoDB auth (via authToken)
      const authToken = safeLocalStorage.getItem('authToken');
      if (authToken) {
        bypassActive = true;
        setBypass(true);
        setLoading(false);
        return;
      }

      // Check Firebase auth or legacy bypasses
      const isAdminBypass = safeLocalStorage.getItem('isAdmin') === 'true';
      const isUserBypass = safeLocalStorage.getItem('isUser') === 'true';
      if (isAdminBypass || isUserBypass) {
        bypassActive = true;
        setBypass(true);
      }
    } catch (e) {
      console.warn("LocalStorage access failed", e);
    }

    const unsub = onAuthStateChanged(auth, (authUser) => {
      console.log("ProtectedRoute: Auth status changed", authUser ? "User logged in" : "No user");
      clearTimeout(timer);
      setUser(authUser);
      setLoading(false);
    });

    return () => {
      clearTimeout(timer);
      unsub();
    };
  }, []); // Run once on mount

  if (loading) return <LoadingScreen />;
  if (!user && !bypass) return <Navigate to="/login" />;
  return <>{children}</>;
}

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    let bypassAdmin = false;
    
    // Check MongoDB admin via authToken
    try {
      const authToken = safeLocalStorage.getItem('authToken');
      if (authToken) {
        const user = JSON.parse(safeLocalStorage.getItem('user') || '{}');
        if (user.role === 'admin') {
          setIsAdmin(true);
          return;
        }
      }
    } catch (e) {
      console.warn("MongoDB admin check failed", e);
    }

    // Check Firebase admin
    if (safeLocalStorage.getItem('isAdmin') === 'true') {
      bypassAdmin = true;
      setIsAdmin(true);
    }

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (!bypassAdmin) setIsAdmin(false);
        return;
      }
      
      if (user.email === 'admin@farmexagro.com' || user.email === 'absfeed.info@gmail.com') {
        setIsAdmin(true);
        safeLocalStorage.setItem('isAdmin', 'true');
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const status = userDoc.exists() && userDoc.data().role === 'admin';
        setIsAdmin(status);
        if (status) safeLocalStorage.setItem('isAdmin', 'true');
      } catch (err) {
        if (!bypassAdmin) setIsAdmin(false);
      }
    });
    return () => unsub();
  }, []);

  if (isAdmin === null) return <LoadingScreen />;
  if (!isAdmin) return <Navigate to="/" />;
  return <>{children}</>;
}
