

import React, { useState, useEffect, useRef } from 'react';
import NotesView from './NotesView';
import ChatView from './ChatView';
import type { Space } from '../types';
import { MOCK_SPACES } from '../data/mockData';
import ChevronDownIcon from './icons/ChevronDownIcon';
import SettingsIcon from './icons/SettingsIcon';
import SettingsView from './SettingsView';
import { useOnClickOutside } from '../hooks/useOnClickOutside';
import MenuIcon from './icons/MenuIcon';
import CheckIcon from './icons/CheckIcon';
import XIcon from './icons/XIcon';

type View = 'notes' | 'chat';
type Screen = 'main' | 'settings';

const MainApp: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('notes');
  const [currentScreen, setCurrentScreen] = useState<Screen>('main');
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [activeSpaceId, setActiveSpaceId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSpaceSelectorOpen, setIsSpaceSelectorOpen] = useState(false);

  const spaceSelectorRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(spaceSelectorRef, () => setIsSpaceSelectorOpen(false));


  useEffect(() => {
    // In a real app, this would be an async fetch
    setSpaces(MOCK_SPACES);
    if (MOCK_SPACES.length > 0) {
      setActiveSpaceId(MOCK_SPACES[0].id);
    }
  }, []);

  const activeSpace = spaces.find(s => s.id === activeSpaceId) || null;

  const NavButton: React.FC<{ view: View; label: string }> = ({ view, label }) => (
    <button
      onClick={() => setActiveView(view)}
      className={`px-3 py-2 md:px-4 text-sm md:text-base rounded-md transition-all duration-300 ease-in-out font-medium
        ${activeView === view
          ? 'bg-ui-background text-text-primary shadow-sm'
          : 'text-text-secondary hover:text-text-primary'
        }`}
    >
      {label}
    </button>
  );

  const getInitials = (name: string): string => {
    if (!name) return '';
    const words = name.split(' ');
    return words.map(word => word[0]).slice(0, 2).join('').toUpperCase();
  };

  const generateColorFromName = (name: string): string => {
      if (!name) return 'bg-gray-500';
      let hash = 0;
      for (let i = 0; i < name.length; i++) {
          hash = name.charCodeAt(i) + ((hash << 5) - hash);
          hash = hash & hash;
      }
      const colors = [
          'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500',
          'bg-lime-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500',
          'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 'bg-indigo-500',
          'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500', 'bg-rose-500'
      ];
      return colors[Math.abs(hash) % colors.length];
  };

  if (currentScreen === 'settings') {
    return <SettingsView onBack={() => setCurrentScreen('main')} />;
  }

  return (
    <div className="w-full h-screen flex flex-col bg-background text-text-primary">
      <header className="flex justify-between items-center p-2 md:p-4 bg-background border-b border-border sticky top-0 z-20 space-x-2 md:space-x-4">
        <div className="flex-1 flex justify-start">
            {activeView === 'chat' && (
                <button 
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="p-2 rounded-full hover:bg-ui-hover-background transition-colors duration-200 md:hidden z-50"
                    aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
                >
                    {isSidebarOpen ? <XIcon className="h-6 w-6" /> : <MenuIcon />}
                </button>
            )}
        </div>

        <div className="flex justify-center items-center flex-shrink-0">
          {/* View Navigator */}
          <nav className="flex items-center space-x-1 md:space-x-2 p-1 bg-ui-hover-background rounded-lg">
            <NavButton view="notes" label="Project Hub" />
            <NavButton view="chat" label="AI Assistant" />
          </nav>
        </div>
        
        <div className="flex-1 flex justify-end items-center space-x-2 md:space-x-4">
            {/* Space Selector Dropdown */}
            <div ref={spaceSelectorRef} className="relative">
                <button
                    onClick={() => setIsSpaceSelectorOpen(!isSpaceSelectorOpen)}
                    className="flex items-center space-x-2 p-1.5 bg-ui-background border border-transparent rounded-lg hover:bg-ui-hover-background hover:border-border transition-all duration-200"
                    aria-label="Select a Space"
                    aria-haspopup="true"
                    aria-expanded={isSpaceSelectorOpen}
                >
                    {activeSpace && (
                        <div className={`w-7 h-7 rounded-md flex items-center justify-center ${generateColorFromName(activeSpace.name)}`}>
                            <span className="text-white font-bold text-xs">{getInitials(activeSpace.name)}</span>
                        </div>
                    )}
                    <div className="text-text-secondary">
                        <ChevronDownIcon />
                    </div>
                </button>

                {isSpaceSelectorOpen && (
                    <div className="absolute top-full right-0 mt-2 w-64 bg-ui-background rounded-lg shadow-2xl border border-border z-50 transform transition-all duration-200 origin-top-right animate-fade-in-down">
                        <div className="p-2">
                           <p className="px-2 py-1 text-xs font-semibold text-text-secondary uppercase">Spaces</p>
                           <ul className="mt-1">
                               {spaces.map(space => (
                                   <li key={space.id}>
                                       <button
                                           onClick={() => {
                                               setActiveSpaceId(space.id);
                                               setIsSpaceSelectorOpen(false);
                                           }}
                                           className={`w-full flex items-center justify-between text-left p-2 rounded-md text-sm transition-colors duration-200 ${
                                               activeSpaceId === space.id ? 'bg-ui-hover-background font-semibold text-text-primary' : 'hover:bg-ui-hover-background text-text-secondary hover:text-text-primary'
                                           }`}
                                       >
                                            <div className="flex items-center space-x-3">
                                                <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${generateColorFromName(space.name)}`}>
                                                    <span className="text-white font-bold text-xs">{getInitials(space.name)}</span>
                                                </div>
                                                <span className="truncate">{space.name}</span>
                                            </div>
                                           {activeSpaceId === space.id && <CheckIcon />}
                                       </button>
                                   </li>
                               ))}
                           </ul>
                        </div>
                    </div>
                )}
            </div>

            <div className="relative">
                <button 
                    onClick={() => setCurrentScreen('settings')} 
                    className="p-2 rounded-full hover:bg-ui-hover-background transition-colors duration-200"
                    aria-label="Open settings"
                >
                    <SettingsIcon />
                </button>
            </div>
        </div>
      </header>
      
      <main className="flex-1 relative">
        {/* Notes View Container */}
        <div
          className={`absolute inset-0 transition-opacity duration-500 ease-in-out h-full w-full
            ${activeView === 'notes' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`
          }
        >
          <div className="h-full overflow-y-auto p-4 md:p-8">
            <NotesView space={activeSpace} />
          </div>
        </div>

        {/* Chat View Container */}
        <div
          className={`absolute inset-0 transition-opacity duration-500 ease-in-out h-full w-full
            ${activeView === 'chat' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`
          }
        >
          <ChatView 
            space={activeSpace}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
          />
        </div>
      </main>
    </div>
  );
};

export default MainApp;