/** @format */

import axios, { CanceledError } from "axios";
export { CanceledError };

// Get API URL based on current environment
const getApiUrl = () => {
  // Get the current frontend URL
  const currentUrl = window.location.origin;
  // If we're on localhost, use explicit port 3000 for backend
  if (currentUrl.includes('localhost')) {
    return 'http://localhost:3000';
  }
  // In production, assume backend is at the same domain (potentially different path)
  return window.location.origin;
};

export const apiClient = axios.create({
  baseURL: getApiUrl(),
  // Ensure cookies are sent with requests
  withCredentials: true,
  // Set needed headers for CORS
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    // Referer header is automatically set by the browser and can't be set manually
    // Do not try to set it as browsers will block it as an unsafe header
  }
});

// Add a request interceptor to include the JWT token in all requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    console.log("API Request Interceptor - Token:", token ? "Present" : "Not found");
    if (token) {
      config.headers.Authorization = `JWT ${token}`;
      console.log("Setting Authorization header:", `JWT ${token.substring(0, 10)}...`);
    } else {
      console.warn("No token found in localStorage");
    }
    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token refresh on 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.log("Response interceptor caught error:", error.response?.status, error.message);
    
    const originalRequest = error.config;
    
    // Only try to refresh if we got a 401 error and it's not from the refresh endpoint itself
    if (error.response?.status === 401 && 
        !originalRequest._retry && 
        !originalRequest.url?.includes('/auth/refresh')) {
      
      originalRequest._retry = true;
      console.log("Attempting token refresh for URL:", originalRequest.url);
      
      try {
        // Import would create circular dependency, so we're using a direct API call for refresh
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) {
          console.error("No refresh token available");
          throw new Error("No refresh token available");
        }
        
        console.log("Using refresh token:", refreshToken.substring(0, 10) + "...");
        console.log("Making refresh token request to " + getApiUrl() + "/auth/refresh");
        
        const response = await axios.post(getApiUrl() + "/auth/refresh", {
          refreshToken,
        }, {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            // Remove Referer header here too
          }
        });
        
        // Store new tokens
        if (response.data.accessToken && response.data.refreshToken) {
          console.log("Refresh successful, got new tokens!");
          console.log("New access token:", response.data.accessToken.substring(0, 10) + "...");
          
          localStorage.setItem("accessToken", response.data.accessToken);
          localStorage.setItem("refreshToken", response.data.refreshToken);
          
          // Update the authorization header on the original request
          originalRequest.headers.Authorization = `JWT ${response.data.accessToken}`;
          console.log("Updated original request headers with new token");
          
          // Retry the original request
          console.log("Retrying original request to:", originalRequest.url);
          return axios(originalRequest);
        } else {
          console.error("Refresh response did not include tokens:", response.data);
          throw new Error("Token refresh response invalid");
        }
      } catch (refreshError) {
        console.error("Error refreshing token:", refreshError);
        console.log("Token refresh failed - clearing tokens and redirecting to login");
        
        // Clear tokens on refresh failure
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        
        // Redirect to login page
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);
