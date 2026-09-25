import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants';
import {
  darkTheme,
  lightTheme,
  type AppTheme,
  type ResolvedTheme,
  type ThemePreference,
} from '../constants/theme';

type ThemeContextValue = {
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  theme: AppTheme;
  isDark: boolean;
  carregando: boolean;
  setPreference: (preference: ThemePreference) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function isThemePreference(value: string | null): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;

    AsyncStorage.getItem(STORAGE_KEYS.THEME_PREFERENCE)
      .then(valor => {
        if (ativo && isThemePreference(valor)) setPreferenceState(valor);
      })
      .catch(() => undefined)
      .finally(() => {
        if (ativo) setCarregando(false);
      });

    return () => {
      ativo = false;
    };
  }, []);

  const setPreference = useCallback(async (novaPreferencia: ThemePreference) => {
    setPreferenceState(novaPreferencia);
    await AsyncStorage.setItem(STORAGE_KEYS.THEME_PREFERENCE, novaPreferencia);
  }, []);

  const resolvedTheme: ResolvedTheme = preference === 'system'
    ? (systemColorScheme === 'dark' ? 'dark' : 'light')
    : preference;
  const theme = resolvedTheme === 'dark' ? darkTheme : lightTheme;

  const value = useMemo<ThemeContextValue>(() => ({
    preference,
    resolvedTheme,
    theme,
    isDark: resolvedTheme === 'dark',
    carregando,
    setPreference,
  }), [carregando, preference, resolvedTheme, setPreference, theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
