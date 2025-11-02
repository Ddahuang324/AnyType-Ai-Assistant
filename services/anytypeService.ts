import type { Space, Project, ObjectSet, AnyObject, Relation, RelationConfig, AnytypeObjectResponse, AnytypeObjectsListResponse } from '../types';

/**
 * Anytype API Service
 * Handles all communication with Anytype MCP API
 */

// Default Anytype API endpoint (using proxy in development)
const DEFAULT_ANYTYPE_ENDPOINT = '/api';

/**
 * 转换 API 端点：如果是本地 MCP 服务，使用代理路由
 * 在开发环境中，所有对 /api/* 的请求都会被代理到 http://127.0.0.1:31009
 */
function normalizeApiEndpoint(endpoint: string): string {
  if (!endpoint) return DEFAULT_ANYTYPE_ENDPOINT;
  
  // 如果是本地 MCP 服务的地址，使用代理路由
  if (endpoint.includes('127.0.0.1') || endpoint.includes('localhost:31009')) {
    console.log('✅ Converting local endpoint to proxy route:', endpoint, '→', '/api');
    return '/api';
  }
  
  // 其他情况保持原样（用于远程 API）
  console.log('⚠️ Using endpoint as-is (not local):', endpoint);
  return endpoint;
}

/**
 * Validates if the Anytype API endpoint is reachable and returns a valid structure.
 * 
 * @param apiEndpoint - The base URL for the Anytype API (e.g., http://localhost:31009).
 * @param apiKey - The API key for authentication
 * @returns A promise that resolves to true if the API is valid, false otherwise.
 */
export async function validateAnytypeApi(apiEndpoint: string, apiKey?: string): Promise<boolean> {
  const normalizedEndpoint = normalizeApiEndpoint(apiEndpoint);
  
  if (!normalizedEndpoint) return false;
  
  try {
    const headers: Record<string, string> = {
      'Anytype-Version': '2025-05-20',
      'Content-Type': 'application/json',
    };
    
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    // Try to fetch spaces as a basic health check
    console.log(`Validating Anytype API at: ${normalizedEndpoint}/v1/spaces`);
    const response = await fetch(`${normalizedEndpoint}/v1/spaces`, { 
      headers,
      method: 'GET',
      mode: 'cors'
    });

    console.log(`API validation response status: ${response.status}`);
    
    // If we get any valid response, the endpoint is reachable
    const isValid = response.ok || response.status === 401; // 401 means auth issue but endpoint exists
    
    if (isValid) {
      console.log('✅ Anytype API is reachable');
    } else {
      console.warn('⚠️ Anytype API returned error status:', response.status);
    }
    
    return isValid;
  } catch (error) {
    console.error("❌ Anytype API validation failed:", error);
    if (error instanceof TypeError) {
      console.error('This is likely a CORS or network error. Make sure MCP server is running.');
    }
    return false;
  }
}

/**
 * Fetches and transforms all spaces for the user from the Anytype API.
 * 
 * @param apiEndpoint - The base URL for the Anytype API
 * @param apiKey - The API key for authentication
 * @returns A promise that resolves to an array of Space objects.
 */
