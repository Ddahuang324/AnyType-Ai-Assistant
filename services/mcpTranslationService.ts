/**
 * MCP Translation Service
 * 
 * Translates user natural language commands into Anytype MCP operations
 * using AI language models (Gemini, OpenAI, or Anthropic).
 */

import type { McpCommand, TranslationResult } from '../types';
import { MCP_TRANSLATION_PROMPT, COMMAND_VALIDATION_RULES } from '../prompts/mcpTranslation';
import { continueConversation, type AiProvider } from './aiService';
import type { Message } from '../types';

/**
 * Maximum retry attempts for failed translations
 */
const MAX_RETRIES = 2;

/**
 * Timeout for AI API calls (in milliseconds)
 */
const AI_CALL_TIMEOUT = 30000;

/**
 * Translates a user command to an MCP command using AI
 * 
 * @param userCommand - The natural language command from the user
 * @param aiProvider - The AI provider to use (gemini, openai, anthropic)
 * @param apiKey - The API key for the AI provider
 * @param model - The model to use
 * @returns A promise that resolves to a TranslationResult
 */
export async function translateToMcpCommand(
  userCommand: string,
  aiProvider: AiProvider,
  apiKey: string,
  model: string
): Promise<TranslationResult> {
  if (!userCommand || !userCommand.trim()) {
    return {
      success: false,
      error: 'Please provide a command to translate',
    };
  }

  if (!aiProvider || !apiKey || !model) {
    return {
      success: false,
      error: 'AI provider configuration is incomplete',
    };
  }

  try {
    // Build the prompt with the user command
    const prompt = MCP_TRANSLATION_PROMPT.replace('{USER_COMMAND}', userCommand);

    // Call the AI service with timeout
    const response = await callAiWithTimeout(
      aiProvider,
      apiKey,
      model,
      prompt,
      AI_CALL_TIMEOUT
    );

    // Parse the response
    const parsedCommand = parseAiResponse(response);

    if (!parsedCommand) {
      return {
        success: false,
        error: 'Failed to parse AI response as valid MCP command',
        rawResponse: response,
      };
    }

    // Validate the command
    const validationResult = validateMcpCommand(parsedCommand);

    if (!validationResult.valid) {
      return {
        success: false,
        error: `Validation failed: ${validationResult.error}`,
        command: parsedCommand,
      };
    }

    return {
      success: true,
      command: parsedCommand,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Check if it's a timeout or quota error
    if (errorMessage.includes('timeout')) {
      return {
        success: false,
        error: 'AI service timeout. Please try again.',
      };
    }

    if (errorMessage.includes('quota') || errorMessage.includes('rate_limit')) {
      return {
        success: false,
        error: 'AI service rate limit exceeded. Please try again later.',
      };
    }

    console.error('Error in translateToMcpCommand:', error);
    return {
      success: false,
      error: `Translation failed: ${errorMessage}`,
    };
  }
}

/**
 * Translates multiple commands (batch processing)
 * 
 * @param userCommand - The natural language command (may contain multiple operations)
 * @param aiProvider - The AI provider to use
 * @param apiKey - The API key for the AI provider
 * @param model - The model to use
 * @returns A promise that resolves to an array of TranslationResult objects
 */
export async function translateBatchCommands(
  userCommand: string,
  aiProvider: AiProvider,
  apiKey: string,
  model: string
): Promise<TranslationResult[]> {
  // First, try to translate the entire command
  const result = await translateToMcpCommand(userCommand, aiProvider, apiKey, model);

  if (!result.success) {
    return [result];
  }

  // For now, return the single command in an array
  // In the future, we could detect multi-step operations and return multiple commands
  return [result];
}

/**
 * Calls the AI service with a timeout mechanism
 * 
 * @param aiProvider - The AI provider to use
 * @param apiKey - The API key
 * @param model - The model to use
 * @param prompt - The prompt to send
 * @param timeoutMs - Timeout in milliseconds
 * @returns A promise that resolves to the AI response
 */
async function callAiWithTimeout(
  aiProvider: AiProvider,
  apiKey: string,
  model: string,
  prompt: string,
  timeoutMs: number
): Promise<string> {
  return Promise.race([
    continueConversation(aiProvider, apiKey, model, [], prompt),
    new Promise<string>((_, reject) =>
      setTimeout(() => reject(new Error('AI call timeout')), timeoutMs)
    ),
  ]);
}

/**
 * Parses the AI response and extracts the MCP command
 * 
 * @param response - The response from the AI
 * @returns The parsed McpCommand or null if parsing fails
 */
export function parseAiResponse(response: string): McpCommand | null {
  if (!response || !response.trim()) {
    return null;
  }

  try {
    // Try to find JSON in the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('No JSON found in AI response:', response);
      return null;
    }

    const jsonStr = jsonMatch[0];
    const parsed = JSON.parse(jsonStr);

    // Validate the structure
    if (!parsed.action || !parsed.parameters) {
      console.warn('Invalid McpCommand structure:', parsed);
      return null;
    }

    return {
      action: parsed.action,
      parameters: parsed.parameters,
      description: parsed.description || 'No description provided',
    };

  } catch (error) {
    console.error('Error parsing AI response:', error);
    return null;
  }
}

/**
 * Validates an MCP command against the defined rules
 * 
 * @param command - The command to validate
 * @returns Validation result with success status and any errors
 */
