import { useState, useEffect } from 'react';
import itemService from '../services/item-service';

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