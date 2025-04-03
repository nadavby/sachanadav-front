/** @format */

import { apiClient, CanceledError } from "./api-client";

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
  const formData = new FormData();
  
  formData.append('item', JSON.stringify(item));
  
  if (image) {
    formData.append('image', image);
  }
  
  return apiClient.post<Item>('/items', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

const updateItem = (id: string, item: Partial<Item>, image?: File) => {
  const formData = new FormData();
  
  formData.append('item', JSON.stringify(item));
  
  if (image) {
    formData.append('image', image);
  }

  return apiClient.put<Item>(`/items/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
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