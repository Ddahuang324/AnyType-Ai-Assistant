import React, { useState, useEffect } from 'react';
import type { Project, ObjectSet, Space, AnyObject, RelationConfig } from '../types';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';
import ObjectsList from './ObjectsList';
import ObjectDetail from './ObjectDetail';

/**
 * 简化后的 Hub 主页面
 * 重点：展示知识图谱的入口点（Hub Items）
 */
interface NotesViewProps {
  space: Space;
}

const NotesView: React.FC<NotesViewProps> = ({ space }) => {
  const [isDetailViewVisible, setIsDetailViewVisible] = useState(false);
  const [isObjectDetailVisible, setIsObjectDetailVisible] = useState(false);
  const [activeSetId, setActiveSetId] = useState<string | null>(null);
  const [selectedObject, setSelectedObject] = useState<AnyObject | null>(null);
  const [allObjectsMap, setAllObjectsMap] = useState<Map<string, AnyObject>>(new Map());

  // 初始化对象 Map
  useEffect(() => {
    if (space?.sets) {
      const objectsMap = new Map(space.sets.flatMap(s => s.objects).map(obj => [obj.id, obj]));
      setAllObjectsMap(objectsMap);
    }
  }, [space?.sets]);

  const activeSet = activeSetId ? space.sets.find(set => set.id === activeSetId) : null;

  // 按 ID 查找对象
  const findObjectById = (objectId: string): { set: ObjectSet; object: AnyObject } | null => {
    for (const set of space.sets) {
      const traverse = (objects: AnyObject[]): AnyObject | null => {
        for (const obj of objects) {
          if (obj.id === objectId) return obj;
          if (obj.children) {
            const found = traverse(obj.children);
            if (found) return found;
          }
        }
        return null;
      };
      const found = traverse(set.objects);
      if (found) return { set, object: found };
    }
    return null;
  };

  const handleObjectSelect = (object: AnyObject) => {
    setSelectedObject(object);
    setIsObjectDetailVisible(true);
  };

  const handleBack = () => {
    if (isObjectDetailVisible) {
      // 从对象详情返回直接回到主页
      setIsObjectDetailVisible(false);
      setIsDetailViewVisible(false);
      setTimeout(() => {
        setSelectedObject(null);
        setActiveSetId(null);
      }, 500);
    } else if (isDetailViewVisible) {
      // 从集合详情返回回到主页
      setIsDetailViewVisible(false);
      setTimeout(() => {
        setActiveSetId(null);
      }, 500);
    }
  };

  return (
    <div className="w-full relative">
      {/* 主视图 - 对象搜索和列表 */}
      {!isObjectDetailVisible && !isDetailViewVisible && (
        <div className="w-full">
          <header className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-text-primary">对象中心</h1>
            <p className="text-text-secondary mt-2">搜索和浏览您的 Anytype 对象</p>
          </header>

          <ObjectsList space={space} onObjectSelect={handleObjectSelect} />
        </div>
      )}

      {/* 对象详情视图 */}
      {selectedObject && isObjectDetailVisible && (
        <div
          className={`absolute top-0 left-0 w-full transition-opacity duration-500 ease-in-out ${
            isObjectDetailVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <ObjectDetail
            space={space}
            objectId={selectedObject.id}
            onBack={handleBack}
          />
        </div>
      )}

      {/* 集合详情视图 */}
      {activeSet && !selectedObject && (
        <div
          className={`absolute top-0 left-0 w-full transition-opacity duration-500 ease-in-out ${
            isDetailViewVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <header className="mb-8">
            <button
              onClick={handleBack}
              className="flex items-center text-text-secondary hover:text-text-primary transition-colors duration-200 mb-4"
            >
              <ArrowLeftIcon />
              <span className="ml-2 font-medium">返回</span>
            </button>
            <h1 className="text-3xl md:text-4xl font-bold text-text-primary">{activeSet.name}</h1>
            <p className="text-text-secondary mt-2">{activeSet.description}</p>
          </header>

          <div className="bg-ui-background rounded-lg shadow-md p-8 border border-border">
            <div className="p-8 text-center bg-ui-hover-background/50 rounded-lg border border-dashed border-border">
              <div className="text-3xl mb-3">📚</div>
              <p className="text-text-secondary font-medium">集合详情</p>
              <p className="text-sm text-text-secondary mt-2">
                此处将显示集合中的对象列表。
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotesView;
