import React, { useState, useRef, useEffect, useMemo, useContext } from 'react';
import type { Message, ChatHistoryItem, Blueprint, Space, AnyObject } from '../types';
import { continueConversation, generateChatTitle } from '../services/aiService';
import type { AiProvider } from '../services/aiService';
import * as historyService from '../services/historyService';
import * as blueprintService from '../services/blueprintService';
import SendIcon from './icons/SendIcon';
import PlusIcon from './icons/PlusIcon';
import TrashIcon from './icons/TrashIcon';
import PencilIcon from './icons/PencilIcon';
import BlueprintModal from './BlueprintModal';
import ChevronDownIcon from './icons/ChevronDownIcon';
import ObjectSelectorModal from './ObjectSelectorModal';
import XIcon from './icons/XIcon';
import { SettingsContext } from '../contexts/SettingsContext';
import ChatMessages from './ChatMessages';

interface ChatViewProps {
    space: Space | null;
    isSidebarOpen: boolean;
    setIsSidebarOpen: (isOpen: boolean) => void;
}

const ChatView: React.FC<ChatViewProps> = ({ space, isSidebarOpen, setIsSidebarOpen }) => {
  // UI State
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isBlueprintModalOpen, setIsBlueprintModalOpen] = useState(false);
  const [isHistoryVisible, setIsHistoryVisible] = useState(true);
  const [isBlueprintsVisible, setIsBlueprintsVisible] = useState(true);
  const [isObjectModalOpen, setIsObjectModalOpen] = useState(false);
  
  // Data State
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeBlueprintId, setActiveBlueprintId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const [blueprintToEdit, setBlueprintToEdit] = useState<Blueprint | null>(null);
  const [selectedObjects, setSelectedObjects] = useState<AnyObject[]>([]);

  const { aiProvider, aiApiKey, aiModel } = useContext(SettingsContext);
  const isAiConfigured = !!(aiProvider && aiApiKey && aiModel);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Memoize the flattened list of objects from the current space
  const allObjectsInSpace = useMemo(() => {
    if (!space) return [];
    // Map each set to an AnyObject-like structure to create a tree
    return space.sets.map(set => ({
      id: set.id,
      name: set.name,
      relations: {}, // Sets don't have relations in this context
      children: set.objects,
    }));
  }, [space]);

  // Load history and blueprints on mount
  useEffect(() => {
    setChatHistory(historyService.getHistory());
    setBlueprints(blueprintService.getBlueprints());
  }, []);

  // Effect to handle switching active chat
  useEffect(() => {
    if (activeChatId) {
      const activeChat = historyService.getHistory().find(chat => chat.id === activeChatId);
      setMessages(activeChat ? activeChat.messages : []);
    } else {
      setMessages([]);
    }
  }, [activeChatId]);

  // Effect to scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Effect to clear selected objects when space changes
  useEffect(() => {
    setSelectedObjects([]);
  }, [space]);


  // --- NAVIGATION HANDLERS ---
  const handleNewChat = () => {
    setActiveChatId(null);
    setActiveBlueprintId(null);
    setInput('');
    setSelectedObjects([]);
    setIsSidebarOpen(false);
  };

  const handleSelectChat = (chatId: string) => {
    setActiveChatId(chatId);
    setActiveBlueprintId(null);
    setSelectedObjects([]);
    setIsSidebarOpen(false);
  };
  
  const handleSelectBlueprint = (blueprintId: string) => {
    setActiveBlueprintId(blueprintId);
    setActiveChatId(null);
    setInput('');
    setSelectedObjects([]);
    setIsSidebarOpen(false);
  };

  // --- CHAT HANDLERS ---
  const handleDeleteChat = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation(); 
    const updatedHistory = historyService.deleteChat(chatId);
    setChatHistory(updatedHistory);
    if (activeChatId === chatId) {
      handleNewChat();
    }
  };

  const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading || !isAiConfigured) return;

    const userInput = messageText;
    const contextPrefix = selectedObjects.length > 0
        ? `Referring to the following object(s):\n${selectedObjects.map(o => `- ${o.name}`).join('\n')}\n\n`
        : '';
    const messageWithContext = contextPrefix + userInput;
    
    const userMessage: Message = { id: Date.now().toString(), role: 'user', text: messageWithContext };
    
    const conversationHistoryForAPI = [...messages];
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setSelectedObjects([]);
    setIsLoading(true);

    let currentChatId = activeChatId;
    let chatToSave: ChatHistoryItem;

    if (!currentChatId) {
      const title = await generateChatTitle(aiProvider as AiProvider, aiApiKey, aiModel, userInput);
      const newChat: ChatHistoryItem = {
        id: Date.now().toString(),
        title: title || "New Conversation",
        messages: [...conversationHistoryForAPI, userMessage],
        blueprintId: activeBlueprintId || undefined,
      };
      const updatedHistory = historyService.saveChat(newChat);
      setChatHistory(updatedHistory);
      setActiveChatId(newChat.id);
      setActiveBlueprintId(null);
      currentChatId = newChat.id;
      chatToSave = newChat;
    } else {
      const existingChat = chatHistory.find(c => c.id === currentChatId)!;
      chatToSave = { ...existingChat, messages: [...existingChat.messages, userMessage] };
      const updatedHistory = historyService.saveChat(chatToSave);
      setChatHistory(updatedHistory);
    }
    
    try {
      const responseText = await continueConversation(aiProvider as AiProvider, aiApiKey, aiModel, conversationHistoryForAPI, messageWithContext);
      const modelMessage: Message = { id: (Date.now() + 1).toString(), role: 'model', text: responseText };
      
      setMessages(prev => [...prev, modelMessage]);
      
      chatToSave.messages.push(modelMessage);
      const finalHistory = historyService.saveChat(chatToSave);
      setChatHistory(finalHistory);

    } catch (error) {
      const errorMessage: Message = { id: (Date.now() + 1).toString(), role: 'model', text: 'Sorry, I failed to get a response. Please check your connection or API key.' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(input);
  };
  
  const handleRemoveObject = (objectId: string) => {
    setSelectedObjects(prev => prev.filter(obj => obj.id !== objectId));
  };

  // --- BLUEPRINT HANDLERS ---
  const handleSaveBlueprint = (blueprint: Blueprint) => {
    const updatedBlueprints = blueprintService.saveBlueprint(blueprint);
    setBlueprints(updatedBlueprints);
    setIsBlueprintModalOpen(false);
    setBlueprintToEdit(null);
  };

  const handleDeleteBlueprint = (e: React.MouseEvent, blueprintId: string) => {
      e.stopPropagation();
      const updatedBlueprints = blueprintService.deleteBlueprint(blueprintId);
      setBlueprints(updatedBlueprints);
      if(activeBlueprintId === blueprintId) {
        setActiveBlueprintId(null);
      }
  };

  const handleOpenEditModal = (e: React.MouseEvent, blueprint: Blueprint) => {
      e.stopPropagation();
      setBlueprintToEdit(blueprint);
      setIsBlueprintModalOpen(true);
  };

  const handleOpenCreateModal = () => {
    setBlueprintToEdit(null);
    setIsBlueprintModalOpen(true);
  };

  return (
    <div className="flex h-full w-full bg-background text-text-primary">
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      <aside 
        className={`w-80 bg-ui-background border-r border-border flex flex-col overflow-y-auto
                   fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
                   ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-2 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
                <button onClick={() => setIsBlueprintsVisible(!isBlueprintsVisible)} className="p-1 rounded-md hover:bg-ui-hover-background">
                     <div className={`transition-transform duration-200 ${!isBlueprintsVisible && '-rotate-90'}`}>
                        <ChevronDownIcon />
                     </div>
                </button>
                <h2 className="text-lg font-semibold ml-1">Blueprints</h2>
            </div>
            <button onClick={handleOpenCreateModal} className="p-2 text-text-primary bg-ui-hover-background/50 rounded-lg hover:bg-ui-hover-background" aria-label="Create New Blueprint">
              <PlusIcon />
            </button>
          </div>
        </div>
        {isBlueprintsVisible && (
            <nav className="p-2">
                <ul className="space-y-1">
                {blueprints.map(blueprint => (
                    <li key={blueprint.id}>
                    <a href="#" onClick={(e) => { e.preventDefault(); handleSelectBlueprint(blueprint.id); }}
                        className={`group flex justify-between items-center w-full text-left p-3 rounded-lg text-sm transition-colors duration-200 ${
                             activeBlueprintId === blueprint.id ? 'bg-ui-hover-background' : 'hover:bg-ui-hover-background'
                        }`}>
                        <div className="flex-1 truncate">
                            <p className="font-medium text-text-primary">{blueprint.title}</p>
                            <p className="text-xs text-text-secondary truncate">{blueprint.prompt}</p>
                        </div>
                        <div className="flex items-center ml-2 space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={(e) => handleOpenEditModal(e, blueprint)} className="p-1.5 rounded-md hover:bg-border text-text-secondary"><PencilIcon/></button>
                            <button onClick={(e) => handleDeleteBlueprint(e, blueprint.id)} className="p-1.5 rounded-md hover:bg-red-900/50 text-red-400"><TrashIcon/></button>
                        </div>
                    </a>
                    </li>
                ))}
                </ul>
            </nav>
        )}

        <div className="p-2 border-t border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button onClick={() => setIsHistoryVisible(!isHistoryVisible)} className="p-1 rounded-md hover:bg-ui-hover-background">
                 <div className={`transition-transform duration-200 ${!isHistoryVisible && '-rotate-90'}`}>
                    <ChevronDownIcon />
                 </div>
              </button>
              <h2 className="text-lg font-semibold ml-1">Recent Chats</h2>
            </div>
            <button onClick={handleNewChat} className="p-2 text-text-primary bg-ui-hover-background/50 rounded-lg hover:bg-ui-hover-background" aria-label="New Chat">
                <PlusIcon />
            </button>
          </div>
        </div>
        {isHistoryVisible && (
          <nav className="p-2">
            <ul className="space-y-1">
              {chatHistory.map(chat => (
                <li key={chat.id}>
                  <a href="#" onClick={(e) => { e.preventDefault(); handleSelectChat(chat.id); }}
                    className={`group flex justify-between items-center w-full text-left p-3 rounded-lg text-sm transition-colors duration-200 ${
                      activeChatId === chat.id ? 'bg-brand-primary text-white' : 'hover:bg-ui-hover-background'
                    }`}>
                    <span className="truncate flex-1">{chat.title}</span>
                    <button onClick={(e) => handleDeleteChat(e, chat.id)}
                      className={`ml-2 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
                        activeChatId === chat.id ? 'text-gray-300 hover:bg-white/20' : 'text-text-secondary hover:bg-red-900/50 hover:text-red-400'
                      }`} aria-label="Delete chat">
                      <TrashIcon />
                    </button>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </aside>

      <main className="flex-1 flex flex-col bg-background">
        <ChatMessages
            messages={messages}
            isLoading={isLoading}
            activeChatId={activeChatId}
            activeBlueprintId={activeBlueprintId}
            blueprints={blueprints}
            chatHistory={chatHistory}
            onSelectChat={handleSelectChat}
            messagesEndRef={messagesEndRef}
        />
        <div className="p-4 border-t border-border bg-background">
            {selectedObjects.length > 0 && (
                <div className="mb-2 p-2 border border-border rounded-lg bg-ui-background">
                    <div className="flex flex-wrap gap-2">
                    {selectedObjects.map(obj => (
                        <div key={obj.id} className="flex items-center bg-ui-hover-background text-text-primary text-sm font-medium px-2 py-1 rounded-md animate-fade-in-up">
                            <span>{obj.name}</span>
                            <button onClick={() => handleRemoveObject(obj.id)} className="ml-2 text-text-secondary hover:text-text-primary">
                                <XIcon />
                            </button>
                        </div>
                    ))}
                    </div>
                </div>
            )}
          <form onSubmit={handleFormSubmit} className="flex items-center space-x-2">
            <button
                type="button"
                onClick={() => setIsObjectModalOpen(true)}
                disabled={!space}
                className="p-3 bg-ui-hover-background text-text-primary rounded-lg transition-colors duration-200
                           hover:bg-border disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Add object context"
            >
                <PlusIcon />
            </button>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={!isAiConfigured ? "Please configure AI in settings..." : (activeBlueprintId ? blueprints.find(p=>p.id === activeBlueprintId)?.title || "Start conversation..." : "Ask me anything...")}
              className="flex-1 p-3 border border-border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all duration-300 ease-in-out bg-ui-background text-text-primary placeholder:text-text-secondary"
              disabled={isLoading || !isAiConfigured}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim() || !isAiConfigured}
              className="p-3 bg-brand-primary text-white rounded-lg transition-all duration-300 ease-in-out
                       transform hover:scale-105 disabled:bg-ui-hover-background disabled:scale-100"
            >
              <SendIcon />
            </button>
          </form>
        </div>
      </main>

      <BlueprintModal 
        isOpen={isBlueprintModalOpen} 
        onClose={() => setIsBlueprintModalOpen(false)} 
        onSave={handleSaveBlueprint} 
        blueprintToEdit={blueprintToEdit}
      />
      
      <ObjectSelectorModal
        isOpen={isObjectModalOpen}
        onClose={() => setIsObjectModalOpen(false)}
        onConfirm={setSelectedObjects}
        objects={allObjectsInSpace}
        initiallySelected={selectedObjects}
      />
    </div>
  );
};

export default ChatView;