import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type AppTheme = 'fofo' | 'classico' | 'serio';

const STORAGE_KEY = 'praxis_theme';
const DEFAULT: AppTheme = 'fofo';

interface ThemeCtx {
  theme: AppTheme;
  setTheme: (t: AppTheme) => void;
}

const Ctx = createContext<ThemeCtx>({ theme: DEFAULT, setTheme: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return (stored === 'classico' || stored === 'serio' || stored === 'fofo') ? stored : DEFAULT;
  });

  const setTheme = (t: AppTheme) => {
    setThemeState(t);
    localStorage.setItem(STORAGE_KEY, t);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Apply on mount
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, []);

  return <Ctx.Provider value={{ theme, setTheme }}>{children}</Ctx.Provider>;
}

export const useTheme = () => useContext(Ctx);
