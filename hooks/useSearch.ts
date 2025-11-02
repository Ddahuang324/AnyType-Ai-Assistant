import { useState, useEffect, useMemo } from 'react';
import type { AnyObject } from '../types';
import * as anytypeService from '../services/anytypeService';

export function useSearch(spaceId: string, query: string, apiEndpoint: string, apiKey?: string) {
  const [objects, setObjects] = useState<AnyObject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!spaceId || !apiEndpoint) return;

    const searchObjects = async () => {
      if (!query.trim()) {
        setObjects([]);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const searchedObjects = await anytypeService.searchObjects(apiEndpoint, spaceId, query, apiKey);
        setObjects(searchedObjects);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to search objects');
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchObjects, 300); // Debounce search
    return () => clearTimeout(debounceTimer);
  }, [spaceId, query, apiEndpoint, apiKey]);

  const filteredObjects = useMemo(() => {
    return objects.filter(obj => obj); // Filter out empty objects
  }, [objects]);

  return { objects: filteredObjects, isLoading, error };
}