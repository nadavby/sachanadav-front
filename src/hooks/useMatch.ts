import { useState, useCallback, useEffect } from 'react';
import matchService, { IMatch, CanceledError } from '../services/match-service';
import { useAuth } from './useAuth';

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


