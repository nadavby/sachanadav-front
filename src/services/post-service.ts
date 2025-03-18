/** @format */
import { apiClient, CanceledError } from "./api-client";
export { CanceledError };

export type Post = { 
    _id: string,
    title: string,
    content: string,
    owner: string,
    image: string,
    likes: string[],
    comments: string[],
    createdAt: Date,
    updatedAt: Date,
};

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

const getPostById = async (postId: string) => {
  return apiClient.get<Post>(`/posts/${postId}`);
};

const likePost = async (postId: string) => {
  const token = localStorage.getItem("refreshToken"); 
  if (!token) {
    console.error("No authentication token found");
    return Promise.reject("Unauthorized: No token found");
  }
  return apiClient.post(
    `/posts/${postId}/like`,
    {}, 
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};

const createPost = async (formData: FormData) => {
  const token = localStorage.getItem("refreshToken");
  if (!token) {
    console.error("No authentication token found");
    return Promise.reject("Unauthorized: No token found");
  }
  return apiClient.post("/posts", formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  });
};

const updatePost = async (postId: string, formData: FormData) => {
  const token = localStorage.getItem("refreshToken");
  if (!token) {
    console.error("No authentication token found");
    return Promise.reject("Unauthorized: No token found");
  }
  return apiClient.put(`/posts/${postId}`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  });
};

const deletePost = async (postId: string) => {
  const token = localStorage.getItem("refreshToken");
  if (!token) {
    console.error("No authentication token found");
    return Promise.reject("Unauthorized: No token found");
  }
  return apiClient.delete(`/posts/${postId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export default { getAll, getPostById, likePost, createPost, updatePost, deletePost };
