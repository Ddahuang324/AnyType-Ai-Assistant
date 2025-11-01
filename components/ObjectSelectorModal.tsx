
import React, { useState, useEffect, useMemo, Fragment } from 'react';
import type { AnyObject } from '../types';
import XIcon from './icons/XIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';

// --- Recursive Tree Item Component ---
interface ObjectTreeItemProps {
  obj: AnyObject;
  level: number;
  selectedIds: Set<string>;
  onToggleSelection: (id: string) => void;
}

const ObjectTreeItem: React.FC<ObjectTreeItemProps> = ({ obj, level, selectedIds, onToggleSelection }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = obj.children && obj.children.length > 0;

  return (
    <Fragment>
      <li>
        <div
          onClick={() => onToggleSelection(obj.id)}
          className={`flex items-center w-full p-2 rounded-md cursor-pointer transition-colors ${
            selectedIds.has(obj.id) ? 'bg-brand-primary text-white' : 'hover:bg-ui-hover-background text-text-primary'
          }`}
          style={{ paddingLeft: `${level * 24 + 8}px` }}
        >
          <div className="flex items-center justify-center w-7 h-7 flex-shrink-0 mr-1">
            {hasChildren && (
              <button 
                onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                }} 
                className={`p-1 rounded-full ${selectedIds.has(obj.id) ? 'hover:bg-white/20' : 'hover:bg-border'}`}
                aria-label={isExpanded ? 'Collapse' : 'Expand'}
              >
                <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : 'rotate-0'}`}>
                  <ChevronRightIcon />
                </div>
              </button>
            )}
          </div>
          <span className="font-medium ml-1 select-none truncate">
            {obj.name}
          </span>
        </div>
      </li>
      
      {hasChildren && isExpanded && (
        obj.children!.map(child => (
            <ObjectTreeItem
              key={child.id}
              obj={child}
              level={level + 1}
              selectedIds={selectedIds}
              onToggleSelection={onToggleSelection}
            />
        ))
      )}
    </Fragment>
  );
};


// --- Main Modal Component ---
interface ObjectSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selected: AnyObject[]) => void;
  objects: AnyObject[];
  initiallySelected: AnyObject[];
}

const ObjectSelectorModal: React.FC<ObjectSelectorModalProps> = ({ isOpen, onClose, onConfirm, objects, initiallySelected }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      setSelectedIds(new Set(initiallySelected.map(obj => obj.id)));
    }
  }, [isOpen, initiallySelected]);
  
  const allObjectsMap = useMemo(() => {
    const map = new Map<string, AnyObject>();
    const traverse = (objs: AnyObject[]) => {
      for(const obj of objs) {
        map.set(obj.id, obj);
        if (obj.children) {
          traverse(obj.children);
        }
      }
    };
    traverse(objects);
    return map;
  }, [objects]);

  const filteredObjects = useMemo(() => {
    if (!searchTerm.trim()) {
      return objects;
    }
    const lowerCaseSearch = searchTerm.toLowerCase();
    const filter = (objectList: AnyObject[]): AnyObject[] => {
      const results: AnyObject[] = [];
      for (const obj of objectList) {
        const children = obj.children ? filter(obj.children) : [];
        if (obj.name.toLowerCase().includes(lowerCaseSearch) || children.length > 0) {
          results.push({ ...obj, children });
        }
      }
      return results;
    };
    return filter(objects);
  }, [objects, searchTerm]);

  if (!isOpen) return null;

  const handleToggleSelection = (objectId: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(objectId)) {
        newSet.delete(objectId);
      } else {
        newSet.add(objectId);
      }
      return newSet;
    });
  };

  const handleConfirm = () => {
    const selectedObjects = Array.from(selectedIds).map(id => allObjectsMap.get(id)).filter(Boolean) as AnyObject[];
    onConfirm(selectedObjects);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center transition-opacity duration-300"
      onClick={onClose}
    >
      <div
        className="bg-ui-background rounded-lg shadow-xl w-full max-w-2xl h-[85vh] md:h-[70vh] mx-4 flex flex-col transform transition-all duration-300 scale-95 opacity-0 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="p-4 border-b border-border flex justify-between items-center">
          <h2 className="text-xl font-bold text-text-primary">Add Context from Space</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-ui-hover-background">
            <XIcon />
          </button>
        </header>

        <div className="p-4 border-b border-border">
          <input
            type="text"
            placeholder="Search objects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-brand-primary text-text-primary"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4">
            {filteredObjects.length > 0 ? (
              <ul className="space-y-1">
                {filteredObjects.map(obj => (
                  <ObjectTreeItem
                    key={obj.id}
                    obj={obj}
                    level={0}
                    selectedIds={selectedIds}
                    onToggleSelection={handleToggleSelection}
                  />
                ))}
              </ul>
            ) : (
                <div className="text-center text-text-secondary py-8">
                    <p>No objects found.</p>
                </div>
            )}
        </div>

        <footer className="p-4 border-t border-border flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-ui-hover-background text-text-primary rounded-lg hover:bg-border transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-secondary transition-colors"
          >
            {`Add ${selectedIds.size} Object(s)`}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default ObjectSelectorModal;