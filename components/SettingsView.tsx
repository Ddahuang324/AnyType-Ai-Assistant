
import React, { useContext, useState, useEffect } from 'react';
import { SettingsContext } from '../contexts/SettingsContext';
import type { AiProvider, AiModel } from '../services/aiService';
import * as aiService from '../services/aiService';
import GemIcon from './icons/GemIcon';
import OpenAIIcon from './icons/OpenAIIcon';
import AnthropicIcon from './icons/AnthropicIcon';
import LoaderIcon from './icons/LoaderIcon';
import ArrowLeftIcon from './icons/ArrowLeftIcon';

interface SettingsViewProps {
  onBack: () => void;
}

const PROVIDERS: { id: AiProvider; name: string; Icon: React.FC<{className?: string}> }[] = [
    { id: 'gemini', name: 'Gemini', Icon: ({className}) => <div className={`flex items-center justify-center rounded-lg bg-sky-500 ${className}`}><GemIcon/></div> },
    { id: 'openai', name: 'OpenAI', Icon: ({className}) => <div className={`flex items-center justify-center rounded-lg bg-black ${className}`}><OpenAIIcon/></div> },
    { id: 'anthropic', name: 'Anthropic', Icon: ({className}) => <div className={`flex items-center justify-center rounded-lg bg-amber-800 ${className}`}><AnthropicIcon /></div> },
];

