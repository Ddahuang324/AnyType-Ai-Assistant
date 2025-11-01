/**
 * MCP Chat Handler
 * 
 * A specialized handler for processing user commands through MCP translation
 * and executing the resulting Anytype operations.
 */

import type { Message, McpCommand, TranslationResult, AnyObject } from '../types';
import * as mcpTranslationService from './mcpTranslationService';
import * as anytypeService from './anytypeService';
import type { AiProvider } from './aiService';

export interface McpChatMessage extends Message {
  /** The MCP command that was translated (if applicable) */
  mcpCommand?: McpCommand;
  /** Whether this is an MCP execution result */
  isMcpResult?: boolean;
  /** Execution status (pending, success, failed) */
  executionStatus?: 'pending' | 'success' | 'failed';
  /** Any execution error (if failed) */
  executionError?: string;
}

export interface McpChatResponse {
  message: McpChatMessage;
  executionResult?: any;
}

/**
 * Processes a user message through MCP translation and execution
 * 
 * @param userMessage - The user's natural language command
 * @param aiProvider - The AI provider to use for translation
 * @param aiApiKey - The API key for the AI provider
 * @param aiModel - The model to use
 * @param anytypeEndpoint - The Anytype API endpoint
 * @param anytypeApiKey - Optional Anytype API key
 * @param currentSpaceId - The current Anytype space ID
 * @returns A promise that resolves to the response with message and optional execution result
 */
export async function processMcpCommand(
  userMessage: string,
  aiProvider: AiProvider,
  aiApiKey: string,
  aiModel: string,
  anytypeEndpoint: string,
  anytypeApiKey: string | undefined,
  currentSpaceId: string | undefined
): Promise<McpChatResponse> {
  try {
    // Step 1: Detect if this looks like a command for MCP
    if (!shouldProcessAsMcpCommand(userMessage)) {
      // This is a regular conversation, not a command
      return {
        message: {
          id: Date.now().toString(),
          role: 'user',
          text: userMessage,
        },
      };
    }

    // Step 2: Translate to MCP command
    const translationResult = await mcpTranslationService.translateWithRetry(
      userMessage,
      aiProvider,
      aiApiKey,
      aiModel
    );

    if (!translationResult.success) {
      // Translation failed
      return {
        message: {
          id: Date.now().toString(),
          role: 'model',
          text: `❌ Command translation failed: ${translationResult.error}`,
          isMcpResult: true,
          executionStatus: 'failed',
          executionError: translationResult.error,
        },
      };
    }

    const command = translationResult.command!;

    // Step 3: Display the translated command
    const translatedCommandMessage: McpChatMessage = {
      id: Date.now().toString(),
      role: 'model',
      text: `🔍 I understand you want to:\n\n${mcpTranslationService.formatMcpCommand(command)}`,
      mcpCommand: command,
      isMcpResult: true,
      executionStatus: 'pending',
    };

    // Step 4: Execute the command
    const executionResult = await executeMcpCommand(
      command,
      anytypeEndpoint,
      anytypeApiKey,
      currentSpaceId
    );

    if (!executionResult.success) {
      // Execution failed
      translatedCommandMessage.executionStatus = 'failed';
      translatedCommandMessage.executionError = executionResult.error;
      translatedCommandMessage.text += `\n\n❌ Execution failed: ${executionResult.error}`;

      return {
        message: translatedCommandMessage,
        executionResult: null,
      };
    }

    // Step 5: Success
    translatedCommandMessage.executionStatus = 'success';
    translatedCommandMessage.text += `\n\n✅ Operation completed successfully!${
      executionResult.data
        ? `\n\nResult:\n${formatExecutionResult(executionResult.data, command.action)}`
        : ''
    }`;

    return {
      message: translatedCommandMessage,
      executionResult: executionResult.data,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      message: {
        id: Date.now().toString(),
        role: 'model',
        text: `❌ An unexpected error occurred: ${errorMessage}`,
        isMcpResult: true,
        executionStatus: 'failed',
        executionError: errorMessage,
      },
    };
  }
}

