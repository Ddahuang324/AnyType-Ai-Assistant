
import React, { useContext } from 'react';
import { SettingsContext } from '../contexts/SettingsContext';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
  const { theme, setTheme, geminiApiKey, setGeminiApiKey, anytypeApiKey, setAnytypeApiKey, anytypeApiEndpoint, setAnytypeApiEndpoint } = useContext(SettingsContext);

  const handleThemeChange = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  if (!isOpen) {
    return null;
  }

  return (
    <>
      <div 
        className="fixed inset-0 bg-black bg-opacity-30 z-40"
        onClick={onClose}
        aria-hidden="true"
      ></div>
      <div 
        className="absolute top-14 right-4 w-full max-w-xs bg-ui-background rounded-lg shadow-2xl border border-border z-50 transform transition-all duration-300 ease-out origin-top-right
                   animate-fade-in-down"
      >
        <div className="p-4">
          <h3 className="font-bold text-lg text-text-primary mb-4">Settings</h3>
          
          {/* Appearance Section */}
          <div className="mb-6">
            <h4 className="font-semibold text-sm text-text-secondary mb-2">Appearance</h4>
            <div className="flex items-center justify-between p-2 bg-ui-hover-background rounded-md">
              <span className="text-sm font-medium text-text-primary">Dark Mode</span>
              <button
                onClick={handleThemeChange}
                className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary`}
                style={{ backgroundColor: theme === 'dark' ? 'var(--brand-primary)' : '#CBD5E0' }}
              >
                <span
                  className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-300 ${
                    theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
          
          {/* AI Provider Section */}
          <div className="mb-6">
            <h4 className="font-semibold text-sm text-text-secondary mb-2">AI Provider</h4>
             <div className="space-y-3">
               <div>
                  <label htmlFor="ai-provider" className="block text-xs font-medium text-text-secondary mb-1">Provider</label>
                  <select id="ai-provider" className="w-full p-2 text-sm bg-ui-hover-background border border-border rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent">
                    <option>Gemini</option>
                  </select>
               </div>
               <div>
                  <label htmlFor="gemini-key" className="block text-xs font-medium text-text-secondary mb-1">API Key</label>
                  <input
                    id="gemini-key"
                    type="password"
                    placeholder="Enter your Gemini API key"
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                    className="w-full p-2 text-sm bg-ui-hover-background border border-border rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                  />
               </div>
            </div>
          </div>

          {/* Anytype API Section */}
          <div>
            <h4 className="font-semibold text-sm text-text-secondary mb-2">Anytype API</h4>
            <div className="space-y-3">
               <div>
                  <label htmlFor="anytype-endpoint" className="block text-xs font-medium text-text-secondary mb-1">API Endpoint</label>
                  <input
                    id="anytype-endpoint"
                    type="text"
                    placeholder="e.g., https://api.anytype.io"
                    value={anytypeApiEndpoint}
                    onChange={(e) => setAnytypeApiEndpoint(e.target.value)}
                    className="w-full p-2 text-sm bg-ui-hover-background border border-border rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                  />
               </div>
               <div>
                  <label htmlFor="anytype-key" className="block text-xs font-medium text-text-secondary mb-1">API Key</label>
                  <input
                    id="anytype-key"
                    type="password"
                    placeholder="Enter your Anytype API key"
                    value={anytypeApiKey}
                    onChange={(e) => setAnytypeApiKey(e.target.value)}
                    className="w-full p-2 text-sm bg-ui-hover-background border border-border rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                  />
               </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SettingsPanel;