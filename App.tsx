
import React, { useContext, useEffect } from 'react';
import MainApp from './components/MainApp';
import { SettingsContext } from './contexts/SettingsContext';

const App: React.FC = () => {
  const { theme } = useContext(SettingsContext);

  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

  return (
    <div className={`w-full h-screen overflow-hidden bg-background text-text-primary`}>
      <MainApp />
    </div>
  );
};

export default App;
