import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemePreference = 'system' | 'light' | 'dark';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceHighlight: string;
  primary: string;
  secondary: string;
  text: string;
  textSecondary: string;
  border: string;
  card: string;
  cardBorder: string;
  danger: string;
  success: string;
  tabBar: string;
  tabBarBorder: string;
  tabBarActiveTint: string;
  tabBarInactiveTint: string;
  iconDefault: string;
  iconHighlight: string;
  isDark: boolean;
}

const LIGHT_COLORS: ThemeColors = {
  background: '#FFFFFF',
  surface: '#F7F7F7',
  surfaceHighlight: '#EFEFEF',
  primary: '#2AA8FF',
  secondary: '#171C1D',
  text: '#171C1D',
  textSecondary: '#9E9E9E',
  border: '#EFEFEF',
  card: '#F7F7F7',
  cardBorder: '#EFEFEF',
  danger: '#E5484D',
  success: '#27AE60',
  tabBar: '#ccecff',
  tabBarBorder: '#EFEFEF',
  tabBarActiveTint: '#171C1D',
  tabBarInactiveTint: '#ABABAB',
  iconDefault: '#686868',
  iconHighlight: '#171C1D',
  isDark: false,
};

const DARK_COLORS: ThemeColors = {
  background: '#121212',
  surface: '#1E1E1E',
  surfaceHighlight: '#2A2A2A',
  primary: '#2AA8FF',
  secondary: '#BFFF5A',
  text: '#FFFFFF',
  textSecondary: '#9B9B9B',
  border: '#2A2A2A',
  card: '#1E1E1E',
  cardBorder: '#2A2A2A',
  danger: '#FF3B30',
  success: '#4ADE80',
  tabBar: '#1A1A1A',
  tabBarBorder: '#2A2A2A',
  tabBarActiveTint: '#FFFFFF',
  tabBarInactiveTint: '#888888',
  iconDefault: '#AAAAAA',
  iconHighlight: '#FFFFFF',
  isDark: true,
};

interface ThemeContextType {
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => void;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'theme_preference';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored: string | null) => {
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setPreferenceState(stored);
      }
    });
  }, []);

  const setPreference = async (p: ThemePreference) => {
    setPreferenceState(p);
    await AsyncStorage.setItem(STORAGE_KEY, p);
  };

  const resolvedDark =
    preference === 'dark' ||
    (preference === 'system' && systemScheme === 'dark');

  const colors = resolvedDark ? DARK_COLORS : LIGHT_COLORS;

  return (
    <ThemeContext.Provider value={{ preference, setPreference, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
