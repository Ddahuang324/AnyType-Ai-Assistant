
import React, { useState, useRef, useEffect } from 'react';
import type { Message, ChatHistoryItem } from '../types';
import { continueConversation, generateChatTitle } from '../services/geminiService';
import * as historyService from '../services/historyService';
import SendIcon from './icons/SendIcon';
import PlusIcon from './icons/PlusIcon';
import TrashIcon from './icons/TrashIcon';

const ChatView: React.FC = () => {
  // State for UI
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // State for Data
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
      { id: '1', role: 'model', text: 'Hello! How can I assist you with your project today?' }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load history on mount
  useEffect(() => {
    setChatHistory(historyService.getHistory());
  }, []);

  // Effect to handle switching active chat
  useEffect(() => {
    if (activeChatId) {
      const activeChat = historyService.getHistory().find(chat => chat.id === activeChatId);
      setMessages(activeChat ? activeChat.messages : []);
    } else {
      // New chat
      setMessages([{ id: '1', role: 'model', text: 'Hello! How can I assist you with your project today? Start a conversation to save it to your history.' }]);
    }
  }, [activeChatId]);

  // Effect to scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleNewChat = () => {
    setActiveChatId(null);
  };

  const handleDeleteChat = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation(); // Prevent handleSelectChat from firing
    const updatedHistory = historyService.deleteChat(chatId);
    setChatHistory(updatedHistory);
    if (activeChatId === chatId) {
      handleNewChat();
    }
  };

  const handleSelectChat = (chatId: string) => {
    setActiveChatId(chatId);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userInput = input;
    const userMessage: Message = { id: Date.now().toString(), role: 'user', text: userInput };
    
    const conversationHistoryForAPI = [...messages];
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    let currentChatId = activeChatId;
    let chatToSave: ChatHistoryItem;

    if (!currentChatId) {
      const title = await generateChatTitle(userInput);
      const newChat: ChatHistoryItem = {
        id: Date.now().toString(),
        title: title || "New Conversation",
        messages: [...conversationHistoryForAPI, userMessage],
      };
      const updatedHistory = historyService.saveChat(newChat);
      setChatHistory(updatedHistory);
      setActiveChatId(newChat.id);
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

  const ChatContent = () => (
    <div className="flex flex-col h-full bg-white text-[#222222]">
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
      <div className="p-4 border-t border-gray-200 bg-white">
        <form onSubmit={handleSend} className="flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything..."
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
    </div>
  );

  return (
    <div className="flex h-full w-full bg-white">
      <aside className="w-full max-w-xs bg-gray-50 border-r border-gray-200 flex flex-col">
        <div className="p-2 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold px-2">Recent Chats</h2>
            <button
                onClick={handleNewChat}
                className="flex items-center justify-center p-2 text-sm font-semibold text-[#222222] bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                aria-label="New Chat"
            >
                <PlusIcon />
            </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-2">
          <ul className="space-y-1">
            {chatHistory.map(chat => (
              <li key={chat.id}>
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); handleSelectChat(chat.id); }}
                  className={`group flex justify-between items-center w-full text-left p-3 rounded-lg text-sm transition-colors duration-200 ${
                    activeChatId === chat.id ? 'bg-[#005F73] text-white' : 'hover:bg-gray-200'
                  }`}
                >
                  <span className="truncate flex-1">{chat.title}</span>
                  <button
                    onClick={(e) => handleDeleteChat(e, chat.id)}
                    className={`ml-2 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
                      activeChatId === chat.id ? 'text-gray-300 hover:bg-white/20' : 'text-gray-500 hover:bg-red-100 hover:text-red-600'
                    }`}
                    aria-label="Delete chat"
                  >
                    <TrashIcon />
                  </button>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <main className="flex-1">
        <ChatContent />
      </main>

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
