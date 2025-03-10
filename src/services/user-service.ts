import { CredentialResponse } from "@react-oauth/google";
import  { apiClient,CanceledError } from "./api-client";
import defaultImage from '../assets/avatar.png';


export { CanceledError }

export interface IUser {
    _id?: string,
    email: string,
    password?: string,
    imgUrl?: string,
    accessToken?: string,
    refreshToken?: string,
}

const saveTokens = (accessToken: string, refreshToken: string) => {
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
  };
  
  const getAccessToken = () => localStorage.getItem("accessToken");
  const getRefreshToken = () => localStorage.getItem("refreshToken");

const register = (user: IUser) => {
    const abortController = new AbortController()
    const request = apiClient.post<IUser>('/auth/register',
        user,
        { signal: abortController.signal })
        request.then((res) => {
            if (res.data.accessToken && res.data.refreshToken) {
              saveTokens(res.data.accessToken, res.data.refreshToken);
            }});
    return { request, abort: () => abortController.abort() }
}

const googleSignIn = (credential:CredentialResponse) => {
    const abortController = new AbortController()
    const request = apiClient.post<IUser>('/auth/google',
        credential,
        { signal: abortController.signal })
    return { request, abort: () => abortController.abort() }
}


const uploadImage = (img: File | null) => {
    const formData = new FormData();
    if (!img) {
        return fetch(defaultImage)
            .then(res => res.blob())
            .then(blob => {
                const defaultFile = new File([blob], "default.png", { type: "image/png" });
                formData.append("file", defaultFile);
                
                const request = apiClient.post('/file?file=default.png', formData, {
                    headers: {
                        'Content-Type': 'image/png'
                    }
                });
                
                return { request };
            });
    }
    
    formData.append("file", img);
    const request = apiClient.post('/file?file=' + img.name, formData, {
        headers: {
            'Content-Type': 'image/*'
        }
    });
    
    return { request };
};

const login = (email: string, password: string) => {
    const abortController = new AbortController();
    const request = apiClient.post<IUser>("/auth/login", { email, password }, { signal: abortController.signal });
    request.then((res) => {
        if (res.data.accessToken && res.data.refreshToken) {
          saveTokens(res.data.accessToken, res.data.refreshToken);
        }
      });
    return { request, abort: () => abortController.abort() };
};

const logout = (refreshToken: string) => {
    const abortController = new AbortController();
    const request = apiClient.post("/auth/logout", { refreshToken }, { signal: abortController.signal });
    request.finally(() => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
      });
    return { request, abort: () => abortController.abort() };
};

const refresh = () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return Promise.reject("No refresh token available");
  
    return apiClient
      .post("/auth/refresh", { refreshToken })
      .then((res) => {
        if (res.data.accessToken && res.data.refreshToken) {
          saveTokens(res.data.accessToken, res.data.refreshToken);
        }
        return res.data;
      })
      .catch((err) => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        throw err;
      });
  };

const getUserById = (id: string) => {
    const abortController = new AbortController();
    const request = apiClient.get<IUser>(`/users/${id}`, { signal: abortController.signal });
    return { request, abort: () => abortController.abort() };
};

const getAllUsers = () => {
    const abortController = new AbortController();
    const request = apiClient.get<IUser[]>("/users", { signal: abortController.signal });
    return { request, abort: () => abortController.abort() };
};

const updateUser = (id: string, userData: Partial<IUser>) => {
    const abortController = new AbortController();
    const request = apiClient.put<IUser>(`/users/${id}`, userData, { signal: abortController.signal });
    return { request, abort: () => abortController.abort() };
};

const deleteUser = (id: string) => {
    const abortController = new AbortController();
    const request = apiClient.delete(`/users/${id}`, { signal: abortController.signal });
    return { request, abort: () => abortController.abort() };
};


export default { register, uploadImage, googleSignIn, login, logout, refresh, getUserById, getAllUsers, updateUser, deleteUser, getAccessToken, getRefreshToken };