
import type { ChatHistoryItem } from '../types';

const HISTORY_KEY = 'anytype-ai-hub-chat-history';

export const getHistory = (): ChatHistoryItem[] => {
  try {
    const historyJson = localStorage.getItem(HISTORY_KEY);
    if (historyJson) {
      // Sort by the id which is a timestamp, newest first
      return JSON.parse(historyJson).sort((a: ChatHistoryItem, b: ChatHistoryItem) => b.id.localeCompare(a.id));
    }
  } catch (error) {
    console.error('Failed to parse chat history from localStorage', error);
  }
  return [];
};

export const saveChat = (chatToSave: ChatHistoryItem): ChatHistoryItem[] => {
  const history = getHistory();
  const existingIndex = history.findIndex(chat => chat.id === chatToSave.id);

  if (existingIndex > -1) {
    history[existingIndex] = chatToSave;
  } else {
    history.unshift(chatToSave);
  }
  
  try {
    // Re-sort after potential update to bring it to the top
    const sortedHistory = history.sort((a, b) => b.id.localeCompare(a.id));
    localStorage.setItem(HISTORY_KEY, JSON.stringify(sortedHistory));
    return sortedHistory;
  } catch (error) {
    console.error('Failed to save chat history to localStorage', error);
  }

  return history;
};

export const deleteChat = (chatId: string): ChatHistoryItem[] => {
  let history = getHistory();
  history = history.filter(chat => chat.id !== chatId);
  
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Failed to delete chat from localStorage', error);
  }

  return history;
};
