import React, { useState, useRef, useEffect } from 'react';
import type { Message, ChatHistoryItem, Blueprint } from '../types';
import { continueConversation, generateChatTitle } from '../services/geminiService';
import * as historyService from '../services/historyService';
import * as blueprintService from '../services/blueprintService';
import SendIcon from './icons/SendIcon';
import PlusIcon from './icons/PlusIcon';
import TrashIcon from './icons/TrashIcon';
import PencilIcon from './icons/PencilIcon';
import BlueprintModal from './BlueprintModal';
import ChevronDownIcon from './icons/ChevronDownIcon';
import BlueprintIcon from './icons/BlueprintIcon';

const ChatView: React.FC = () => {
  // UI State
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isBlueprintModalOpen, setIsBlueprintModalOpen] = useState(false);
  const [isHistoryVisible, setIsHistoryVisible] = useState(true);
  const [isBlueprintsVisible, setIsBlueprintsVisible] = useState(true);
  
  // Data State
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeBlueprintId, setActiveBlueprintId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const [blueprintToEdit, setBlueprintToEdit] = useState<Blueprint | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  // --- NAVIGATION HANDLERS ---
  const handleNewChat = () => {
    setActiveChatId(null);
    setActiveBlueprintId(null);
    setInput('');
  };

  const handleSelectChat = (chatId: string) => {
    setActiveChatId(chatId);
    setActiveBlueprintId(null);
  };
  
  const handleSelectBlueprint = (blueprintId: string) => {
    setActiveBlueprintId(blueprintId);
    setActiveChatId(null);
    setInput('');
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
    if (!messageText.trim() || isLoading) return;

    const userInput = messageText;
    const userMessage: Message = { id: Date.now().toString(), role: 'user', text: userInput };
    
    const conversationHistoryForAPI = [...messages];
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    let currentChatId = activeChatId;
    let chatToSave: ChatHistoryItem;

    // This is a new chat, either from a blueprint or a regular one
    if (!currentChatId) {
      const title = await generateChatTitle(userInput);
      const newChat: ChatHistoryItem = {
        id: Date.now().toString(),
        title: title || "New Conversation",
        messages: [...conversationHistoryForAPI, userMessage],
        blueprintId: activeBlueprintId || undefined,
      };
      const updatedHistory = historyService.saveChat(newChat);
      setChatHistory(updatedHistory);
      setActiveChatId(newChat.id);
      setActiveBlueprintId(null); // Once chat starts, it's a regular chat
      currentChatId = newChat.id;
      chatToSave = newChat;
    } else {
      const existingChat = chatHistory.find(c => c.id === currentChatId)!;
      chatToSave = { ...existingChat, messages: [...existingChat.messages, userMessage] };
      const updatedHistory = historyService.saveChat(chatToSave);
      setChatHistory(updatedHistory);
    }
    
    try {
      const responseText = await continueConversation(conversationHistoryForAPI, userInput);
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

  // --- MAIN CONTENT RENDERER ---
  const MainContent = () => {
    // 1. Active Chat View
    if (activeChatId) {
      return (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex animate-fade-in-up ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-2xl ${
                  msg.role === 'user'
                    ? 'bg-[#005F73] text-white rounded-br-none'
                    : 'bg-gray-100 text-[#222222] rounded-bl-none'
                }`}
              >
                <p className="text-sm break-words whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="px-4 py-3 rounded-2xl bg-gray-100 text-[#222222] rounded-bl-none">
                <div className="flex items-center space-x-2">
                  <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      );
    }

    // 2. Active Blueprint Session View
    if (activeBlueprintId) {
      const blueprint = blueprints.find(p => p.id === activeBlueprintId);
      const relatedChats = chatHistory.filter(c => c.blueprintId === activeBlueprintId);
      if (!blueprint) return null; // Should not happen

      return (
        <div className="flex-1 w-full flex flex-col items-center justify-center p-4 md:p-8 bg-white">
          <div className="text-center max-w-2xl">
            <div className="inline-flex items-center justify-center bg-gradient-to-br from-[#005F73] to-[#00A896] p-4 rounded-full mb-4">
                <BlueprintIcon />
            </div>
            <h1 className="text-4xl font-bold text-[#222222]">{blueprint.title}</h1>
            <p className="text-gray-500 mt-2 mb-8">{blueprint.prompt}</p>

            {relatedChats.length > 0 && (
                <div className="text-left w-full">
                    <h3 className="font-semibold text-gray-600 mb-2">Recent</h3>
                    <ul className="space-y-2">
                        {relatedChats.slice(0, 3).map(chat => (
                            <li key={chat.id}>
                                <button onClick={() => handleSelectChat(chat.id)} className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                                    <p className="truncate text-sm text-gray-700">{chat.title}</p>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
          </div>
        </div>
      );
    }

    // 3. Welcome View (Default)
    return (
      <div className="flex-1 w-full flex flex-col items-center justify-center p-4 md:p-8 bg-white">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-[#222222]">AI Assistant</h1>
          <p className="text-gray-500 mt-2">Select a chat, start a new one, or use a blueprint from the sidebar.</p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full w-full bg-white">
      <aside className="w-full max-w-xs bg-gray-50 border-r border-gray-200 flex flex-col overflow-y-auto">
        {/* Blueprints Section */}
        <div className="p-2 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
                <button onClick={() => setIsBlueprintsVisible(!isBlueprintsVisible)} className="p-1 rounded-md hover:bg-gray-200">
                     <div className={`transition-transform duration-200 ${!isBlueprintsVisible && '-rotate-90'}`}>
                        <ChevronDownIcon />
                     </div>
                </button>
                <h2 className="text-lg font-semibold ml-1">Blueprints</h2>
            </div>
            <button onClick={handleOpenCreateModal} className="p-2 text-[#222222] bg-gray-200/50 rounded-lg hover:bg-gray-200" aria-label="Create New Blueprint">
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
                             activeBlueprintId === blueprint.id ? 'bg-gray-300' : 'hover:bg-gray-200'
                        }`}>
                        <div className="flex-1 truncate">
                            <p className="font-medium text-gray-800">{blueprint.title}</p>
                            <p className="text-xs text-gray-500 truncate">{blueprint.prompt}</p>
                        </div>
                        <div className="flex items-center ml-2 space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={(e) => handleOpenEditModal(e, blueprint)} className="p-1.5 rounded-md hover:bg-gray-300 text-gray-600"><PencilIcon/></button>
                            <button onClick={(e) => handleDeleteBlueprint(e, blueprint.id)} className="p-1.5 rounded-md hover:bg-red-100 text-red-600"><TrashIcon/></button>
                        </div>
                    </a>
                    </li>
                ))}
                </ul>
            </nav>
        )}

        {/* Recent Chats Section */}
        <div className="p-2 border-t border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button onClick={() => setIsHistoryVisible(!isHistoryVisible)} className="p-1 rounded-md hover:bg-gray-200">
                 <div className={`transition-transform duration-200 ${!isHistoryVisible && '-rotate-90'}`}>
                    <ChevronDownIcon />
                 </div>
              </button>
              <h2 className="text-lg font-semibold ml-1">Recent Chats</h2>
            </div>
            <button onClick={handleNewChat} className="p-2 text-[#222222] bg-gray-200/50 rounded-lg hover:bg-gray-200" aria-label="New Chat">
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
                      activeChatId === chat.id ? 'bg-[#005F73] text-white' : 'hover:bg-gray-200'
                    }`}>
                    <span className="truncate flex-1">{chat.title}</span>
                    <button onClick={(e) => handleDeleteChat(e, chat.id)}
                      className={`ml-2 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
                        activeChatId === chat.id ? 'text-gray-300 hover:bg-white/20' : 'text-gray-500 hover:bg-red-100 hover:text-red-600'
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

      <main className="flex-1 flex flex-col bg-white">
        <MainContent />
        <div className="p-4 border-t border-gray-200 bg-white">
          <form onSubmit={handleFormSubmit} className="flex items-center space-x-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={activeBlueprintId ? blueprints.find(p=>p.id === activeBlueprintId)?.title || "Start conversation..." : "Ask me anything..."}
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#005F73] focus:border-transparent transition-all duration-300 ease-in-out"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="p-3 bg-[#005F73] text-white rounded-lg transition-all duration-300 ease-in-out
                       transform hover:scale-105 disabled:bg-gray-300 disabled:scale-100"
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

      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default ChatView;