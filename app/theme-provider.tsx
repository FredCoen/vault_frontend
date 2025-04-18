'use client';

import { createContext, useState, useEffect, useContext, ReactNode } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');

  // Initialize theme from localStorage if available and set classes
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme || 'dark';
    setTheme(savedTheme);
    
    // Apply theme classes to html and body
    document.documentElement.classList.toggle('light-mode', savedTheme === 'light');
    document.documentElement.classList.toggle('dark-mode', savedTheme === 'dark');
    document.body.classList.toggle('light-mode', savedTheme === 'light');
    document.body.classList.toggle('dark-mode', savedTheme === 'dark');
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Toggle theme classes on html and body elements
    document.documentElement.classList.toggle('light-mode', newTheme === 'light');
    document.documentElement.classList.toggle('dark-mode', newTheme === 'dark');
    document.body.classList.toggle('light-mode', newTheme === 'light');
    document.body.classList.toggle('dark-mode', newTheme === 'dark');
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