
import React, { createContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

interface SettingsContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  geminiApiKey: string;
  setGeminiApiKey: (key: string) => void;
  anytypeApiKey: string;
  setAnytypeApiKey: (key: string) => void;
  anytypeApiEndpoint: string;
  setAnytypeApiEndpoint: (url: string) => void;
}

export const SettingsContext = createContext<SettingsContextType>({
  theme: 'light',
  setTheme: () => {},
  geminiApiKey: '',
  setGeminiApiKey: () => {},
  anytypeApiKey: '',
  setAnytypeApiKey: () => {},
  anytypeApiEndpoint: '',
  setAnytypeApiEndpoint: () => {},
});

interface SettingsProviderProps {
  children: React.ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('light');
  const [geminiApiKey, setGeminiApiKeyState] = useState<string>('');
  const [anytypeApiKey, setAnytypeApiKeyState] = useState<string>('');
  const [anytypeApiEndpoint, setAnytypeApiEndpointState] = useState<string>('');

  useEffect(() => {
    // Load settings from localStorage on initial load
    const savedTheme = localStorage.getItem('anytype-theme') as Theme | null;
    if (savedTheme) {
      setThemeState(savedTheme);
    } else {
        // Set theme based on system preference if no theme is saved
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setThemeState(prefersDark ? 'dark' : 'light');
    }
    
    const savedGeminiKey = localStorage.getItem('anytype-gemini-key');
    if (savedGeminiKey) setGeminiApiKeyState(savedGeminiKey);

    const savedAnytypeKey = localStorage.getItem('anytype-anytype-key');
    if (savedAnytypeKey) setAnytypeApiKeyState(savedAnytypeKey);

    const savedAnytypeEndpoint = localStorage.getItem('anytype-anytype-endpoint');
    if (savedAnytypeEndpoint) setAnytypeApiEndpointState(savedAnytypeEndpoint);

  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('anytype-theme', newTheme);
  };

  const setGeminiApiKey = (key: string) => {
    setGeminiApiKeyState(key);
    localStorage.setItem('anytype-gemini-key', key);
  }

  const setAnytypeApiKey = (key: string) => {
    setAnytypeApiKeyState(key);
    localStorage.setItem('anytype-anytype-key', key);
  }

  const setAnytypeApiEndpoint = (url: string) => {
    setAnytypeApiEndpointState(url);
    localStorage.setItem('anytype-anytype-endpoint', url);
  }


  return (
    <SettingsContext.Provider value={{ theme, setTheme, geminiApiKey, setGeminiApiKey, anytypeApiKey, setAnytypeApiKey, anytypeApiEndpoint, setAnytypeApiEndpoint }}>
      {children}
    </SettingsContext.Provider>
  );
};
