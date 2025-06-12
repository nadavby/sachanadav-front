import { useState, useCallback, useEffect, useMemo } from 'react';
import matchService, { IMatch, CanceledError } from '../services/match-service';
import { useAuth } from './useAuth';
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

export const useMatchItems = (itemIds: string[]) => {
  const [matchItems, setMatchItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchItems = async () => {
      if (!itemIds.length) {
        setMatchItems([]);
        setIsLoading(false);
        return;
      }

      try {
        const items = await Promise.all(
          itemIds.map(async (id) => {
            try {
              const { request } = itemService.getItemById(id);
              const response = await request;
              return response.data;
            } catch (error) {
              console.error(`Error fetching item ${id}:`, error);
              return null;
            }
          })
        );

        setMatchItems(items.filter(item => item !== null));
        setError(null);
      } catch (error) {
        console.error('Error fetching match items:', error);
        setError('Failed to fetch match items');
      } finally {
        setIsLoading(false);
      }
    };

    fetchItems();
  }, [itemIds]);

  return { matchItems, isLoading, error };
}; 