export async function fetchAllSpaces(apiEndpoint: string, apiKey?: string): Promise<Space[]> {
  const normalizedEndpoint = normalizeApiEndpoint(apiEndpoint);
  
  if (!normalizedEndpoint) {
    console.warn("Anytype API endpoint is not configured.");
    return [];
  }

  try {
    const headers: Record<string, string> = {
      'Anytype-Version': '2025-05-20',
      'Content-Type': 'application/json',
    };
    
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
      console.log('🔐 API Key provided in request');
    } else {
      console.warn('⚠️ No API Key provided - request will be sent without authentication');
    }

    console.log(`📡 Fetching spaces from: ${normalizedEndpoint}/v1/spaces`);
    console.log(`📋 Request headers:`, { ...headers, 'Authorization': headers['Authorization'] ? '***MASKED***' : 'not set' });

    const response = await fetch(`${normalizedEndpoint}/v1/spaces`, {
      method: 'GET',
      headers,
    });

    console.log(`📊 Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API returned error status:`, errorText);
      if (response.status === 401) {
        throw new Error('Invalid Anytype API Key');
      }
      throw new Error(`Anytype API request failed: ${response.statusText}`);
    }

    const rawData: any = await response.json();

    console.log(`📦 Raw API response:`, JSON.stringify(rawData, null, 2));

    if ((rawData as any).error) {
      throw new Error(`API returned an error: ${(rawData as any).error}`);
    }

    // 根据 OpenAPI 文档，响应格式是 PaginatedResponse-apimodel_Space
    // 结构为: { data: [...], pagination: {...} }
    let spacesArray: any[] = [];
    
    console.log(`🔍 Looking for spaces array...`);
    
    // 尝试多个可能的位置
    if (Array.isArray(rawData.data)) {
      spacesArray = rawData.data;
      console.log(`   ✅ Found spaces in data field (count: ${spacesArray.length})`);
    } else if (Array.isArray(rawData.spaces)) {
      spacesArray = rawData.spaces;
      console.log(`   ✅ Found spaces in spaces field (count: ${spacesArray.length})`);
    } else if (Array.isArray(rawData.items)) {
      spacesArray = rawData.items;
      console.log(`   ✅ Found spaces in items field (count: ${spacesArray.length})`);
    } else {
      console.warn(`   ⚠️ Could not find spaces array in response`);
      console.log(`   📋 Response keys:`, Object.keys(rawData));
      console.log(`   📋 Response structure:`, JSON.stringify(rawData, null, 2));
    }

    if (!Array.isArray(spacesArray)) {
      console.error(`❌ Invalid data structure. Expected array, got:`, typeof spacesArray);
      throw new Error("Invalid data structure from API. Expected an array of spaces.");
    }

    if (spacesArray.length === 0) {
      console.warn(`⚠️ API returned empty spaces list`);
    }

    console.log(`📊 Found ${spacesArray.length} spaces in response`);

    // Transform API response to Space objects
    const transformedSpaces: Space[] = spacesArray
      .map((rawSpace: any): Space | null => {
        // Basic validation
        if (!rawSpace || typeof rawSpace.id !== 'string' || typeof rawSpace.name !== 'string') {
          console.warn(`⚠️ Invalid space object:`, rawSpace);
          return null;
        }
        
        return {
          id: rawSpace.id,
          name: rawSpace.name,
          projects: rawSpace.projects || [],
          sets: rawSpace.sets || rawSpace.objectSets || [],
        };
      })
      .filter((space): space is Space => space !== null);

    console.log(`✅ Successfully fetched and transformed ${transformedSpaces.length} spaces`);
    return transformedSpaces;
  } catch (error) {
    console.error("❌ Error fetching spaces:", error);
    return [];
  }
}

/**
 * Fetches objects from a specific space
 * 
 * @param apiEndpoint - The base URL for the Anytype API
 * @param spaceId - The ID of the space to fetch objects from
 * @param apiKey - The API key for authentication
 * @returns A promise that resolves to an array of AnyObject objects.
 */
