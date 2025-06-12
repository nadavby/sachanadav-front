import { useState, useCallback, useEffect, useMemo } from 'react';
import matchService, { IMatch, CanceledError } from '../services/match-service';
import { useAuth } from './useAuth';
import { Item } from '../services/item-service';
import  itemService  from '../services/item-service';

export const useMatch = () => {
  const [matches, setMatches] = useState<IMatch[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { currentUser } = useAuth();

  const fetchMatches = useCallback(async () => {
    if (!currentUser?._id) return;
    
    setIsLoading(true);
    setError(null);

    const { request, abort } = matchService.getAllByUserId(currentUser._id);
    
    try {
      const response = await request;
      setMatches(response.data);
    } catch (err) {
      if (err instanceof CanceledError) return;
      setError(err.message);
      console.error('[MATCHES] Error fetching matches:', err);
    } finally {
      setIsLoading(false);
    }

    return () => abort();
  }, [currentUser?._id]);

  const getMatch = useCallback(async (matchId: string) => {
    setIsLoading(true);
    setError(null);

    const { request, abort } = matchService.getById(matchId);
    
    try {
      const response = await request;
      return response.data;
    } catch (err) {
      if (err instanceof CanceledError) return null;
      setError(err.message);
      console.error('[MATCHES] Error fetching match:', err);
      return null;
    } finally {
      setIsLoading(false);
    }

    return () => abort();
  }, []);

  const deleteMatch = useCallback(async (matchId: string) => {
    setError(null);

    try {
      const { request } = matchService.deleteById(matchId);
      await request;
      setMatches(prev => prev.filter(match => match._id !== matchId));
      return true;
    } catch (err) {
      if (err instanceof CanceledError) return false;
      setError(err.message);
      console.error('[MATCHES] Error deleting match:', err);
      return false;
    }
  }, []);

  // Initial fetch of matches
  useEffect(() => {
    if (currentUser?._id) {
      fetchMatches();
    }
  }, [currentUser?._id, fetchMatches]);

  // Log when matches change
  useEffect(() => {
    console.log('[MATCHES] Current matches:', matches);
  }, [matches]);

  return {
    matches,
    error,
    isLoading,
    fetchMatches,
    getMatch,
    deleteMatch
  };
};

export const useMatchItems = (matchIds: string[]) => {
  const [matchItems, setMatchItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize matchIds array using a stable stringification
  const memoizedMatchIds = useMemo(() => {
    if (!matchIds || matchIds.length === 0) return [];
    return [...new Set(matchIds)].sort();
  }, [matchIds]);

  useEffect(() => {
    const fetchMatchItems = async () => {
      if (!memoizedMatchIds || memoizedMatchIds.length === 0) {
        setMatchItems([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      
      try {
        const itemsPromises = memoizedMatchIds.map(async (matchId) => {
          const { request } = itemService.getItemById(matchId);
          const response = await request;
          return response.data;
        });

        const items = await Promise.all(itemsPromises);
        setMatchItems(items.filter((item): item is Item => item !== null));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMatchItems();
  }, [memoizedMatchIds]);

  return {
    matchItems,
    isLoading,
    error
  };
}; 


