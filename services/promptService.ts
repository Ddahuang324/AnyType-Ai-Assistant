// Fix: Aliased the 'Blueprint' type as 'Prompt' to resolve the missing type error. 'Blueprint' is the correct type used elsewhere in the application for this data structure.
import type { Blueprint as Prompt } from '../types';

const PROMPT_KEY = 'anytype-ai-hub-prompts';

const DEFAULT_PROMPTS: Prompt[] = [
  { id: 'prompt-1', title: 'Summarize Text', prompt: 'Please summarize the following text for me: ' },
  { id: 'prompt-2', title: 'Brainstorm Ideas', prompt: 'Brainstorm 5 ideas for a new project about ' },
  { id: 'prompt-3', title: 'Explain a Concept', prompt: 'Explain the concept of [concept] as if I were a beginner.' },
  { id: 'prompt-4', title: 'Write an Email', prompt: 'Write a professional email to [recipient] about [subject]. The key points to include are: ' },
];

export const getPrompts = (): Prompt[] => {
  try {
    const promptsJson = localStorage.getItem(PROMPT_KEY);
    if (promptsJson) {
      return JSON.parse(promptsJson);
    } else {
      // If no prompts in storage, set the default ones
      localStorage.setItem(PROMPT_KEY, JSON.stringify(DEFAULT_PROMPTS));
      return DEFAULT_PROMPTS;
    }
  } catch (error) {
    console.error('Failed to parse prompts from localStorage', error);
    return DEFAULT_PROMPTS;
  }
};

export const savePrompt = (promptToSave: Prompt): Prompt[] => {
  const prompts = getPrompts();
  const existingIndex = prompts.findIndex(p => p.id === promptToSave.id);

  if (existingIndex > -1) {
    prompts[existingIndex] = promptToSave;
  } else {
    prompts.push(promptToSave);
  }
  
  try {
    localStorage.setItem(PROMPT_KEY, JSON.stringify(prompts));
  } catch (error) {
    console.error('Failed to save prompts to localStorage', error);
  }
  return prompts;
};

export const deletePrompt = (promptId: string): Prompt[] => {
  let prompts = getPrompts();
  prompts = prompts.filter(p => p.id !== promptId);
  
  try {
    localStorage.setItem(PROMPT_KEY, JSON.stringify(prompts));
  } catch (error) {
    console.error('Failed to delete prompt from localStorage', error);
  }
  return prompts;
};