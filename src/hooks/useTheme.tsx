import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type Theme = 'default' | 'ocean' | 'forest' | 'sunset' | 'midnight' | 'lavender';

export type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  setTheme: (theme: Theme) => void;
  toggleThemeMode: () => void;
  mounted: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
const STORAGE_KEY = 'alfaaz-theme';
const MODE_STORAGE_KEY = 'alfaaz-theme-mode';

const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') return 'default';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && ['default', 'ocean', 'forest', 'sunset', 'midnight', 'lavender'].includes(stored)) {
    return stored as Theme;
  }
  return 'default';
};

const getInitialMode = (): ThemeMode => {
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem(MODE_STORAGE_KEY);
  if (stored === 'dark' || stored === 'light') return stored;
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
  return 'light';
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('default');
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const initialTheme = getInitialTheme();
    const initialMode = getInitialMode();
    setThemeState(initialTheme);
    setThemeModeState(initialMode);
    setMounted(true);
    applyTheme(initialTheme, initialMode);
  }, []);

  const applyTheme = (newTheme: Theme, newMode: ThemeMode) => {
    const root = document.documentElement;
    root.removeAttribute('data-theme');
    root.classList.remove('dark');
    if (newMode === 'dark') root.classList.add('dark');
    if (newTheme !== 'default') root.setAttribute('data-theme', newTheme);
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(STORAGE_KEY, newTheme);
    applyTheme(newTheme, themeMode);
  };

  const toggleThemeMode = () => {
    const newMode = themeMode === 'light' ? 'dark' : 'light';
    setThemeModeState(newMode);
    localStorage.setItem(MODE_STORAGE_KEY, newMode);
    applyTheme(theme, newMode);
  };

  return (
    <ThemeContext.Provider value={{ theme, themeMode, setTheme, toggleThemeMode, mounted }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
}

export const THEMES: { value: Theme; label: string; icon: string; description: string }[] = [
  { value: 'default', label: 'Classic', icon: '☀️', description: 'Warm ivory with saffron accents' },
  { value: 'ocean', label: 'Ocean', icon: '🌊', description: 'Deep blues and teals' },
  { value: 'forest', label: 'Forest', icon: '🌲', description: 'Greens and earth tones' },
  { value: 'sunset', label: 'Sunset', icon: '🌅', description: 'Warm pinks and oranges' },
  { value: 'midnight', label: 'Midnight', icon: '🌙', description: 'Deep navies and purples' },
  { value: 'lavender', label: 'Lavender', icon: '🪻', description: 'Soft violets and pinks' },
];