/**
 * Determines if a message should be processed as an MCP command
 * Uses heuristics to detect command-like messages
 * 
 * @param message - The user message
 * @returns true if the message should be processed as an MCP command
 */
export function shouldProcessAsMcpCommand(message: string): boolean {
  const lowerMessage = message.toLowerCase().trim();

  // Keywords that indicate a command
  const commandKeywords = [
    'create',
    'add',
    'new',
    'make',
    'update',
    'modify',
    'change',
    'delete',
    'remove',
    'search',
    'find',
    'show',
    'list',
    'get',
    'link',
    'organize',
  ];

  // Check if message starts with a command keyword
  for (const keyword of commandKeywords) {
    if (lowerMessage.startsWith(keyword)) {
      return true;
    }
  }

  // Check for phrases that suggest a command
  if (
    lowerMessage.includes('create a') ||
    lowerMessage.includes('add a') ||
    lowerMessage.includes('make a') ||
    lowerMessage.includes('new ') ||
    lowerMessage.includes('search for') ||
    lowerMessage.includes('find ') ||
    lowerMessage.includes('list all') ||
    lowerMessage.includes('show all')
  ) {
    return true;
  }

  return false;
}

/**
 * Executes an MCP command against the Anytype API
 * 
 * @param command - The MCP command to execute
 * @param anytypeEndpoint - The Anytype API endpoint
 * @param anytypeApiKey - Optional Anytype API key
 * @param currentSpaceId - The current space ID
 * @returns Execution result
 */
