import type { Space, Project, ObjectSet, AnyObject, RelationConfig } from '../types';

/**
 * Validates if the Anytype API endpoint is reachable and returns a valid structure.
 * 
 * @param apiEndpoint - The base URL for the Anytype API (e.g., http://localhost:3456).
 * @returns A promise that resolves to true if the API is valid, false otherwise.
 */
export async function validateAnytypeApi(apiEndpoint: string): Promise<boolean> {
  if (!apiEndpoint) return false;
  try {
    const response = await fetch(apiEndpoint);
    if (!response.ok) return false;
    const data = await response.json();
    // Check for a known structure, e.g., an 'items' array or just an array
    return Array.isArray(data) || (data && Array.isArray(data.items));
  } catch (error) {
    console.error("Anytype API validation failed:", error);
    return false;
  }
}

/**
 * Fetches and transforms all spaces for the user from the Anytype API.
 * 
 * @param apiEndpoint - The base URL for the Anytype API from settings.
 * @returns A promise that resolves to an array of Space objects.
 */
export async function fetchAllSpaces(apiEndpoint: string): Promise<Space[]> {
  if (!apiEndpoint) {
    console.warn("Anytype API endpoint is not configured.");
    return [];
  }

  try {
    const response = await fetch(apiEndpoint);

    if (!response.ok) {
      throw new Error(`Anytype API request failed: ${response.statusText}`);
    }

    const rawData = await response.json();

    if (rawData.error) {
        throw new Error(`API returned an error: ${rawData.error}`);
    }

    // Adapt to handle both { items: [...] } and [...] formats
    const dataToParse = Array.isArray(rawData) ? rawData : rawData.items;

    if (!Array.isArray(dataToParse)) {
        throw new Error("Invalid data structure from API. Expected an array of spaces.");
    }

    const transformedSpaces = dataToParse.map((rawSpace: any): Space => {
      // Basic validation
      if (!rawSpace || typeof rawSpace.id !== 'string' || typeof rawSpace.name !== 'string') return null!;
      
      const sets = (rawSpace.sets || []).map((rawSet: any): ObjectSet => ({
        id: rawSet.id,
        name: rawSet.name,
        description: rawSet.description || '',
        relations: rawSet.relations || [],
        objects: (rawSet.objects || []).map(transformAnyObject).filter(Boolean),
      }));

      const projects = (rawSpace.projects || []).map((rawProject: any): Project => ({
        id: rawProject.id,
        title: rawProject.title,
        description: rawProject.description || '',
        imageUrl: rawProject.imageUrl,
        linkedSetId: rawProject.linkedSetId,
      }));

      return {
        id: rawSpace.id,
        name: rawSpace.name,
        projects: projects,
        sets: sets,
      };
    }).filter(Boolean); // Filter out any null spaces

    return transformedSpaces;

  } catch (error) {
    console.error("Failed to fetch or parse Anytype data:", error);
    return [];
  }
}

/**
 * A recursive helper function to transform nested raw objects into the application's AnyObject type.
 */
function transformAnyObject(rawObject: any): AnyObject | null {
    if (!rawObject || typeof rawObject.id !== 'string' || typeof rawObject.name !== 'string') {
        console.warn('Skipping invalid object in data:', rawObject);
        return null;
    }

    return {
        id: rawObject.id,
        name: rawObject.name,
        relations: rawObject.relations || {},
        children: (rawObject.children || []).map(transformAnyObject).filter(Boolean),
    };
}
