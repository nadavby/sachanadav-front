/** @format */

import { useEffect, useState } from 'react';
import itemService, { CanceledError, Item } from '../services/item-service';

export const useLostItems = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
 
  useEffect(() => {
    console.log("Fetching lost items...");
    setIsLoading(true);
    const { request, abort } = itemService.getAllLostItems();
    request.then((res) => {
      setIsLoading(false);
      setItems(res.data);
    }).catch((error) => {
      if (!(error instanceof CanceledError)) {
        setError(error.message);
        setIsLoading(false);
      }
    });
   
    return abort;
  }, []);

  return { items, error, isLoading, setItems, setError, setIsLoading };
};

export const useFoundItems = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
 
  useEffect(() => {
    console.log("Fetching found items...");
    setIsLoading(true);
    const { request, abort } = itemService.getAllFoundItems();
    request.then((res) => {
      setIsLoading(false);
      setItems(res.data);
    }).catch((error) => {
      if (!(error instanceof CanceledError)) {
        setError(error.message);
        setIsLoading(false);
      }
    });
   
    return abort;
  }, []);

  return { items, error, isLoading, setItems, setError, setIsLoading };
};

export const useUserItems = (userId: string) => {
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
 
  useEffect(() => {
    if (!userId) return;
    
    console.log("Fetching user items...");
    setIsLoading(true);
    const { request, abort } = itemService.getItemsByUser(userId);
    request.then((res) => {
      setIsLoading(false);
      setItems(res.data);
    }).catch((error) => {
      if (!(error instanceof CanceledError)) {
        setError(error.message);
        setIsLoading(false);
      }
    });
   
    return abort;
  }, [userId]);

  return { items, error, isLoading, setItems, setError, setIsLoading };
};

export const useItemMatches = (itemId: string) => {
  const [matches, setMatches] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
 
  useEffect(() => {
    if (!itemId) return;
    
    console.log("Fetching item matches...");
    setIsLoading(true);
    const { request, abort } = itemService.getMatchResults(itemId);
    request.then((res) => {
      setIsLoading(false);
      setMatches(res.data);
    }).catch((error) => {
      if (!(error instanceof CanceledError)) {
        setError(error.message);
        setIsLoading(false);
      }
    });
   
    return abort;
  }, [itemId]);

  return { matches, error, isLoading, setMatches, setError, setIsLoading };
}; 