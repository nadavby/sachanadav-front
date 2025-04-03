/** @format */

import { useEffect, useState } from 'react';
import itemService, { CanceledError, Item } from '../services/item-service';

export const useLostItems = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
 
  useEffect(() => {
    console.log("Fetching lost items...");
    
    const { request, abort } = itemService.getAllLostItems();
    request
      .then((res) => {
        console.log("Lost items fetched:", res.data.length, "items");
        // Debug item structure including all fields
        if (res.data.length > 0) {
          console.log("Sample complete item data structure:");
          const sampleItem = res.data[0];
          console.log("Item fields:", Object.keys(sampleItem));
          console.log("Sample item complete data:", sampleItem);
          
          // Check specific fields
          res.data.slice(0, 3).forEach((item: any, index: number) => {
            console.log(`Item ${index} - Name: ${item.name || 'MISSING NAME'}, Description: ${item.description || 'MISSING DESC'}, Category: ${item.category || 'MISSING CATEGORY'}, Location: ${item.location || 'MISSING LOCATION'}`);
          });
        }
        setItems(res.data);
      })
      .catch((err) => {
        if (err instanceof CanceledError) return;
        setError(err.message);
        console.error("Error fetching lost items:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });

    return () => abort();
  }, []);

  return { items, error, isLoading, setItems, setError, setIsLoading };
};

export const useFoundItems = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    console.log("Fetching found items...");
    setIsLoading(true);
    
    const { request, abort } = itemService.getAllFoundItems();
    request
      .then((res) => {
        console.log("Found items fetched:", res.data.length, "items");
        // Debug item structure including all fields
        if (res.data.length > 0) {
          console.log("Sample complete found item data structure:");
          const sampleItem = res.data[0];
          console.log("Found item fields:", Object.keys(sampleItem));
          console.log("Sample found item complete data:", sampleItem);
          
          // Check specific fields
          res.data.slice(0, 3).forEach((item: any, index: number) => {
            console.log(`Found Item ${index} - Name: ${item.name || 'MISSING NAME'}, Description: ${item.description || 'MISSING DESC'}, Category: ${item.category || 'MISSING CATEGORY'}, Location: ${item.location || 'MISSING LOCATION'}`);
          });
        }
        setItems(res.data);
      })
      .catch((err) => {
        if (err instanceof CanceledError) return;
        setError(err.message);
        console.error("Error fetching found items:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });

    return () => abort();
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