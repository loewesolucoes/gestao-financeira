"use client";

import React, { createContext, useEffect, useState } from "react"

type AvailableThemes = 'system' | 'light' | 'dark';

const ThemeContext = createContext({
  theme: 'light' as AvailableThemes,
  setTheme: (theme: AvailableThemes) => { },
});

const THEME_STORAGE_KEY = 'theme';

export function ThemeProvider(props: any) {
  const [theme, setTheme] = useState<AvailableThemes>('light');

  useEffect(() => {
    setTheme(getNextThemeOrDefault(localStorage.getItem(THEME_STORAGE_KEY)));
  }, []);

  useEffect(() => {
    const html = document.querySelector('html');

    if (!html) {
      console.warn('HTML element not found');
      return;
    }

    const currentTheme = html.getAttribute('data-bs-theme');
    const nextTheme = getNextThemeOrDefault(theme);
    
    if (currentTheme !== nextTheme) {
      localStorage.setItem(THEME_STORAGE_KEY, theme)
      html.setAttribute('data-bs-theme', nextTheme);
    }
  }, [theme]);

  function getNextThemeOrDefault(theme: string | null): AvailableThemes {
    return theme == null || theme?.trim() === '' || theme === 'system' ? (isSystemThemeDark() ? 'dark' : 'light') : theme as AvailableThemes;
  }

  function isSystemThemeDark(): boolean {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
      }}
      {...props}
    />
  )
}

export const useTheme = () => React.useContext(ThemeContext)