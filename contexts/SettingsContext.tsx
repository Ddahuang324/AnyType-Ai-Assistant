import React, { createContext, useState, useEffect } from 'react';
import type { Space } from '../types';

type Theme = 'light' | 'dark';
export type AiProvider = 'gemini' | 'openai' | 'anthropic' | '';


interface SettingsContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  aiProvider: AiProvider,
  setAiProvider: (provider: AiProvider) => void;
  aiApiKey: string;
  setAiApiKey: (key: string) => void;
  aiModel: string;
  setAiModel: (model: string) => void;
  anytypeApiEndpoint: string;
  setAnytypeApiEndpoint: (endpoint: string) => void;
  anytypeApiKey: string;
  setAnytypeApiKey: (key: string) => void;
  resetConfiguration: () => void;
}

export const SettingsContext = createContext<SettingsContextType>({
  theme: 'light',
  setTheme: () => {},
  aiProvider: '',
  setAiProvider: () => {},
  aiApiKey: '',
  setAiApiKey: () => {},
  aiModel: '',
  setAiModel: () => {},
  anytypeApiEndpoint: '',
  setAnytypeApiEndpoint: () => {},
  anytypeApiKey: '',
  setAnytypeApiKey: () => {},
  resetConfiguration: () => {},
});

interface SettingsProviderProps {
  children: React.ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('light');
  const [aiProvider, setAiProviderState] = useState<AiProvider>('');
  const [aiApiKey, setAiApiKeyState] = useState<string>('');
  const [aiModel, setAiModelState] = useState<string>('');
  const [anytypeApiEndpoint, setAnytypeApiEndpointState] = useState<string>('');
  const [anytypeApiKey, setAnytypeApiKeyState] = useState<string>('');

  useEffect(() => {
    // Load settings from localStorage on initial load
    const savedTheme = localStorage.getItem('anytype-theme') as Theme | null;
    if (savedTheme) {
      setThemeState(savedTheme);
    } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setThemeState(prefersDark ? 'dark' : 'light');
    }
    
    setAiProviderState(localStorage.getItem('anytype-ai-provider') as AiProvider || '');
    setAiApiKeyState(localStorage.getItem('anytype-ai-key') || '');
    setAiModelState(localStorage.getItem('anytype-ai-model') || '');
    setAnytypeApiEndpointState(localStorage.getItem('anytype-api-endpoint') || '');
    setAnytypeApiKeyState(localStorage.getItem('anytype-api-key') || '');

  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('anytype-theme', newTheme);
  };

  const setAiProvider = (provider: AiProvider) => {
    setAiProviderState(provider);
    localStorage.setItem('anytype-ai-provider', provider);
  }

  const setAiApiKey = (key: string) => {
    setAiApiKeyState(key);
    localStorage.setItem('anytype-ai-key', key);
  }

  const setAiModel = (model: string) => {
    setAiModelState(model);
    localStorage.setItem('anytype-ai-model', model);
  }

  const setAnytypeApiEndpoint = (endpoint: string) => {
    setAnytypeApiEndpointState(endpoint);
    localStorage.setItem('anytype-api-endpoint', endpoint);
  }

  const setAnytypeApiKey = (key: string) => {
    setAnytypeApiKeyState(key);
    localStorage.setItem('anytype-api-key', key);
  }

  const resetConfiguration = () => {
    // Clear state
    setAiProviderState('');
    setAiApiKeyState('');
    setAiModelState('');
    setAnytypeApiEndpointState('');
    setAnytypeApiKeyState('');
    
    // Clear localStorage
    localStorage.removeItem('anytype-ai-provider');
    localStorage.removeItem('anytype-ai-key');
    localStorage.removeItem('anytype-ai-model');
    localStorage.removeItem('anytype-api-endpoint');
    localStorage.removeItem('anytype-api-key');
  }


  return (
    <SettingsContext.Provider value={{ theme, setTheme, aiProvider, setAiProvider, aiApiKey, setAiApiKey, aiModel, setAiModel, anytypeApiEndpoint, setAnytypeApiEndpoint, anytypeApiKey, setAnytypeApiKey, resetConfiguration }}>
      {children}
    </SettingsContext.Provider>
  );
};
