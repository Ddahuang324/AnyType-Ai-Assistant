// Represents a single property or "Relation" of an Anytype object.
export type Relation = string | string[] | number | boolean | null;

// Represents a single row or "Object" in a knowledge base set.
export interface AnyObject {
  id: string;
  name: string;
  relations: Record<string, Relation>;
  children?: AnyObject[]; // Allows objects to be nested
}

// Defines the configuration for rendering a table column (a "Relation").
export interface RelationConfig {
  key: string;
  label: string;
  type: 'text' | 'tag' | 'status' | 'date' | 'url';
}

// Defines a complete knowledge base or "Set" of objects.
export interface ObjectSet {
  id: string;
  name: string;
  description: string;
  relations: RelationConfig[];
  objects: AnyObject[];
}

// Represents a high-level project in the main gallery.
export interface Project {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  // Links this project card to a specific ObjectSet.
  linkedSetId: string; 
}

// Represents the top-level container, a "Space", which holds projects and sets.
export interface Space {
  id: string;
  name: string;
  projects: Project[];
  sets: ObjectSet[];
}


export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export interface ChatHistoryItem {
  id:string;
  title: string;
  messages: Message[];
  blueprintId?: string; // Link to the blueprint that started this chat
}

export interface Blueprint {
  id: string;
  title: string;
  prompt: string;
}

// Anytype API Response Types
export interface AnytypeSpaceResponse {
  id: string;
  name: string;
  created_at?: string;
  updated_at?: string;
  members_count?: number;
}

export interface AnytypeObjectResponse {
  id: string;
  name: string;
  type?: string;
  created_at?: string;
  updated_at?: string;
  properties?: Record<string, any>;
  body?: string;
}

export interface AnytypeObjectsListResponse {
  objects?: AnytypeObjectResponse[];
  spaces?: AnytypeSpaceResponse[];
}

// MCP Command Types for AI Translation
export interface McpCommand {
  action: 'CREATE_OBJECT' | 'UPDATE_OBJECT' | 'DELETE_OBJECT' | 'ADD_RELATION' | 'SEARCH_OBJECTS' | 'LIST_OBJECTS' | 'GET_OBJECT';
  parameters: Record<string, any>;
  description: string;
}

export interface TranslationResult {
  success: boolean;
  command?: McpCommand;
  error?: string;
  rawResponse?: string;
}