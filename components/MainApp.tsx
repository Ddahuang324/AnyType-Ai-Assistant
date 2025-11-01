import React, { useState, useEffect } from 'react';
import NotesView from './NotesView';
import ChatView from './ChatView';
import type { Space } from '../types';
import { MOCK_SPACES } from '../data/mockData';
import ChevronDownIcon from './icons/ChevronDownIcon';

type View = 'notes' | 'chat';

const MainApp: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('notes');
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [activeSpaceId, setActiveSpaceId] = useState<string | null>(null);

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
      className={`px-4 py-2 rounded-md transition-all duration-300 ease-in-out font-medium
        ${activeView === view
          ? 'bg-white text-[#222222] shadow-sm'
          : 'text-gray-500 hover:text-[#222222]'
        }`}
    >
      {label}
    </button>
  );

  return (
    <div className="w-full h-screen flex flex-col bg-[#F9F9F9]">
      <header className="flex justify-center items-center p-4 bg-[#F9F9F9] border-b border-gray-200 sticky top-0 z-20 space-x-4">
        {/* Space Selector Dropdown */}
        <div className="relative">
          <select
            value={activeSpaceId || ''}
            onChange={(e) => setActiveSpaceId(e.target.value)}
            className="appearance-none bg-white border border-gray-300 rounded-lg py-2 pl-3 pr-8 text-sm font-medium text-[#222222] focus:outline-none focus:ring-2 focus:ring-[#005F73]"
            aria-label="Select a Space"
          >
            {spaces.map(space => (
              <option key={space.id} value={space.id}>{space.name}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
            <ChevronDownIcon />
          </div>
        </div>

        {/* View Navigator */}
        <nav className="flex items-center space-x-2 p-1 bg-gray-100 rounded-lg">
          <NavButton view="notes" label="Project Hub" />
          <NavButton view="chat" label="AI Assistant" />
        </nav>
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
          <ChatView />
        </div>
      </main>
    </div>
  );
};

export default MainApp;