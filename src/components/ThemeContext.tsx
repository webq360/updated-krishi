import React, { createContext, useContext, useEffect, useState } from 'react';
import { safeLocalStorage } from '../lib/storage';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const saved = safeLocalStorage.getItem('theme') as Theme;
      if (saved) return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    try {
      const root = window.document.documentElement;
      const body = window.document.body;
      
      console.log("Krishi Bondhu theme application:", theme);
      
      // Update data-theme attribute as well, some libraries prefer this
      root.setAttribute('data-theme', theme);
      
      if (theme === 'dark') {
        root.classList.add('dark');
        root.classList.remove('light');
        if (body) {
          body.classList.add('dark');
          body.classList.remove('light');
        }
      } else {
        root.classList.add('light');
        root.classList.remove('dark');
        if (body) {
          body.classList.add('light');
          body.classList.remove('dark');
        }
      }
      
      root.style.colorScheme = theme;
      safeLocalStorage.setItem('theme', theme);
    } catch (e) {
      console.error("Theme switch failed", e);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
