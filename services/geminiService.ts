
import { GoogleGenAI, Content } from "@google/genai";
import type { Message } from '../types';

let ai: GoogleGenAI | null = null;

const getAi = (): GoogleGenAI => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }
  if (!ai) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return ai;
};

const buildHistory = (messages: Message[]): Content[] => {
  return messages.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.text }],
  }));
};

export const continueConversation = async (history: Message[], newMessage: string): Promise<string> => {
  try {
    const aiInstance = getAi();
    const chat = aiInstance.chats.create({
      model: 'gemini-2.5-flash',
      history: buildHistory(history),
      config: {
        systemInstruction: 'You are a helpful assistant integrated into a note-taking application. Your responses should be clear, concise, and helpful for users managing their knowledge and ideas. Use markdown for formatting when appropriate.',
      },
    });

    const result = await chat.sendMessage({ message: newMessage });
    return result.text;
  } catch (error) {
    console.error("Error sending message to Gemini:", error);
    return "Sorry, I encountered an error. Please try again.";
  }
};

export const generateChatTitle = async (firstMessage: string): Promise<string> => {
    try {
        const aiInstance = getAi();
        const prompt = `Generate a very short, concise title (4 words max) for a conversation that starts with this user message: "${firstMessage}". Do not use quotes or any other formatting in your response. Just the title text.`;
        const result = await aiInstance.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return result.text.replace(/"/g, '').trim();
    } catch (error) {
        console.error("Error generating title:", error);
        return "New Chat";
    }
}