export async function fetchObjects(apiEndpoint: string, spaceId: string, apiKey?: string): Promise<AnyObject[]> {
  const normalizedEndpoint = normalizeApiEndpoint(apiEndpoint);
  
  if (!normalizedEndpoint || !spaceId) {
    console.warn("Anytype API endpoint or space ID is not configured.");
    return [];
  }

  try {
    const headers: Record<string, string> = {
      'Anytype-Version': '2025-05-20',
      'Content-Type': 'application/json',
    };
    
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await fetch(`${normalizedEndpoint}/v1/spaces/${spaceId}/objects`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch objects: ${response.statusText}`);
    }

    const rawData: any = await response.json();
    
    // API 返回 PaginatedResponse 格式: { data: [...], pagination: {...} }
    let objectsArray = rawData.data || rawData.objects || [];

    if (!Array.isArray(objectsArray)) {
      console.warn("Invalid data structure from API. Expected an array of objects.");
      return [];
    }

    // 诊断：打印第一个对象的完整结构
    if (objectsArray.length > 0) {
      console.log('📊 First object from list API (full structure):');
      console.log(JSON.stringify(objectsArray[0], null, 2).substring(0, 1000));
    }

    const transformedObjects: AnyObject[] = objectsArray
      .map(transformAnyObject)
      .filter((obj): obj is AnyObject => obj !== null);

    return transformedObjects;
  } catch (error) {
    console.error(`Error fetching objects from space ${spaceId}:`, error);
    return [];
  }
}

/**
 * Fetches a specific object from a space
 */
export async function getObject(apiEndpoint: string, spaceId: string, objectId: string, apiKey?: string): Promise<AnyObject | null> {
  const normalizedEndpoint = normalizeApiEndpoint(apiEndpoint);
  
  if (!normalizedEndpoint || !spaceId || !objectId) {
    console.warn("Required parameters are missing.");
    return null;
  }

  try {
    const headers: Record<string, string> = {
      'Anytype-Version': '2025-05-20',
      'Content-Type': 'application/json',
    };
    
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    // 获取对象的完整信息，包括body
    const response = await fetch(`${normalizedEndpoint}/v1/spaces/${spaceId}/objects/${objectId}?format=json`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch object: ${response.statusText}`);
    }

    const rawObject: AnytypeObjectResponse = await response.json();
    console.log('Raw object with body:', rawObject);
    return transformAnyObject(rawObject);
  } catch (error) {
    console.error(`Error fetching object ${objectId}:`, error);
    return null;
  }
}

/**
 * Creates a new object in a space
 */
export async function createObject(apiEndpoint: string, spaceId: string, data: any, apiKey?: string): Promise<AnyObject | null> {
  const normalizedEndpoint = normalizeApiEndpoint(apiEndpoint);
  
  if (!normalizedEndpoint || !spaceId) {
    console.warn("Anytype API endpoint or space ID is not configured.");
    return null;
  }

  try {
    const headers: Record<string, string> = {
      'Anytype-Version': '2025-05-20',
      'Content-Type': 'application/json',
    };
    
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await fetch(`${normalizedEndpoint}/v1/spaces/${spaceId}/objects`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to create object: ${response.statusText}`);
    }

    const rawObject: AnytypeObjectResponse = await response.json();
    console.log(`✅ Object created:`, rawObject.id);
    return transformAnyObject(rawObject);
  } catch (error) {
    console.error("Error creating object:", error);
    return null;
  }
}

/**
 * Updates an object in a space
 */
export async function updateObject(apiEndpoint: string, spaceId: string, objectId: string, data: any, apiKey?: string): Promise<boolean> {
  const normalizedEndpoint = normalizeApiEndpoint(apiEndpoint);
  
  if (!normalizedEndpoint || !spaceId || !objectId) {
    console.warn("Required parameters are missing.");
    return false;
  }

  try {
    const headers: Record<string, string> = {
      'Anytype-Version': '2025-05-20',
      'Content-Type': 'application/json',
    };
    
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await fetch(`${normalizedEndpoint}/v1/spaces/${spaceId}/objects/${objectId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to update object: ${response.statusText}`);
    }

    console.log(`✅ Object updated:`, objectId);
    return true;
  } catch (error) {
    console.error("Error updating object:", error);
    return false;
  }
}

/**
 * Deletes an object from a space
 */
export async function deleteObject(apiEndpoint: string, spaceId: string, objectId: string, apiKey?: string): Promise<boolean> {
  const normalizedEndpoint = normalizeApiEndpoint(apiEndpoint);
  
  if (!normalizedEndpoint || !spaceId || !objectId) {
    console.warn("Required parameters are missing.");
    return false;
  }

  try {
    const headers: Record<string, string> = {
      'Anytype-Version': '2025-05-20',
      'Content-Type': 'application/json',
    };
    
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await fetch(`${normalizedEndpoint}/v1/spaces/${spaceId}/objects/${objectId}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to delete object: ${response.statusText}`);
    }

    console.log(`✅ Object deleted:`, objectId);
    return true;
  } catch (error) {
    console.error("Error deleting object:", error);
    return false;
  }
}

/**
 * Searches for objects in a space
 */
export async function searchObjects(apiEndpoint: string, spaceId: string, query: string, apiKey?: string): Promise<AnyObject[]> {
  const normalizedEndpoint = normalizeApiEndpoint(apiEndpoint);
  
  if (!normalizedEndpoint || !spaceId) {
    console.warn("Anytype API endpoint or space ID is not configured.");
    return [];
  }

  try {
    const headers: Record<string, string> = {
      'Anytype-Version': '2025-05-20',
      'Content-Type': 'application/json',
    };
    
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const requestBody = {
      query: query || "",
      sort: {
        property_key: "last_modified_date",
        direction: "desc"
      }
    };

    const response = await fetch(`${normalizedEndpoint}/v1/spaces/${spaceId}/search?offset=0&limit=100`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Failed to search objects: ${response.statusText}`);
    }

    const rawData: any = await response.json();
    
    // API 返回 PaginatedResponse 格式: { data: [...], pagination: {...} }
    const objectsArray = rawData.data || rawData.objects || [];

    if (!Array.isArray(objectsArray)) {
      console.warn("Invalid data structure from API.");
      return [];
    }

    return objectsArray
      .map(transformAnyObject)
      .filter((obj): obj is AnyObject => obj !== null);
  } catch (error) {
    console.error("Error searching objects:", error);
    return [];
  }
}

