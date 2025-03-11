/** @format */
import { apiClient, CanceledError } from "./api-client";
export { CanceledError };

export type Post = { 
    _id: string,
    title: string,
    content: string,
    owner: string,
    image: string,
    likes:[string],
  }

const getAll = <T>(endpoint: string) => {
  const abortController = new AbortController();
  const request = apiClient.get<T[]>(endpoint, {
    signal: abortController.signal,
  });
  return {
    abort: () => abortController.abort(),
    request,
  };
};

export default { getAll };
