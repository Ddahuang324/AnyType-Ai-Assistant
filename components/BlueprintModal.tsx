import React, { useState, useEffect } from 'react';
import type { Blueprint } from '../types';

interface BlueprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (blueprint: Blueprint) => void;
  blueprintToEdit?: Blueprint | null;
}

const BlueprintModal: React.FC<BlueprintModalProps> = ({ isOpen, onClose, onSave, blueprintToEdit }) => {
  const [title, setTitle] = useState('');
  const [promptText, setPromptText] = useState('');

  useEffect(() => {
    if (blueprintToEdit) {
      setTitle(blueprintToEdit.title);
      setPromptText(blueprintToEdit.prompt);
    } else {
      setTitle('');
      setPromptText('');
    }
  }, [blueprintToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !promptText.trim()) return;
    
    onSave({
      id: blueprintToEdit?.id || `blueprint-${Date.now()}`,
      title,
      prompt: promptText,
    });
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center transition-opacity duration-300"
      onClick={onClose}
    >
      <div 
        className="bg-ui-background rounded-lg shadow-xl p-6 w-full max-w-md mx-4 transform transition-all duration-300 scale-95 opacity-0 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-4 text-text-primary">{blueprintToEdit ? 'Edit Blueprint' : 'Create New Blueprint'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium text-text-secondary mb-1">Title</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Summarize Text"
              className="w-full p-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-brand-primary text-text-primary"
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="prompt" className="block text-sm font-medium text-text-secondary mb-1">Prompt</label>
            <textarea
              id="prompt"
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="e.g., Please summarize the following..."
              rows={5}
              className="w-full p-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-brand-primary text-text-primary"
              required
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-ui-hover-background text-text-primary rounded-lg hover:bg-border transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-secondary transition-colors"
            >
              Save Blueprint
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BlueprintModal;