import { GoogleGenAI, Content } from "@google/genai";
import type { Message } from '../types';

export type AiProvider = 'gemini' | 'openai' | 'anthropic';

export interface AiModel {
  id: string;
  name: string;
  description?: string;
}

// --- SDK Initialization ---

let ai: GoogleGenAI | null = null;
let currentApiKey: string | null = null;

const getGeminiAi = (apiKey: string): GoogleGenAI => {
  if (!apiKey) throw new Error("API key not provided to Gemini Service");
  if (!ai || currentApiKey !== apiKey) {
    ai = new GoogleGenAI({ apiKey: apiKey });
    currentApiKey = apiKey;
  }
  return ai;
};


// --- API Key Validation ---

async function validateGeminiKey(apiKey: string): Promise<boolean> {
  if (!apiKey) return false;
  try {
    const aiInstance = new GoogleGenAI({ apiKey });
    await aiInstance.models.generateContent({ model: 'gemini-2.5-flash', contents: 'test' });
    return true;
  } catch (error) {
    console.error("Gemini Key validation failed:", error);
    return false;
  }
}

async function validateOpenAIKey(apiKey: string): Promise<boolean> {
  if (!apiKey) return false;
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });
    return response.ok;
  } catch (error) {
    console.error("OpenAI Key validation failed:", error);
    return false;
  }
}

async function validateAnthropicKey(apiKey: string): Promise<boolean> {
  if (!apiKey) return false;
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            "model": "claude-3-haiku-20240307",
            "max_tokens": 10,
            "messages": [
                {"role": "user", "content": "test"}
            ]
        })
    });
    // Anthropic doesn't have a simple list models endpoint that works for all keys
    // so we make a cheap call to test the key.
    return response.ok;
  } catch (error) {
    console.error("Anthropic Key validation failed:", error);
    return false;
  }
}

export const validateApiKey = (provider: AiProvider, apiKey: string): Promise<boolean> => {
    switch (provider) {
        case 'gemini': return validateGeminiKey(apiKey);
        case 'openai': return validateOpenAIKey(apiKey);
        case 'anthropic': return validateAnthropicKey(apiKey);
    }
}

// --- Model Listing ---

const GEMINI_MODELS: AiModel[] = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'Fast, efficient, for everyday tasks.' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', description: 'Advanced reasoning for complex problems.' },
];

async function listOpenAIModels(apiKey: string): Promise<AiModel[]> {
    try {
        const response = await fetch('https://api.openai.com/v1/models', {
            headers: { 'Authorization': `Bearer ${apiKey}` },
        });
        if (!response.ok) return [];
        const data = await response.json();
        const chatModels = data.data.filter((m: any) => m.id.includes('gpt') && !m.id.includes('vision'));
        return chatModels.map((m: any) => ({
            id: m.id,
            name: m.id,
        })).sort((a: AiModel, b: AiModel) => b.name.localeCompare(a.name));
    } catch {
        return [];
    }
}

async function listAnthropicModels(): Promise<AiModel[]> {
    // Anthropic model list is currently static and documented
    return [
        { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', description: 'Most powerful model for complex tasks.' },
        { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', description: 'Balanced model for performance and speed.' },
        { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', description: 'Fastest and most compact model.' },
    ];
}

export const listModels = (provider: AiProvider, apiKey: string): Promise<AiModel[]> => {
    switch(provider) {
        case 'gemini': return Promise.resolve(GEMINI_MODELS);
        case 'openai': return listOpenAIModels(apiKey);
        case 'anthropic': return listAnthropicModels();
    }
}

// --- Conversation ---

const buildGeminiHistory = (messages: Message[]): Content[] => {
  return messages.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.text }],
  }));
};

async function continueGemini(apiKey: string, model: string, history: Message[], newMessage: string): Promise<string> {
    const aiInstance = getGeminiAi(apiKey);
    const chat = aiInstance.chats.create({
      model: model,
      history: buildGeminiHistory(history),
      config: {
        systemInstruction: 'You are a helpful assistant integrated into a note-taking application. Your responses should be clear, concise, and helpful. Use markdown for formatting.',
      },
    });
    const result = await chat.sendMessage({ message: newMessage });
    return result.text;
}

async function continueOpenAI(apiKey: string, model: string, history: Message[], newMessage: string): Promise<string> {
    const messages = history.map(m => ({ role: m.role === 'model' ? 'assistant' : 'user', content: m.text }));
    messages.push({ role: 'user', content: newMessage });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: model,
            messages: messages,
        })
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI API error: ${error.error.message}`);
    }
    const data = await response.json();
    return data.choices[0].message.content;
}

async function continueAnthropic(apiKey: string, model: string, history: Message[], newMessage: string): Promise<string> {
    const messages = history.map(m => ({ role: m.role, content: m.text }));
    messages.push({ role: 'user', content: newMessage });

    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            model: model,
            max_tokens: 2048,
            messages: messages
        })
    });
     if (!response.ok) {
        const error = await response.json();
        throw new Error(`Anthropic API error: ${error.error.message}`);
    }
    const data = await response.json();
    return data.content[0].text;
}

export const continueConversation = async (provider: AiProvider, apiKey: string, model: string, history: Message[], newMessage: string): Promise<string> => {
    try {
        switch(provider) {
            case 'gemini': return await continueGemini(apiKey, model, history, newMessage);
            case 'openai': return await continueOpenAI(apiKey, model, history, newMessage);
            case 'anthropic': return await continueAnthropic(apiKey, model, history, newMessage);
        }
    } catch (error) {
        console.error(`Error with ${provider}:`, error);
        if (error instanceof Error && (error.message.toLowerCase().includes('api key') || error.message.toLowerCase().includes('auth'))) {
            return `It seems your ${provider} API key is invalid. Please reset your configuration from the settings menu and enter a valid key.`;
        }
        return "Sorry, I encountered an error. Please try again.";
    }
};

export const generateChatTitle = async (provider: AiProvider, apiKey: string, model: string, firstMessage: string): Promise<string> => {
    try {
        const prompt = `Generate a very short, concise title (4 words max) for a conversation that starts with this user message: "${firstMessage}". Do not use quotes or any other formatting in your response. Just the title text.`;
        
        const response = await continueConversation(provider, apiKey, model, [], prompt);
        return response.replace(/"/g, '').trim();

    } catch (error) {
        console.error("Error generating title:", error);
        return "New Chat";
    }
}