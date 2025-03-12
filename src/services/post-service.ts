/** @format */
import { apiClient, CanceledError } from "./api-client";
export { CanceledError };

export type Post = { 
    _id: string,
    title: string,
    content: string,
    owner: string,
    image: string,
    likes:string[],
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

const likePost = async (postId: string) => {
  const token = localStorage.getItem("refreshToken"); // Get token from storage (or context if applicable)
  
  if (!token) {
    console.error("No authentication token found");
    return Promise.reject("Unauthorized: No token found");
  }

  return apiClient.post(
    `/posts/${postId}/like`,
    {}, // Empty request body
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};


export default { getAll, likePost };
