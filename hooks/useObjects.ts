import { useState, useEffect } from 'react';
import type { AnyObject } from '../types';
import * as anytypeService from '../services/anytypeService';

export function useObjects(spaceId: string, apiEndpoint: string, apiKey?: string) {
  const [objects, setObjects] = useState<AnyObject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!spaceId || !apiEndpoint) return;

    const fetchObjects = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const fetchedObjects = await anytypeService.fetchObjects(apiEndpoint, spaceId, apiKey);
        setObjects(fetchedObjects);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch objects');
      } finally {
        setIsLoading(false);
      }
    };

    fetchObjects();
  }, [spaceId, apiEndpoint, apiKey]);

  const refetch = () => {
    if (spaceId && apiEndpoint) {
      const fetchObjects = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const fetchedObjects = await anytypeService.fetchObjects(apiEndpoint, spaceId, apiKey);
          setObjects(fetchedObjects);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to fetch objects');
        } finally {
          setIsLoading(false);
        }
      };
      fetchObjects();
    }
  };

  return { objects, isLoading, error, refetch };
}