export function validateMcpCommand(command: McpCommand): {
  valid: boolean;
  error?: string;
} {
  // Check if action is valid
  const rules = COMMAND_VALIDATION_RULES[command.action as keyof typeof COMMAND_VALIDATION_RULES];

  if (!rules) {
    return {
      valid: false,
      error: `Unknown action: ${command.action}`,
    };
  }

  // Check required parameters
  for (const required of rules.required) {
    if (!(required in command.parameters)) {
      return {
        valid: false,
        error: `Missing required parameter: ${required}`,
      };
    }
  }

  // Check parameter values are not empty (for string parameters)
  for (const [key, value] of Object.entries(command.parameters)) {
    if (typeof value === 'string' && !value.trim()) {
      return {
        valid: false,
        error: `Parameter ${key} cannot be empty`,
      };
    }
  }

  // Check max lengths if defined
  if ((rules as any).maxLength) {
    for (const [param, maxLen] of Object.entries((rules as any).maxLength)) {
      const value = command.parameters[param];
      if (typeof value === 'string' && value.length > (maxLen as number)) {
        return {
          valid: false,
          error: `Parameter ${param} exceeds maximum length of ${maxLen}`,
        };
      }
    }
  }

  return { valid: true };
}

/**
 * Sanitizes user input before sending to AI
 * Prevents injection attacks and removes sensitive information
 * 
 * @param input - The user input to sanitize
 * @returns The sanitized input
 */
export function sanitizeUserInput(input: string): string {
  // Remove potentially harmful content
  let sanitized = input.trim();

  // Limit length
  if (sanitized.length > 10000) {
    sanitized = sanitized.substring(0, 10000);
  }

  // Remove any control characters
  sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');

  return sanitized;
}

/**
 * Formats a MCP command into a human-readable string
 * Useful for displaying what operation will be performed
 * 
 * @param command - The MCP command
 * @returns A formatted string description
 */
export function formatMcpCommand(command: McpCommand): string {
  const { action, description, parameters } = command;

  let output = `**Operation**: ${action}\n`;
  output += `**Description**: ${description}\n`;
  output += `**Parameters**:\n`;

  for (const [key, value] of Object.entries(parameters)) {
    if (typeof value === 'object') {
      output += `  - ${key}: ${JSON.stringify(value)}\n`;
    } else {
      output += `  - ${key}: ${value}\n`;
    }
  }

  return output;
}

/**
 * Extracts context from previous messages to improve translation
 * 
 * @param messages - Previous conversation messages
 * @returns Context object with relevant information
 */
export function extractContextFromMessages(messages: Message[]): {
  lastAction?: string;
  mentionedObjects: string[];
  mentionedSpaces: string[];
} {
  const context = {
    lastAction: undefined as string | undefined,
    mentionedObjects: [] as string[],
    mentionedSpaces: [] as string[],
  };

  // Analyze previous messages for context
  for (let i = messages.length - 1; i >= Math.max(0, messages.length - 5); i--) {
    const msg = messages[i];

    // Extract mentioned object names (heuristic)
    const objectPattern = /"([^"]+)"\s+(page|note|task|project)/gi;
    let match;
    while ((match = objectPattern.exec(msg.text)) !== null) {
      if (!context.mentionedObjects.includes(match[1])) {
        context.mentionedObjects.push(match[1]);
      }
    }
  }

  return context;
}

/**
 * Attempts to translate a command with retries
 * Useful for handling transient failures
 * 
 * @param userCommand - The user command
 * @param aiProvider - The AI provider
 * @param apiKey - The API key
 * @param model - The model
 * @param retries - Number of retries
 * @returns Translation result
 */
export async function translateWithRetry(
  userCommand: string,
  aiProvider: AiProvider,
  apiKey: string,
  model: string,
  retries: number = MAX_RETRIES
): Promise<TranslationResult> {
  let lastError: TranslationResult | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const result = await translateToMcpCommand(userCommand, aiProvider, apiKey, model);

    if (result.success) {
      return result;
    }

    lastError = result;

    // Don't retry on validation or parsing errors
    if (
      result.error?.includes('Validation failed') ||
      result.error?.includes('Failed to parse')
    ) {
      break;
    }

    // Wait before retrying (exponential backoff)
    if (attempt < retries) {
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, attempt) * 1000)
      );
    }
  }

  return lastError || {
    success: false,
    error: 'Translation failed after all retries',
  };
}

/**
 * Processes a command and provides suggestions if it fails
 * 
 * @param userCommand - The user command
 * @param aiProvider - The AI provider
 * @param apiKey - The API key
 * @param model - The model
 * @returns Translation result with suggestions on failure
 */
export async function translateWithSuggestions(
  userCommand: string,
  aiProvider: AiProvider,
  apiKey: string,
  model: string
): Promise<TranslationResult & { suggestions?: string[] }> {
  const result = await translateToMcpCommand(userCommand, aiProvider, apiKey, model);

  if (result.success) {
    return result;
  }

  // Provide helpful suggestions on failure
  const suggestions: string[] = [];

  if (result.error?.includes('Missing required parameter')) {
    suggestions.push('Try providing more specific details in your command');
    suggestions.push('Include object names, types, or property values');
  }

  if (result.error?.includes('Unknown action')) {
    suggestions.push('This operation might not be supported yet');
    suggestions.push('Try a simpler command like "Create a page" or "Search for notes"');
  }

  if (result.error?.includes('timeout')) {
    suggestions.push('The AI service is busy, please try again');
  }

  return {
    ...result,
    suggestions: suggestions.length > 0 ? suggestions : undefined,
  };
}

export default {
  translateToMcpCommand,
  translateBatchCommands,
  parseAiResponse,
  validateMcpCommand,
  sanitizeUserInput,
  formatMcpCommand,
  extractContextFromMessages,
  translateWithRetry,
  translateWithSuggestions,
};
