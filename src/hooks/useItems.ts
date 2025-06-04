/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * eslint-disable @typescript-eslint/no-explicit-any
 *
 * @format
 */

/** @format */

import { useEffect, useState } from "react";
import itemService, { CanceledError, Item } from "../services/item-service";

export const useLostItems = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    console.log("Fetching lost items...");
    setIsLoading(true);
    setError(null);

    const { request, abort } = itemService.getAllLostItems();
    request
      .then((res) => {
        setItems(res.data);
        setIsLoading(false);
      })
      .catch((err) => {
        if (err instanceof CanceledError || err.code === "ERR_CANCELED") {
          console.log("Request was canceled");
          return;
        }
        setError(err.message);
        console.error("Error fetching lost items:", err);
        setIsLoading(false);
      });

    return () => {
      console.log("Cleaning up lost items fetch");
      abort();
    };
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
        if (res.data.length > 0) {
          console.log("Sample complete found item data structure:");
          const sampleItem = res.data[0];
          console.log("Found item fields:", Object.keys(sampleItem));
          console.log("Sample found item complete data:", sampleItem);

          res.data.slice(0, 3).forEach((item: any, index: number) => {
            console.log(
              `Found Item ${index} - Name: ${
                item.name || "MISSING NAME"
              }, Description: ${
                item.description || "MISSING DESC"
              }, Category: ${item.category || "MISSING CATEGORY"}, Location: ${
                item.location || "MISSING LOCATION"
              }`
            );
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
    request
      .then((res) => {
        console.log("Raw user items response:", res.data);
        setItems(res.data);
        setIsLoading(false);
      })
      .catch((error) => {
        setError(error.message);
        setIsLoading(false);
      });

    return abort;
  }, [userId]);

  return { items, error, isLoading, setItems, setError, setIsLoading };
};