/**
 * A helper function to transform raw API objects into the application's AnyObject type.
 */
function transformAnyObject(rawObject: any): AnyObject | null {
  // Handle nested object structure from API
  const actualObject = (rawObject.object && typeof rawObject.object === 'object') ? rawObject.object : rawObject;
  
  if (!actualObject || typeof actualObject.id !== 'string' || typeof actualObject.name !== 'string') {
    console.warn('Skipping invalid object in data:', rawObject);
    return null;
  }

  // 诊断日志：检查关键字段
  console.log(`🔄 Transform object "${actualObject.name}"`);
  console.log(`   Has links: ${!!actualObject.links}, Has body: ${!!actualObject.body}`);
  console.log(`   Links value: ${actualObject.links ? JSON.stringify(actualObject.links).substring(0, 100) : 'undefined'}`);
  console.log(`   Body value: ${actualObject.body ? actualObject.body.substring(0, 100) : 'undefined'}`);

  // Convert properties array to relations object
  const relations: Record<string, Relation> = {};
  if (Array.isArray(actualObject.properties)) {
    actualObject.properties.forEach(prop => {
      if (prop && prop.key && typeof prop.key === 'string') {
        // Handle different property formats
        if (prop.text !== undefined) {
          relations[prop.key] = prop.text;
        } else if (prop.number !== undefined) {
          relations[prop.key] = prop.number;
        } else if (prop.checkbox !== undefined) {
          relations[prop.key] = prop.checkbox;
        } else if (prop.select) {
          relations[prop.key] = prop.select.name || prop.select.id;
        } else if (prop.multi_select) {
          relations[prop.key] = prop.multi_select.map(item => item.name || item.id);
        } else if (prop.date) {
          relations[prop.key] = prop.date;
        } else if (prop.files) {
          relations[prop.key] = prop.files;
        } else if (prop.url) {
          relations[prop.key] = prop.url;
        } else if (prop.email) {
          relations[prop.key] = prop.email;
        } else if (prop.phone) {
          relations[prop.key] = prop.phone;
        } else if (prop.objects) {
          relations[prop.key] = prop.objects;
        } else {
          relations[prop.key] = null;
        }
      }
    });
  }

  // 获取links数组 - 这是对象关系的关键字段
  const links: string[] = Array.isArray(actualObject.links) ? actualObject.links : [];

  const children = parseChildrenFromBody(actualObject.body);

  console.log(`   ✅ After transform: links=${links.length}, children=${children.length}`);

  return {
    id: actualObject.id,
    name: actualObject.name,
    relations,
    children,
    links, // 添加links字段用于树结构构建
  };
}

