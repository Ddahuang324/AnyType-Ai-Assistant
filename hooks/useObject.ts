import { useState, useEffect } from 'react';
import type { AnyObject } from '../types';
import * as anytypeService from '../services/anytypeService';

export function useObject(spaceId: string, objectId: string, apiEndpoint: string, apiKey?: string) {
  const [object, setObject] = useState<AnyObject | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!spaceId || !objectId || !apiEndpoint) return;

    const fetchObject = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const fetchedObject = await anytypeService.getObject(apiEndpoint, spaceId, objectId, apiKey);
        setObject(fetchedObject);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch object');
      } finally {
        setIsLoading(false);
      }
    };

    fetchObject();
  }, [spaceId, objectId, apiEndpoint, apiKey]);

  const refetch = () => {
    if (spaceId && objectId && apiEndpoint) {
      const fetchObject = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const fetchedObject = await anytypeService.getObject(apiEndpoint, spaceId, objectId, apiKey);
          setObject(fetchedObject);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to fetch object');
        } finally {
          setIsLoading(false);
        }
      };
      fetchObject();
    }
  };

  return { object, isLoading, error, refetch };
}