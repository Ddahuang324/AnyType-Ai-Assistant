import React, { useState, useContext, useEffect } from 'react';
import type { AnyObject, Space } from '../types';
import { SettingsContext } from '../contexts/SettingsContext';
import { useSearch } from '../hooks/useSearch';
import * as anytypeService from '../services/anytypeService';
import LoaderIcon from './icons/LoaderIcon';

interface ObjectsListProps {
  space: Space;
  onObjectSelect: (object: AnyObject) => void;
}

const ObjectsList: React.FC<ObjectsListProps> = ({ space, onObjectSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedObjects, setExpandedObjects] = useState<Set<string>>(new Set());
  const [childObjects, setChildObjects] = useState<Record<string, AnyObject[]>>({});
  const [loadingChildren, setLoadingChildren] = useState<Set<string>>(new Set());
  const { anytypeApiEndpoint, anytypeApiKey } = useContext(SettingsContext);

  const { objects, isLoading, error } = useSearch(space.id, searchQuery, anytypeApiEndpoint, anytypeApiKey);

  // 获取子对象
  useEffect(() => {
    const fetchChildObjects = async () => {
      for (const objectId of expandedObjects) {
        if (childObjects[objectId] || loadingChildren.has(objectId)) continue;

        const object = objects.find(obj => obj.id === objectId);
        if (!object) continue;

        // 获取对象的完整信息来解析子对象
        const fullObject = await anytypeService.getObject(anytypeApiEndpoint, space.id, object.id, anytypeApiKey);
        
        const relatedObjectIds: string[] = [];
        if (fullObject && fullObject.children) {
          relatedObjectIds.push(...fullObject.children);
        }
        
        // 然后检查relations中的objects属性
        for (const [key, value] of Object.entries(object.relations)) {
          console.log(`Relation ${key}:`, value);
          if (Array.isArray(value) && value.every(item => typeof item === 'string')) {
            // 假设这是objects属性，包含对象ID数组
            relatedObjectIds.push(...value);
          }
        }
        
        console.log('Found related object IDs:', relatedObjectIds);

        if (relatedObjectIds.length === 0) continue;

        setLoadingChildren(prev => new Set(prev).add(objectId));

        try {
          const children: AnyObject[] = [];
          for (const childId of relatedObjectIds.slice(0, 5)) { // 限制最多5个
            console.log(`Fetching child object: ${childId}`);
            const childObject = await anytypeService.getObject(anytypeApiEndpoint, space.id, childId, anytypeApiKey);
            if (childObject) {
              children.push(childObject);
              console.log(`Fetched child object: ${childObject.name}`);
            } else {
              console.warn(`Failed to fetch child object: ${childId}`);
            }
          }
          setChildObjects(prev => ({ ...prev, [objectId]: children }));
        } catch (err) {
          console.error('Failed to fetch child objects:', err);
        } finally {
          setLoadingChildren(prev => {
            const newSet = new Set(prev);
            newSet.delete(objectId);
            return newSet;
          });
        }
      }
    };

    if (expandedObjects.size > 0) {
      fetchChildObjects();
    }
  }, [expandedObjects, objects, anytypeApiEndpoint, anytypeApiKey, space.id, childObjects, loadingChildren]);

  const toggleExpanded = (objectId: string) => {
    setExpandedObjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(objectId)) {
        newSet.delete(objectId);
      } else {
        newSet.add(objectId);
      }
      return newSet;
    });
  };

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
              <div key={object.id} className="border border-border rounded-lg">
                <div
                  onClick={() => onObjectSelect(object)}
                  className="p-4 bg-ui-background hover:bg-ui-hover-background cursor-pointer transition-colors duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
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
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpanded(object.id);
                      }}
                      className="ml-2 p-2 text-text-secondary hover:text-text-primary transition-colors"
                      title={expandedObjects.has(object.id) ? '折叠' : '展开预览'}
                    >
                      {expandedObjects.has(object.id) ? '▼' : '▶'}
                    </button>
                  </div>
                </div>
                {expandedObjects.has(object.id) && (
                  <div className="px-4 pb-4 border-t border-border">
                    {loadingChildren.has(object.id) ? (
                      <div className="flex items-center justify-center py-4">
                        <LoaderIcon />
                        <span className="ml-2 text-text-secondary text-sm">加载子对象...</span>
                      </div>
                    ) : childObjects[object.id] && childObjects[object.id].length > 0 ? (
                      <div className="mt-3">
                        <h4 className="text-sm font-medium text-text-primary mb-2">相关对象:</h4>
                        <div className="space-y-2">
                          {childObjects[object.id].map((child) => (
                            <div
                              key={child.id}
                              onClick={() => onObjectSelect(child)}
                              className="p-3 bg-ui-hover-background rounded border border-border hover:bg-ui-background cursor-pointer transition-colors"
                            >
                              <h5 className="text-text-primary font-medium text-sm">{child.name}</h5>
                              <p className="text-text-secondary text-xs mt-1">ID: {child.id}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 text-sm text-text-secondary">
                        无相关对象
                      </div>
                    )}
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