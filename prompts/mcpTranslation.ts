/**
 * Anytype AI Assistant - MCP Translation Prompts
 * 
 * This module contains prompt templates and configurations for translating
 * user natural language commands into Anytype MCP (Model Context Protocol) operations.
 */

/**
 * System prompt that defines the AI assistant's role and behavior
 */
export const SYSTEM_PROMPT = `You are the Anytype AI Assistant, a specialized AI that helps users manage their Anytype knowledge base through natural language commands.

Your primary responsibility is to understand user requests and translate them into specific Anytype operations. You must:

1. Carefully analyze the user's intent
2. Identify the most appropriate Anytype operation(s) to execute
3. Extract all necessary parameters from the user's input
4. Handle ambiguities gracefully by asking for clarification or making reasonable assumptions
5. Always respond with a well-formed JSON object in the specified format

You are familiar with Anytype concepts:
- Spaces: Top-level containers for organizing knowledge
- Objects: Individual items (pages, notes, tasks, etc.) with properties
- Properties: Attributes or relations that objects can have
- Types: Object categories that define what properties they can have
- Collections/Lists: Groups of related objects with database-like views
- Tags: Labels for categorizing and filtering objects

Be helpful, accurate, and always provide JSON responses in the exact format requested.`;

/**
 * Operation templates with examples for various use cases
 */
export const OPERATION_TEMPLATES = {
  CREATE_OBJECT: {
    description: 'Create a new object in Anytype',
    parameters: {
      space_id: 'ID of the target space',
      name: 'Name/title of the object',
      type_key: 'Type of object (page, note, task, etc.)',
      body: 'Content/description of the object',
      properties: 'Additional properties as key-value pairs',
    },
    examples: [
      {
        user_input: 'Create a new page called "AI Learning Resources"',
        ai_output: {
          action: 'CREATE_OBJECT',
          parameters: {
            name: 'AI Learning Resources',
            type_key: 'page',
          },
          description: 'Create a new page for storing AI learning materials',
        },
      },
      {
        user_input: 'Add a task to my workspace: "Complete project proposal by Friday" with high priority',
        ai_output: {
          action: 'CREATE_OBJECT',
          parameters: {
            name: 'Complete project proposal by Friday',
            type_key: 'task',
            properties: {
              priority: 'high',
            },
          },
          description: 'Create a high-priority task for the project proposal',
        },
      },
      {
        user_input: 'Create a new note with the title "Meeting Notes - 2024" and content about today\'s meeting',
        ai_output: {
          action: 'CREATE_OBJECT',
          parameters: {
            name: 'Meeting Notes - 2024',
            type_key: 'note',
            body: 'Meeting discussion points and action items from today',
          },
          description: 'Create a new note for today\'s meeting',
        },
      },
    ],
  },

  UPDATE_OBJECT: {
    description: 'Update an existing object',
    parameters: {
      space_id: 'ID of the space containing the object',
      object_id: 'ID of the object to update',
      name: 'New name (optional)',
      body: 'New content/description (optional)',
      properties: 'Updated properties (optional)',
    },
    examples: [
      {
        user_input: 'Change the title of my task to "Submit project by next week"',
        ai_output: {
          action: 'UPDATE_OBJECT',
          parameters: {
            name: 'Submit project by next week',
          },
          description: 'Update the task title',
        },
      },
      {
        user_input: 'Mark the task "Code review" as completed',
        ai_output: {
          action: 'UPDATE_OBJECT',
          parameters: {
            name: 'Code review',
            properties: {
              status: 'completed',
            },
          },
          description: 'Mark the task as completed',
        },
      },
    ],
  },

  DELETE_OBJECT: {
    description: 'Delete an object from Anytype',
    parameters: {
      space_id: 'ID of the space',
      object_id: 'ID of the object to delete',
    },
    examples: [
      {
        user_input: 'Delete the page called "Old Notes"',
        ai_output: {
          action: 'DELETE_OBJECT',
          parameters: {
            name: 'Old Notes',
          },
          description: 'Delete the "Old Notes" page',
        },
      },
    ],
  },

  SEARCH_OBJECTS: {
    description: 'Search for objects by query',
    parameters: {
      space_id: 'ID of the space to search in',
      query: 'Search query string',
    },
    examples: [
      {
        user_input: 'Find all my notes about machine learning',
        ai_output: {
          action: 'SEARCH_OBJECTS',
          parameters: {
            query: 'machine learning',
          },
          description: 'Search for all objects mentioning machine learning',
        },
      },
      {
        user_input: 'Show me all tasks marked as urgent',
        ai_output: {
          action: 'SEARCH_OBJECTS',
          parameters: {
            query: 'urgent tasks',
          },
          description: 'Search for urgent tasks',
        },
      },
    ],
  },

  LIST_OBJECTS: {
    description: 'List objects in a space or collection',
    parameters: {
      space_id: 'ID of the space',
      type_filter: 'Filter by object type (optional)',
    },
    examples: [
      {
        user_input: 'Show me all pages in my workspace',
        ai_output: {
          action: 'LIST_OBJECTS',
          parameters: {
            type_filter: 'page',
          },
          description: 'List all pages in the space',
        },
      },
    ],
  },

  ADD_RELATION: {
    description: 'Add a relationship between objects',
    parameters: {
      source_object_id: 'ID of the source object',
      target_object_id: 'ID of the target object',
      relation_type: 'Type of relationship',
    },
    examples: [
      {
        user_input: 'Link this article to the "AI Research" collection',
        ai_output: {
          action: 'ADD_RELATION',
          parameters: {
            relation_type: 'belongs_to',
          },
          description: 'Create a relationship to the collection',
        },
      },
    ],
  },

  GET_OBJECT: {
    description: 'Retrieve details of a specific object',
    parameters: {
      space_id: 'ID of the space',
      object_id: 'ID of the object',
    },
    examples: [
      {
        user_input: 'Show me the details of the "Product Roadmap" page',
        ai_output: {
          action: 'GET_OBJECT',
          parameters: {
            name: 'Product Roadmap',
          },
          description: 'Retrieve the Product Roadmap page details',
        },
      },
    ],
  },
};

