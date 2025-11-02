import React, { useState, useEffect } from 'react';
import type { AnyObject, Space } from '../types';
import { useObjects } from '../hooks/useObjects';
import * as anytypeService from '../services/anytypeService';

interface TreeNode {
  id: string;
  name: string;
  children: TreeNode[];
  depth: number;
  isExpanded: boolean;
  numChildren: number;
}

interface ObjectTreeProps {
  space: Space;
  rootObjectId: string;
  apiEndpoint: string;
  apiKey?: string;
}

/**
 * ObjectTree组件
 * 参考Anytype源码widget/tree/index.tsx的实现
 * 支持两种关系：
 * 1. links字段 - 对象之间的直接关系
 * 2. children字段 - 从body中解析的嵌入对象（如Page中的Dataview）
 */
const ObjectTree: React.FC<ObjectTreeProps> = ({
  space,
  rootObjectId,
  apiEndpoint,
  apiKey
}) => {
  const { objects, isLoading, error } = useObjects(space.id, apiEndpoint, apiKey);
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [loadingTree, setLoadingTree] = useState(false);

  // 构建树结构，参考Anytype源码的loadTreeRecursive逻辑
  const buildTree = async (objects: AnyObject[], rootId: string): Promise<TreeNode[]> => {
    const objectMap = new Map(objects.map(obj => [obj.id, obj]));
    const visited = new Set<string>();
    const branches = new Set<string>(); // 防止循环引用
    const fullObjectCache = new Map<string, AnyObject>(); // 缓存已加载的完整对象

    /**
     * 获取对象的完整信息（包含links和children）
     * 如果对象已经在列表中有这些字段，直接返回
     * 否则，从API动态加载
     */
    const getFullObject = async (objectId: string): Promise<AnyObject | null> => {
      console.log(`🔍 getFullObject called for: ${objectId}`);
      
      // 检查缓存
      if (fullObjectCache.has(objectId)) {
        console.log(`💾 Returning cached object: ${objectId}`);
        return fullObjectCache.get(objectId)!;
      }

      // 检查是否在列表中
      let obj = objectMap.get(objectId);
      if (!obj) {
        console.log(`🔄 Object ${objectId} not in list, fetching from API...`);
        try {
          obj = await anytypeService.getObject(apiEndpoint, space.id, objectId, apiKey);
          if (obj) {
            objectMap.set(objectId, obj);
            console.log(`✅ Fetched object ${objectId} from API (new)`);
          }
        } catch (err) {
          console.error(`Failed to fetch object ${objectId}:`, err);
          return null;
        }
      } else {
        console.log(`✓ Object ${objectId} found in list`);
      }

      // 检查是否有links/children字段
      // ⚠️ 注意：空数组[] 在JS中是truthy的，所以需要检查长度
      const hasLinks = obj && Array.isArray(obj.links) && obj.links.length > 0;
      const hasChildren = obj && Array.isArray(obj.children) && obj.children.length > 0;
      
      if (obj && !hasLinks && !hasChildren) {
        console.log(`📥 Object ${objectId} ("${obj.name}") missing links/children, fetching full details...`);
        try {
          const fullObj = await anytypeService.getObject(apiEndpoint, space.id, objectId, apiKey);
          if (fullObj) {
            objectMap.set(objectId, fullObj);
            obj = fullObj;
            console.log(`✅ Fetched full object for ${objectId}, links=${fullObj.links?.length || 0}, children=${fullObj.children?.length || 0}`);
          }
        } catch (err) {
          console.error(`Failed to fetch full object ${objectId}:`, err);
        }
      }

      if (obj) {
        fullObjectCache.set(objectId, obj);
      }

      return obj || null;
    };

    const buildNode = async (
      objectId: string,
      depth: number = 0,
      branch: string = ''
    ): Promise<TreeNode | null> => {
      // 防止循环引用和过深
      if (visited.has(objectId) || depth > 15) {
        console.log(`⚠️ Skip (visited=${visited.has(objectId)}, depth=${depth}): ${objectId}`);
        return null;
      }

      visited.add(objectId);

      // 获取完整对象（如果需要）
      const obj = await getFullObject(objectId);
      if (!obj) {
        console.log(`⚠️ Object not found: ${objectId}`);
        return null;
      }

      // 获取所有关系：既包括links（直接关系）也包括children（嵌入关系）
      const allRelationIds = new Set<string>();

      // 1. 从links获取直接关系
      if (obj.links && Array.isArray(obj.links)) {
        console.log(`🔗 Object "${obj.name}" has ${obj.links.length} links:`, obj.links.slice(0, 3));
        obj.links.forEach(link => {
          if (link && typeof link === 'string') {
            allRelationIds.add(link);
          }
        });
      } else {
        console.log(`🔗 Object "${obj.name}" has no links (links=${obj.links})`);
      }

      // 2. 从children获取嵌入关系（如Page中的Dataview指向的Collection）
      if (obj.children && Array.isArray(obj.children)) {
        console.log(`👶 Object "${obj.name}" has ${obj.children.length} children:`, obj.children.slice(0, 3));
        obj.children.forEach(childId => {
          if (childId && typeof childId === 'string') {
            allRelationIds.add(childId);
          }
        });
      } else {
        console.log(`👶 Object "${obj.name}" has no children (children=${obj.children})`);
      }

      // 过滤掉已访问的分支，防止循环
      const validLinks = Array.from(allRelationIds).filter(linkId => {
        const branchId = `${branch}-${linkId}`;
        if (branches.has(branchId)) {
          return false;
        }
        branches.add(branchId);
        return true;
      });

      const numChildren = validLinks.length;
      const children: TreeNode[] = [];

      // 只有默认展开前两层的子节点
      if (depth < 2 && numChildren > 0) {
        for (const childId of validLinks) {
          const childBranch = `${branch}-${objectId}`;
          const childNode = await buildNode(childId, depth + 1, childBranch);
          if (childNode) {
            children.push(childNode);
          }
        }
      }

      return {
        id: obj.id,
        name: obj.name,
        children,
        depth,
        isExpanded: depth < 2, // 默认展开前两层
        numChildren
      };
    };

    const rootNode = await buildNode(rootId, 0, '');
    console.log('✅ 树结构构建完成:', rootNode);
    return rootNode ? [rootNode] : [];
  };

  useEffect(() => {
    if (objects.length > 0) {
      console.log(`📊 Building tree from ${objects.length} objects`);
      console.log(`📋 First object sample:`, objects[0]);
      console.log(`   Has links: ${!!objects[0].links}, links type: ${typeof objects[0].links}`);
      console.log(`   Has children: ${!!objects[0].children}, children type: ${typeof objects[0].children}`);
      
      setLoadingTree(true);
      buildTree(objects, rootObjectId)
        .then(tree => {
          setTreeData(tree);
          console.log('✅ Tree structure built:', tree);
        })
        .catch(err => {
          console.error('❌ Error building tree:', err);
        })
        .finally(() => {
          setLoadingTree(false);
        });
    }
  }, [objects, rootObjectId]);

  const toggleNode = (nodeId: string) => {
    const updateNode = (nodes: TreeNode[]): TreeNode[] => {
      return nodes.map(node => {
        if (node.id === nodeId) {
          return { ...node, isExpanded: !node.isExpanded };
        }
        if (node.children.length > 0) {
          return { ...node, children: updateNode(node.children) };
        }
        return node;
      });
    };

    setTreeData(updateNode(treeData));
  };

  const renderNode = (node: TreeNode): React.ReactNode => {
    const hasChildren = node.numChildren > 0;
    const paddingLeft = node.depth * 20 + 8;

    return (
      <div key={node.id}>
        <div
          className="flex items-center py-2 px-2 hover:bg-ui-hover cursor-pointer rounded"
          style={{ paddingLeft }}
          onClick={() => hasChildren && toggleNode(node.id)}
        >
          {/* 展开/折叠图标 */}
          <div className="w-4 h-4 flex items-center justify-center mr-2">
            {hasChildren ? (
              <svg
                className={`w-3 h-3 transition-transform ${node.isExpanded ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            ) : (
              <div className="w-2 h-2 bg-text-secondary rounded-full"></div>
            )}
          </div>

          {/* 对象图标 */}
          <div className="w-4 h-4 bg-accent rounded mr-3 flex-shrink-0"></div>

          {/* 对象名称 */}
          <span className="text-text-primary text-sm truncate flex-1">{node.name}</span>

          {/* 子节点数量 */}
          {hasChildren && (
            <span className="text-xs text-text-secondary bg-ui-background px-2 py-0.5 rounded ml-2">
              {node.numChildren}
            </span>
          )}
        </div>

        {/* 子节点 */}
        {hasChildren && node.isExpanded && node.children.length > 0 && (
          <div>
            {node.children.map(child => renderNode(child))}
          </div>
        )}
      </div>
    );
  };

  if (isLoading || loadingTree) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-accent"></div>
        <span className="ml-2 text-text-secondary text-sm">
          {isLoading ? '加载对象列表...' : '构建树结构并加载完整对象信息...'}
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4">
        <p className="text-red-500 text-sm">⚠️ 加载失败: {error}</p>
      </div>
    );
  }

  if (treeData.length === 0 || treeData[0]?.numChildren === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-text-secondary text-sm">📭 暂无对象关系</p>
      </div>
    );
  }

  return (
    <div className="max-h-96 overflow-y-auto border border-border rounded-lg bg-ui-background">
      {treeData.map(node => renderNode(node))}
    </div>
  );
};

export default ObjectTree;