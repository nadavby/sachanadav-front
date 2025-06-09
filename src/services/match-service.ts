/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient, CanceledError } from './api-client';
export { CanceledError };

export interface IMatch {
  _id?: string;
  item1Id: string;
  userId1: string;
  item2Id: string;
  userId2: string;
  matchScore: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const getAllByUserId = (userId?: string) => {
  const abortController = new AbortController();
  
  const request = apiClient.get<IMatch[]>('/match', {
    params: { Id: userId },
    signal: abortController.signal,
  });

  return { request, abort: () => abortController.abort() };
};

const getById = (id: string) => {
  const abortController = new AbortController();
  
  const request = apiClient.get<IMatch>(`/match/${id}`, {
    signal: abortController.signal,
  });

  return { request, abort: () => abortController.abort() };
};

const deleteById = (id: string) => {
  const abortController = new AbortController();
  
  const request = apiClient.delete<{ message: string }>(`/match/${id}`, {
    signal: abortController.signal,
  });

  return { request, abort: () => abortController.abort() };
};

export default {
  getAllByUserId,
  getById,
  deleteById,
};