/**
 * Few-shot learning examples for complex scenarios
 */
export const COMPLEX_EXAMPLES = [
  {
    scenario: 'Creating multiple related objects',
    user_input: 'Create a new project called "Website Redesign" and add two tasks: "Design mockups" and "Review designs"',
    expected_outputs: [
      {
        action: 'CREATE_OBJECT',
        parameters: {
          name: 'Website Redesign',
          type_key: 'project',
        },
        description: 'Create the main project',
      },
      {
        action: 'CREATE_OBJECT',
        parameters: {
          name: 'Design mockups',
          type_key: 'task',
          properties: {
            project: 'Website Redesign',
          },
        },
        description: 'Create first task under the project',
      },
      {
        action: 'CREATE_OBJECT',
        parameters: {
          name: 'Review designs',
          type_key: 'task',
          properties: {
            project: 'Website Redesign',
          },
        },
        description: 'Create second task under the project',
      },
    ],
  },
  {
    scenario: 'Smart search with filtering',
    user_input: 'Show me all uncompleted tasks assigned to me from the Engineering team',
    expected_output: {
      action: 'SEARCH_OBJECTS',
      parameters: {
        query: 'uncompleted tasks assigned:me team:Engineering',
      },
      description: 'Search for uncompleted tasks with specific filters',
    },
  },
  {
    scenario: 'Updating with conditional logic',
    user_input: 'If the task "Q1 Planning" is not completed, mark it as in progress',
    expected_output: {
      action: 'UPDATE_OBJECT',
      parameters: {
        name: 'Q1 Planning',
        properties: {
          status: 'in_progress',
        },
      },
      description: 'Update task status to in progress',
    },
  },
];

/**
 * Main prompt for MCP translation
 * This is the primary prompt used for translating user commands to MCP operations
 */
export const MCP_TRANSLATION_PROMPT = `${SYSTEM_PROMPT}

## Available Operations

${Object.entries(OPERATION_TEMPLATES)
  .map(
    ([key, template]) => `
### ${key}
**Description**: ${template.description}

**Required Parameters**:
${Object.entries(template.parameters)
  .map(([param, desc]) => `- \`${param}\`: ${desc}`)
  .join('\n')}

**Example**:
${template.examples[0]
  ? `User: "${template.examples[0].user_input}"
Response: ${JSON.stringify(template.examples[0].ai_output, null, 2)}`
  : 'No examples available'}
