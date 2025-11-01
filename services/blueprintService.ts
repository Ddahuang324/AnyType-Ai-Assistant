import type { Blueprint } from '../types';

const BLUEPRINT_KEY = 'anytype-ai-hub-blueprints';

const DEFAULT_BLUEPRINTS: Blueprint[] = [
  { id: 'blueprint-1', title: 'Summarize Text', prompt: 'Please summarize the following text for me: ' },
  { id: 'blueprint-2', title: 'Brainstorm Ideas', prompt: 'Brainstorm 5 ideas for a new project about ' },
  { id: 'blueprint-3', title: 'Explain a Concept', prompt: 'Explain the concept of [concept] as if I were a beginner.' },
  { id: 'blueprint-4', title: 'Write an Email', prompt: 'Write a professional email to [recipient] about [subject]. The key points to include are: ' },
];

export const getBlueprints = (): Blueprint[] => {
  try {
    const blueprintsJson = localStorage.getItem(BLUEPRINT_KEY);
    if (blueprintsJson) {
      return JSON.parse(blueprintsJson);
    } else {
      // If no blueprints in storage, set the default ones
      localStorage.setItem(BLUEPRINT_KEY, JSON.stringify(DEFAULT_BLUEPRINTS));
      return DEFAULT_BLUEPRINTS;
    }
  } catch (error) {
    console.error('Failed to parse blueprints from localStorage', error);
    return DEFAULT_BLUEPRINTS;
  }
};

export const saveBlueprint = (blueprintToSave: Blueprint): Blueprint[] => {
  const blueprints = getBlueprints();
  const existingIndex = blueprints.findIndex(p => p.id === blueprintToSave.id);

  if (existingIndex > -1) {
    blueprints[existingIndex] = blueprintToSave;
  } else {
    blueprints.push(blueprintToSave);
  }
  
  try {
    localStorage.setItem(BLUEPRINT_KEY, JSON.stringify(blueprints));
  } catch (error) {
    console.error('Failed to save blueprints to localStorage', error);
  }
  return blueprints;
};

export const deleteBlueprint = (blueprintId: string): Blueprint[] => {
  let blueprints = getBlueprints();
  blueprints = blueprints.filter(p => p.id !== blueprintId);
  
  try {
    localStorage.setItem(BLUEPRINT_KEY, JSON.stringify(blueprints));
  } catch (error)
    {
    console.error('Failed to delete blueprint from localStorage', error);
  }
  return blueprints;
};