async function executeMcpCommand(
  command: McpCommand,
  anytypeEndpoint: string,
  anytypeApiKey: string | undefined,
  currentSpaceId: string | undefined
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    // Ensure endpoint is configured
    if (!anytypeEndpoint) {
      return {
        success: false,
        error: 'Anytype API endpoint is not configured',
      };
    }

    // Validate API connection
    const isValid = await anytypeService.validateAnytypeApi(anytypeEndpoint, anytypeApiKey);
    if (!isValid) {
      return {
        success: false,
        error: 'Cannot connect to Anytype API. Please check your configuration.',
      };
    }

    // Execute based on action type
    switch (command.action) {
      case 'CREATE_OBJECT':
        return await executCreateObject(command, anytypeEndpoint, anytypeApiKey, currentSpaceId);

      case 'UPDATE_OBJECT':
        return await executeUpdateObject(command, anytypeEndpoint, anytypeApiKey, currentSpaceId);

      case 'DELETE_OBJECT':
        return await executeDeleteObject(command, anytypeEndpoint, anytypeApiKey, currentSpaceId);

      case 'SEARCH_OBJECTS':
        return await executeSearchObjects(command, anytypeEndpoint, anytypeApiKey, currentSpaceId);

      case 'LIST_OBJECTS':
        return await executeListObjects(command, anytypeEndpoint, anytypeApiKey, currentSpaceId);

      case 'GET_OBJECT':
        return await executeGetObject(command, anytypeEndpoint, anytypeApiKey, currentSpaceId);

      case 'ADD_RELATION':
        return {
          success: false,
          error: 'ADD_RELATION operation is not yet implemented',
        };

      default:
        return {
          success: false,
          error: `Unknown operation: ${command.action}`,
        };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Execute CREATE_OBJECT command
 */
async function executCreateObject(
  command: McpCommand,
  endpoint: string,
  apiKey: string | undefined,
  spaceId: string | undefined
): Promise<{ success: boolean; data?: any; error?: string }> {
  const { name, type_key, body, properties } = command.parameters;

  if (!name || !type_key) {
    return {
      success: false,
      error: 'Object name and type are required',
    };
  }

  if (!spaceId) {
    return {
      success: false,
      error: 'No space selected. Please select a space first.',
    };
  }

  const newObject = await anytypeService.createObject(
    endpoint,
    spaceId,
    {
      name,
      type_key,
      body,
      properties,
    },
    apiKey
  );

  if (!newObject) {
    return {
      success: false,
      error: 'Failed to create object',
    };
  }

  return {
    success: true,
    data: newObject,
  };
}

/**
 * Execute UPDATE_OBJECT command
 */
async function executeUpdateObject(
  command: McpCommand,
  endpoint: string,
  apiKey: string | undefined,
  spaceId: string | undefined
): Promise<{ success: boolean; data?: any; error?: string }> {
  const { object_id, name, body, properties } = command.parameters;

  if (!object_id) {
    return {
      success: false,
      error: 'Object ID is required',
    };
  }

  if (!spaceId) {
    return {
      success: false,
      error: 'No space selected',
    };
  }

  const updated = await anytypeService.updateObject(
    endpoint,
    spaceId,
    object_id,
    {
      name,
      body,
      properties,
    },
    apiKey
  );

  if (!updated) {
    return {
      success: false,
      error: 'Failed to update object',
    };
  }

  return {
    success: true,
    data: updated,
  };
}

/**
 * Execute DELETE_OBJECT command
 */
async function executeDeleteObject(
  command: McpCommand,
  endpoint: string,
  apiKey: string | undefined,
  spaceId: string | undefined
): Promise<{ success: boolean; data?: any; error?: string }> {
  const { object_id } = command.parameters;

  if (!object_id) {
    return {
      success: false,
      error: 'Object ID is required',
    };
  }

  if (!spaceId) {
    return {
      success: false,
      error: 'No space selected',
    };
  }

  const success = await anytypeService.deleteObject(endpoint, spaceId, object_id, apiKey);

  if (!success) {
    return {
      success: false,
      error: 'Failed to delete object',
    };
  }

  return {
    success: true,
    data: { message: 'Object deleted successfully' },
  };
}

/**
 * Execute SEARCH_OBJECTS command
 */
async function executeSearchObjects(
  command: McpCommand,
  endpoint: string,
  apiKey: string | undefined,
  spaceId: string | undefined
): Promise<{ success: boolean; data?: any; error?: string }> {
  const { query } = command.parameters;

  if (!query) {
    return {
      success: false,
      error: 'Search query is required',
    };
  }

  if (!spaceId) {
    return {
      success: false,
      error: 'No space selected',
    };
  }

  const results = await anytypeService.searchObjects(endpoint, spaceId, query, apiKey);

  return {
    success: true,
    data: {
      query,
      resultCount: results.length,
      results,
    },
  };
}

/**
 * Execute LIST_OBJECTS command
 */
async function executeListObjects(
  command: McpCommand,
  endpoint: string,
  apiKey: string | undefined,
  spaceId: string | undefined
): Promise<{ success: boolean; data?: any; error?: string }> {
  if (!spaceId) {
    return {
      success: false,
      error: 'No space selected',
    };
  }

  const objects = await anytypeService.fetchObjects(endpoint, spaceId, apiKey);

  return {
    success: true,
    data: {
      objectCount: objects.length,
      objects,
    },
  };
}

/**
 * Execute GET_OBJECT command
 */
async function executeGetObject(
  command: McpCommand,
  endpoint: string,
  apiKey: string | undefined,
  spaceId: string | undefined
): Promise<{ success: boolean; data?: any; error?: string }> {
  const { object_id } = command.parameters;

  if (!object_id) {
    return {
      success: false,
      error: 'Object ID is required',
    };
  }

  if (!spaceId) {
    return {
      success: false,
      error: 'No space selected',
    };
  }

  const object = await anytypeService.getObject(endpoint, spaceId, object_id, apiKey);

  if (!object) {
    return {
      success: false,
      error: 'Object not found',
    };
  }

  return {
    success: true,
    data: object,
  };
}

/**
 * Formats execution results for display
 */
function formatExecutionResult(data: any, action: string): string {
  switch (action) {
    case 'CREATE_OBJECT':
    case 'UPDATE_OBJECT':
    case 'GET_OBJECT':
      return `📌 ${data.name || 'Object'}\nID: ${data.id}`;

    case 'SEARCH_OBJECTS':
    case 'LIST_OBJECTS':
      return `Found ${data.resultCount || data.objectCount || 0} items`;

    case 'DELETE_OBJECT':
      return 'Object removed from your workspace';

    default:
      return JSON.stringify(data, null, 2);
  }
}

export default {
  processMcpCommand,
  shouldProcessAsMcpCommand,
  executeMcpCommand,
};
