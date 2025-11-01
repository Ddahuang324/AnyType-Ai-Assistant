
import React, { useState, useEffect, useContext } from 'react';
import LandingPage from './components/LandingPage';
import MainApp from './components/MainApp';
import { SettingsContext } from './contexts/SettingsContext';

const App: React.FC = () => {
  const [isAppVisible, setIsAppVisible] = useState(false);
  const [isLandingPageMounted, setIsLandingPageMounted] = useState(true);
  const { theme } = useContext(SettingsContext);

  const handleEnterApp = () => {
    setIsAppVisible(true);
  };

  useEffect(() => {
    if (isAppVisible) {
      const timer = setTimeout(() => {
        setIsLandingPageMounted(false);
      }, 1000); // Corresponds to the fade-out duration
      return () => clearTimeout(timer);
    }
  }, [isAppVisible]);
  
  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);


  return (
    <div className={`relative w-full h-screen overflow-hidden bg-background text-text-primary`}>
      {isLandingPageMounted && (
        <div
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            isAppVisible ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <LandingPage onEnter={handleEnterApp} />
        </div>
      )}
      <div
        className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
          isAppVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {isAppVisible && <MainApp />}
      </div>
    </div>
  );
};

export default App;