const SettingsView: React.FC<SettingsViewProps> = ({ onBack }) => {
  const { 
      theme, setTheme, 
      aiProvider, setAiProvider,
      aiApiKey, setAiApiKey,
      aiModel, setAiModel,
      anytypeApiKey, setAnytypeApiKey,
      anytypeApiEndpoint, setAnytypeApiEndpoint,
      resetConfiguration
  } = useContext(SettingsContext);

  // Local state for form inputs
  const [currentProvider, setCurrentProvider] = useState<AiProvider>(aiProvider || 'gemini');
  const [currentAiKey, setCurrentAiKey] = useState(aiApiKey);
  const [selectedModelId, setSelectedModelId] = useState(aiModel);
  const [currentAnytypeKey, setCurrentAnytypeKey] = useState(anytypeApiKey);
  const [currentAnytypeEndpoint, setCurrentAnytypeEndpoint] = useState(anytypeApiEndpoint);

  // Local UI state
  const [validationState, setValidationState] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
  const [availableModels, setAvailableModels] = useState<AiModel[]>([]);

  // Effect to load models if a key already exists
  useEffect(() => {
    if (aiApiKey && aiProvider) {
      setValidationState('valid');
      handleVerifyKey(aiProvider, aiApiKey, true); // silent verify to get models
    } else {
      setValidationState('idle');
      setAvailableModels([]);
    }
  }, []);

  const handleThemeChange = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleProviderChange = (provider: AiProvider) => {
    setCurrentProvider(provider);
    setCurrentAiKey('');
    setSelectedModelId('');
    setValidationState('idle');
    setAvailableModels([]);
  };

  const handleVerifyKey = async (provider: AiProvider, key: string, silent = false) => {
    if (!key.trim()) return;
    if (!silent) setValidationState('validating');
    
    const isValid = await aiService.validateApiKey(provider, key);
    if (isValid) {
      setValidationState('valid');
      const models = await aiService.listModels(provider, key);
      setAvailableModels(models);
      if (models.length > 0 && !models.some(m => m.id === selectedModelId)) {
        setSelectedModelId(models[0].id);
      }
    } else {
      setValidationState('invalid');
      setAvailableModels([]);
    }
  };
  
  const handleSaveChanges = () => {
    if (validationState === 'valid' || currentAiKey === '') {
      setAiProvider(currentProvider);
      setAiApiKey(currentAiKey);
      setAiModel(selectedModelId);
    }
    setAnytypeApiKey(currentAnytypeKey);
    setAnytypeApiEndpoint(currentAnytypeEndpoint);
    onBack();
  };
  
  const handleReset = () => {
    resetConfiguration();
    onBack();
  }
  
  return (
    <div className="w-full h-screen flex flex-col bg-background text-text-primary">
      <header className="flex-shrink-0 flex items-center p-2 md:p-4 bg-background border-b border-border sticky top-0 z-10">
        <button onClick={onBack} className="flex items-center text-text-secondary hover:text-text-primary transition-colors duration-200 p-2 rounded-lg hover:bg-ui-hover-background">
          <ArrowLeftIcon />
          <span className="ml-2 font-medium hidden md:inline">Back</span>
        </button>
        <h1 className="text-xl font-bold text-text-primary mx-auto">Settings</h1>
        <div className="w-16 md:w-24"></div> {/* Spacer */}
      </header>
      
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-8">
            
            {/* Appearance Section */}
            <section>
              <h2 className="font-semibold text-xs text-text-secondary uppercase tracking-wider mb-3">Appearance</h2>
              <div className="bg-ui-background rounded-lg p-4">
                <div className="flex items-center justify-between">
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
            </section>
            
            {/* AI Provider Section */}
            <section>
              <h2 className="font-semibold text-xs text-text-secondary uppercase tracking-wider mb-3">AI Provider</h2>
              <div className="bg-ui-background rounded-lg p-4 space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  {PROVIDERS.map(({id, name, Icon}) => (
                      <button key={id} onClick={() => handleProviderChange(id)} className={`p-3 border rounded-lg flex flex-col items-center justify-center space-y-2 transition-all text-center ${currentProvider === id ? 'border-brand-primary ring-2 ring-brand-primary' : 'border-border hover:border-text-secondary/50'}`}>
                          <Icon className="w-8 h-8"/>
                          <span className="text-sm font-medium text-text-primary">{name}</span>
                      </button>
                  ))}
                </div>
                <div>
                  <label className="text-sm font-medium text-text-primary" htmlFor="ai-key">API Key</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <input id="ai-key" type="password" value={currentAiKey} onChange={e => { setCurrentAiKey(e.target.value); setValidationState('idle'); }} placeholder="Your API Key" className="w-full text-sm p-2 bg-background rounded-md border border-border focus:ring-1 focus:ring-brand-primary"/>
                    <button onClick={() => handleVerifyKey(currentProvider, currentAiKey)} disabled={!currentAiKey || validationState === 'validating'} className="p-2 text-sm font-semibold bg-border rounded-md hover:bg-text-secondary/20 disabled:opacity-50">
                      {validationState === 'validating' ? <LoaderIcon className="h-5 w-5" /> : 'Verify'}
                    </button>
                  </div>
                  {validationState === 'invalid' && <p className="text-red-500 text-xs mt-1">Invalid API key.</p>}
                  {validationState === 'valid' && <p className="text-green-500 text-xs mt-1">API Key is valid.</p>}
                </div>

                {validationState === 'valid' && availableModels.length > 0 && (
                  <div className="animate-fade-in-up">
                    <label className="text-sm font-medium text-text-primary" htmlFor="ai-model">Model</label>
                     <select id="ai-model" value={selectedModelId} onChange={e => setSelectedModelId(e.target.value)} className="w-full text-sm mt-1 p-2 bg-background rounded-md border border-border focus:ring-1 focus:ring-brand-primary">
                        {availableModels.map(model => <option key={model.id} value={model.id}>{model.name}</option>)}
                     </select>
                  </div>
                )}
              </div>
            </section>

            {/* Anytype Section */}
            <section>
              <h2 className="font-semibold text-xs text-text-secondary uppercase tracking-wider mb-3">Anytype API (Optional)</h2>
              <div className="bg-ui-background rounded-lg p-4 space-y-4">
                <div>
                  <label className="text-sm font-medium text-text-primary" htmlFor="anytype-endpoint">Endpoint</label>
                  <input id="anytype-endpoint" type="text" value={currentAnytypeEndpoint} onChange={e => setCurrentAnytypeEndpoint(e.target.value)} placeholder="API Endpoint" className="w-full text-sm mt-1 p-2 bg-background rounded-md border border-border focus:ring-1 focus:ring-brand-primary"/>
                </div>
                <div>
                  <label className="text-sm font-medium text-text-primary" htmlFor="anytype-key">API Key</label>
                  <input id="anytype-key" type="password" value={currentAnytypeKey} onChange={e => setCurrentAnytypeKey(e.target.value)} placeholder="Anytype API Key" className="w-full text-sm mt-1 p-2 bg-background rounded-md border border-border focus:ring-1 focus:ring-brand-primary"/>
                </div>
              </div>
            </section>
            
            {/* Actions */}
            <section className="sticky bottom-0 py-4 bg-background">
              <div className="max-w-3xl mx-auto space-y-3">
                  <button onClick={handleSaveChanges} className="w-full p-3 text-sm bg-brand-primary text-white font-semibold rounded-md hover:bg-brand-secondary transition-colors">
                      Save Changes
                  </button>
                  <button onClick={handleReset} className="w-full text-center p-3 text-sm bg-red-500/10 text-red-500 border border-red-500/20 rounded-md hover:bg-red-500/20 transition-colors duration-200 font-semibold">
                      Reset All Configuration
                  </button>
              </div>
            </section>
        </div>
      </main>
    </div>
  );
};

export default SettingsView;
