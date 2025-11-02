import React, { useState, useContext } from 'react';
import type { AnyObject, Space } from '../types';
import { SettingsContext } from '../contexts/SettingsContext';
import { useSearch } from '../hooks/useSearch';
import LoaderIcon from './icons/LoaderIcon';

interface ObjectsListProps {
  space: Space;
  onObjectSelect: (object: AnyObject) => void;
}

const ObjectsList: React.FC<ObjectsListProps> = ({ space, onObjectSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { anytypeApiEndpoint, anytypeApiKey } = useContext(SettingsContext);

  const { objects, isLoading, error } = useSearch(space.id, searchQuery, anytypeApiEndpoint, anytypeApiKey);

  return (
    <div className="w-full">
      {/* Search Input */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="搜索对象..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-3 bg-ui-background border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
        />
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <LoaderIcon />
          <span className="ml-2 text-text-secondary">搜索中...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-8">
          <p className="text-red-500">搜索失败: {error}</p>
        </div>
      )}

      {/* Objects List */}
      {!isLoading && !error && (
        <div className="space-y-2">
          {objects.length === 0 && searchQuery.trim() ? (
            <div className="text-center py-8">
              <p className="text-text-secondary">未找到匹配的对象</p>
            </div>
          ) : objects.length === 0 && !searchQuery.trim() ? (
            <div className="text-center py-8">
              <p className="text-text-secondary">输入搜索词开始搜索</p>
            </div>
          ) : (
            objects.map((object) => (
              <div
                key={object.id}
                onClick={() => onObjectSelect(object)}
                className="p-4 bg-ui-background rounded-lg border border-border hover:bg-ui-hover-background cursor-pointer transition-colors duration-200"
              >
                <h3 className="text-text-primary font-medium">{object.name}</h3>
                <p className="text-text-secondary text-sm mt-1">
                  ID: {object.id}
                </p>
                {object.relations && Object.keys(object.relations).length > 0 && (
                  <div className="mt-2 text-xs text-text-secondary">
                    属性: {Object.keys(object.relations).join(', ')}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ObjectsList;