/**
 * 从对象的body中解析子对象ID
 * 支持两种嵌入方式：
 * 1. 直接的对象块 (type === 'object')
 * 2. Dataview块 (type === 'dataview') - 包含targetObjectId
 * 3. Link块 (type === 'link') - 包含targetBlockId
 */
function parseChildrenFromBody(body?: string): string[] {
  if (!body) {
    console.log('📦 parseChildrenFromBody: body is empty/undefined');
    return [];
  }
  
  console.log('📦 parseChildrenFromBody called with body:', body.substring(0, 200));
  
  try {
    const bodyData = JSON.parse(body);
    console.log('📦 Parsed body data:', bodyData);
    
    // 假设body是blocks数组
    if (Array.isArray(bodyData)) {
      const childIds: string[] = [];
      
      for (const block of bodyData) {
        if (!block) continue;

        console.log(`🔍 Block type: ${block.type}, content:`, block.content);

        // 1. 直接的对象块
        if (block.type === 'object' && block.content?.objectId) {
          console.log(`✅ Found object block with objectId: ${block.content.objectId}`);
          childIds.push(block.content.objectId);
        }
        
        // 2. Dataview块 - 这是Collection/Set对象的引用！
        // 参考Anytype源码 BlockDataview，它有content中的targetObjectId或block.getTargetObjectId()
        else if (block.type === 'dataview' && block.content) {
          // Dataview可能有targetObjectId直接在content中
          if (block.content.targetObjectId) {
            console.log(`✅ Found dataview block with targetObjectId: ${block.content.targetObjectId}`);
            childIds.push(block.content.targetObjectId);
          }
          // 或者通过fields.targetObjectId
          else if (block.fields?.targetObjectId) {
            console.log(`✅ Found dataview block with fields.targetObjectId: ${block.fields.targetObjectId}`);
            childIds.push(block.fields.targetObjectId);
          }
        }
        
        // 3. Link块 - 链接到另一个对象
        else if (block.type === 'link' && block.content?.targetBlockId) {
          console.log(`✅ Found link block with targetBlockId: ${block.content.targetBlockId}`);
          childIds.push(block.content.targetBlockId);
        }
        
        // 4. 从文本块中提取内联对象引用
        else if (block.content?.text) {
          const matches = block.content.text.match(/\[\[([^\]]+)\]\]/g);
          if (matches) {
            for (const match of matches) {
              const objectId = match.slice(2, -2); // 移除[[ ]]
              // 假设是对象ID
              if (objectId && objectId.match(/^[a-zA-Z0-9_-]+$/)) {
                console.log(`✅ Found inline object reference: ${objectId}`);
                childIds.push(objectId);
              }
            }
          }
        }
      }
      
      console.log('✅ Total child IDs found from body:', childIds);
      return childIds;
    }
  } catch (error) {
    console.error('❌ Failed to parse body:', error);
  }
  
  return [];
}

/**
 * Gets the default Anytype endpoint
 */
export function getDefaultAnytypeEndpoint(): string {
  return DEFAULT_ANYTYPE_ENDPOINT;
}

/**
 * Builds Anytype API headers with authentication
 */
export function buildAnytypeHeaders(apiKey?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Anytype-Version': '2025-05-20',
    'Content-Type': 'application/json',
  };
  
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }
  
  return headers;
}
