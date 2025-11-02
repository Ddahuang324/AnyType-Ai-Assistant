import { useState, useEffect } from 'react';
import type { AnyObject } from '../types';
import * as anytypeService from '../services/anytypeService';

/**
 * Hook用于获取对象的直接关系（links字段）
 * 参考Anytype源码的widget/tree实现，使用links字段来表示对象之间的关系
 */
export function useObjectRelations(spaceId: string, rootObjectId: string, apiEndpoint: string, apiKey?: string) {
  const [relations, setRelations] = useState<{direct: string[], nested: string[]}>({direct: [], nested: []});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!spaceId || !rootObjectId || !apiEndpoint) return;

    const fetchRelations = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // 获取根对象的完整信息，包括links字段
        const rootObject = await anytypeService.getObject(apiEndpoint, spaceId, rootObjectId, apiKey);
        if (!rootObject) {
          throw new Error('Failed to fetch root object');
        }

        const direct: string[] = [];
        const nested: string[] = [];

        // 直接关系：使用API返回的links字段
        // 参考源码：const links = filterDeletedLinks(Relation.getArrayValue(childNode.links))
        if (rootObject.links && Array.isArray(rootObject.links)) {
          direct.push(...rootObject.links.filter(link => link && typeof link === 'string'));
        }

        // 嵌套关系：查询所有对象，找那些在其links中引用了rootObjectId的对象
        // 这模拟了Anytype中的反向关系查询
        try {
          const allObjects = await anytypeService.fetchObjects(apiEndpoint, spaceId, apiKey);

          for (const obj of allObjects) {
            if (obj.id === rootObjectId) continue;

            // 检查该对象的links是否包含根对象ID
            if (obj.links && Array.isArray(obj.links) && obj.links.includes(rootObjectId)) {
              if (!nested.includes(obj.id)) {
                nested.push(obj.id);
              }
            }
          }
        } catch (err) {
          console.warn('Failed to fetch all objects for nested relations:', err);
          // 继续，只使用direct relations
        }

        setRelations({ direct, nested });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch object relations');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRelations();
  }, [spaceId, rootObjectId, apiEndpoint, apiKey]);

  return { relations, isLoading, error };
}