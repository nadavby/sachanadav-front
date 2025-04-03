/** @format */

import { apiClient, CanceledError } from "./api-client";
import axios from 'axios';

export { CanceledError };

export interface Item {
  _id?: string;
  name: string;
  description: string;
  category: string;
  location: string;
  date: string;
  itemType: 'lost' | 'found';
  imgURL?: string;
  owner: string;
  matchResults?: MatchResult[];
}

export interface MatchResult {
  _id?: string;
  matchedItemId: string;
  similarity: number;
  itemName: string;
  itemDescription: string;
  itemImgURL?: string;
  ownerName: string;
  ownerContact?: string;
}

const getAllLostItems = () => {
  const abortController = new AbortController();
  const request = apiClient.get<Item[]>("/items/lost", {
    signal: abortController.signal,
  });
  return { request, abort: () => abortController.abort() };
};

const getAllFoundItems = () => {
  const abortController = new AbortController();
  const request = apiClient.get<Item[]>("/items/found", {
    signal: abortController.signal,
  });
  return { request, abort: () => abortController.abort() };
};

const getItemById = (id: string) => {
  const abortController = new AbortController();
  const request = apiClient.get<Item>(`/items/${id}`, {
    signal: abortController.signal,
  });
  return { request, abort: () => abortController.abort() };
};

const getItemsByUser = (userId: string) => {
  const abortController = new AbortController();
  const request = apiClient.get<Item[]>(`/items/user/${userId}`, {
    signal: abortController.signal,
  });
  return { request, abort: () => abortController.abort() };
};

const addItem = async (item: Omit<Item, '_id'>, image?: File) => {
  try {
    // Verify item data structure
    if (!item.name || !item.description || !item.category || !item.location || !item.date || !item.itemType || !item.owner) {
      console.error("Missing required item fields:", item);
      throw new Error("Missing required item fields");
    }
    
    const itemData = {
      name: item.name,
      description: item.description,
      category: item.category,
      location: item.location,
      date: item.date,
      itemType: item.itemType,
      owner: item.owner
    };
    
    console.log("Adding item data:", itemData);
    
    // If there's no image, use a simpler JSON approach
    if (!image) {
      console.log("No image provided - using direct JSON POST");
      return apiClient.post('/items', itemData, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
    }
    
    // If there is an image, use FormData
    console.log("Image provided - using FormData");
    const formData = new FormData();
    
    // Try multiple approaches to sending the item data with FormData
    
    // Approach 1: Add each field individually
    Object.entries(itemData).forEach(([key, value]) => {
      formData.append(key, value as string);
    });
    
    // Approach 2: Also add the item as JSON string (some backends might expect this format)
    formData.append('itemData', JSON.stringify(itemData));
    
    // Add the image
    console.log("Adding image to FormData:", image.name, image.type, image.size, "bytes");
    formData.append('image', image, image.name);
    
    console.log("Sending item data with apiClient (using interceptors)");
    
    // Use the apiClient with interceptors
    return apiClient.post('/items', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });
  } catch (error: any) {
    console.error("Error in addItem:", error.message);
    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
      console.error("Response headers:", error.response.headers);
    }
    throw error;
  }
};

const updateItem = async (id: string, item: Partial<Item>, image?: File) => {
  try {
    console.log("Updating item with ID:", id);
    console.log("Update data:", item);
    
    // If there's no image, use a simpler JSON approach
    if (!image) {
      console.log("No image provided for update - using direct JSON PUT");
      return apiClient.put<Item>(`/items/${id}`, item, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    
    // If there is an image, use FormData
    console.log("Image provided for update - using FormData");
    const formData = new FormData();
    
    // Add all available item properties to the formData
    if (item.name) formData.append('name', item.name);
    if (item.description) formData.append('description', item.description);
    if (item.category) formData.append('category', item.category);
    if (item.location) formData.append('location', item.location);
    if (item.date) formData.append('date', item.date);
    if (item.itemType) formData.append('itemType', item.itemType);
    
    // Also add the item data as JSON (some backends might expect this format)
    formData.append('itemData', JSON.stringify(item));
    
    // Add the image 
    console.log("Adding image to FormData:", image.name, image.type, image.size, "bytes");
    formData.append('image', image, image.name);

    console.log("Updating item with apiClient (using interceptors)");
    
    // Use the apiClient with interceptors
    return apiClient.put<Item>(`/items/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  } catch (error: any) {
    console.error("Error in updateItem:", error.message);
    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
      console.error("Response headers:", error.response.headers);
    }
    throw error;
  }
};

const deleteItem = (id: string) => {
  const abortController = new AbortController();
  const request = apiClient.delete(`/items/${id}`, {
    signal: abortController.signal,
  });
  return { request, abort: () => abortController.abort() };
};

const getMatchResults = (itemId: string) => {
  const abortController = new AbortController();
  const request = apiClient.get<MatchResult[]>(`/items/${itemId}/matches`, {
    signal: abortController.signal,
  });
  return { request, abort: () => abortController.abort() };
};

export default {
  getAllLostItems,
  getAllFoundItems,
  getItemById,
  getItemsByUser,
  addItem,
  updateItem,
  deleteItem,
  getMatchResults,
}; 