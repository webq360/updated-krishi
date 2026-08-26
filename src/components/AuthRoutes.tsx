import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { safeLocalStorage } from '../lib/storage';
import { LoadingScreen } from './Loaders';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const authToken = safeLocalStorage.getItem('authToken');
      const userStr = safeLocalStorage.getItem('user');

      if (!authToken) {
        setIsAuthenticated(false);
        return;
      }

      try {
        // Optional quick token verification with MongoDB backend
        const res = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (res.ok) {
          setIsAuthenticated(true);
        } else {
          // If token invalid, remove and redirect
          safeLocalStorage.removeItem('authToken');
          safeLocalStorage.removeItem('user');
          setIsAuthenticated(false);
        }
      } catch (err) {
        // If offline or network error, allow if local token exists
        if (userStr) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      }
    };

    checkAuth();
  }, []);

  if (isAuthenticated === null) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAdmin = async () => {
      const authToken = safeLocalStorage.getItem('authToken');
      const userStr = safeLocalStorage.getItem('user');

      if (!authToken) {
        setIsAdmin(false);
        return;
      }

      try {
        const user = userStr ? JSON.parse(userStr) : null;
        if (user && user.role === 'admin') {
          setIsAdmin(true);
          return;
        }

        const res = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setIsAdmin(data.role === 'admin');
        } else {
          setIsAdmin(false);
        }
      } catch (err) {
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            setIsAdmin(user.role === 'admin');
            return;
          } catch {}
        }
        setIsAdmin(false);
      }
    };

    checkAdmin();
  }, []);

  if (isAdmin === null) return <LoadingScreen />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}
