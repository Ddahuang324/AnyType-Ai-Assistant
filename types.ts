// Represents a single property or "Relation" of an Anytype object.
export type Relation = string | string[] | number | boolean | null;

// Represents a single row or "Object" in a knowledge base set.
export interface AnyObject {
  id: string;
  name: string;
  relations: Record<string, Relation>;
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
}