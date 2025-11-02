import React, { useContext } from 'react';
import type { AnyObject, Space } from '../types';
import { SettingsContext } from '../contexts/SettingsContext';
import { useObject } from '../hooks/useObject';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import LoaderIcon from './icons/LoaderIcon';
import ObjectTree from './ObjectTree';

interface ObjectDetailProps {
  space: Space;
  objectId: string;
  onBack: () => void;
}

const ObjectDetail: React.FC<ObjectDetailProps> = ({ space, objectId, onBack }) => {
  const { anytypeApiEndpoint, anytypeApiKey } = useContext(SettingsContext);
  const { object, isLoading, error } = useObject(space.id, objectId, anytypeApiEndpoint, anytypeApiKey);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoaderIcon />
        <span className="ml-2 text-text-secondary">加载中...</span>
      </div>
    );
  }

  if (error || !object) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">加载失败: {error || '对象不存在'}</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors"
        >
          返回
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <header className="mb-8">
        <button
          onClick={onBack}
          className="flex items-center text-text-secondary hover:text-text-primary transition-colors duration-200 mb-4"
        >
          <ArrowLeftIcon />
          <span className="ml-2 font-medium">返回</span>
        </button>
        <h1 className="text-3xl md:text-4xl font-bold text-text-primary">{object.name}</h1>
        <p className="text-text-secondary mt-2">对象详情</p>
      </header>

      {/* Object Details */}
      <div className="bg-ui-background rounded-lg shadow-md p-8 border border-border">
        <div className="space-y-6">
          {/* Basic Info */}
          <div>
            <h2 className="text-xl font-semibold text-text-primary mb-4">基本信息</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary">ID</label>
                <p className="mt-1 text-text-primary font-mono text-sm">{object.id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary">名称</label>
                <p className="mt-1 text-text-primary">{object.name}</p>
              </div>
            </div>
          </div>

          {/* Relations/Properties */}
          {object.relations && Object.keys(object.relations).length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-text-primary mb-4">属性</h2>
              <div className="space-y-3">
                {Object.entries(object.relations).map(([key, value]) => (
                  <div key={key} className="flex flex-col sm:flex-row sm:items-center">
                    <label className="block text-sm font-medium text-text-secondary sm:w-1/3">
                      {key}
                    </label>
                    <div className="mt-1 sm:mt-0 sm:ml-4 flex-1">
                      {Array.isArray(value) ? (
                        <div className="flex flex-wrap gap-2">
                          {value.map((item, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-accent/10 text-accent rounded text-sm"
                            >
                              {String(item)}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-text-primary">
                          {value === null || value === undefined ? '无' : String(value)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Object Relations Tree */}
          <div>
            <h2 className="text-xl font-semibold text-text-primary mb-4">对象关系树 - 基于Links字段</h2>
            <p className="text-text-secondary text-sm mb-3">显示该对象及其所有关联对象的树状结构</p>
            <ObjectTree
              space={space}
              rootObjectId={objectId}
              apiEndpoint={anytypeApiEndpoint}
              apiKey={anytypeApiKey}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ObjectDetail;