`
  )
  .join('\n')}

## Response Format

You MUST respond with a valid JSON object in this exact format:

\`\`\`json
{
  "action": "OPERATION_NAME",
  "parameters": {
    "param1": "value1",
    "param2": "value2"
  },
  "description": "Brief description of what this operation does"
}
\`\`\`

## Important Guidelines

1. **Accuracy**: Always ensure the action and parameters are accurate to the user's intent
2. **Completeness**: Include all necessary parameters for the operation
3. **Clarity**: Provide a clear description of the operation
4. **Error Handling**: If the user's request is unclear, ask for clarification rather than guessing
5. **Context**: Use previously established context (space IDs, object names) when available

## User Input

{USER_COMMAND}

## Response

Respond with ONLY a valid JSON object. No additional text or explanations.`;

/**
 * Validation rules for MCP commands
 */
export const COMMAND_VALIDATION_RULES = {
  CREATE_OBJECT: {
    required: ['name', 'type_key'],
    optional: ['body', 'icon', 'properties', 'template_id'],
    maxLength: {
      name: 256,
      body: 10000,
    },
  },
  UPDATE_OBJECT: {
    required: ['object_id'],
    optional: ['name', 'body', 'properties'],
    maxLength: {
      name: 256,
      body: 10000,
    },
  },
  DELETE_OBJECT: {
    required: ['object_id'],
    optional: [],
  },
  SEARCH_OBJECTS: {
    required: ['query'],
    optional: ['space_id'],
    maxLength: {
      query: 1000,
    },
  },
  LIST_OBJECTS: {
    required: [],
    optional: ['space_id', 'type_filter'],
  },
  ADD_RELATION: {
    required: ['source_object_id', 'target_object_id', 'relation_type'],
    optional: [],
  },
  GET_OBJECT: {
    required: ['object_id'],
    optional: ['space_id'],
  },
};

/**
 * Common object types in Anytype
 */
export const OBJECT_TYPES = {
  page: 'A standard page for organizing content',
  note: 'A quick note or memo',
  task: 'An action item with status tracking',
  bookmark: 'A saved link or reference',
  file: 'An attached file',
  project: 'A larger initiative or grouping',
  document: 'A full document with structure',
  database: 'A structured collection of objects',
};

/**
 * Common property types
 */
export const PROPERTY_TYPES = {
  text: 'Simple text field',
  number: 'Numeric value',
  date: 'Date and time',
  checkbox: 'Boolean flag',
  tag: 'Category label',
  status: 'State or progress indicator',
  relation: 'Link to another object',
  email: 'Email address',
  url: 'Web link',
  rating: 'Numeric rating',
};

/**
 * Helper function to get a prompt for a specific operation type
 */
export function getOperationPrompt(operationType: string): string {
  const template = OPERATION_TEMPLATES[operationType as keyof typeof OPERATION_TEMPLATES];
  if (!template) {
    return '';
  }

  return `
### ${operationType}
**Description**: ${template.description}

**Parameters**:
${Object.entries(template.parameters)
  .map(([param, desc]) => `- \`${param}\`: ${desc}`)
  .join('\n')}

**Examples**:
${template.examples
  .map(
    (ex) => `
User: "${ex.user_input}"
Assistant: ${JSON.stringify(ex.ai_output, null, 2)}
`
  )
  .join('\n')}
`;
}

/**
 * Helper function to build a custom prompt for specific operations
 */
export function buildCustomPrompt(
  operations: string[],
  userCommand: string,
  context?: {
    currentSpace?: string;
    recentObjects?: string[];
  }
): string {
  const operationDocs = operations
    .map((op) => getOperationPrompt(op))
    .join('\n');

  let contextStr = '';
  if (context) {
    contextStr = `
## Current Context
${context.currentSpace ? `- Current Space: ${context.currentSpace}` : ''}
${context.recentObjects ? `- Recent Objects: ${context.recentObjects.join(', ')}` : ''}
`;
  }

  return `${SYSTEM_PROMPT}

## Available Operations

${operationDocs}

${contextStr}

## User Command
${userCommand}

## Response
Respond with ONLY a valid JSON object in this format:
{
  "action": "OPERATION_NAME",
  "parameters": { ... },
  "description": "..."
}`;
}

export default {
  SYSTEM_PROMPT,
  OPERATION_TEMPLATES,
  COMPLEX_EXAMPLES,
  MCP_TRANSLATION_PROMPT,
  COMMAND_VALIDATION_RULES,
  OBJECT_TYPES,
  PROPERTY_TYPES,
  getOperationPrompt,
  buildCustomPrompt,
};
