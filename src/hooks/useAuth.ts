/** @format */
import { useState, useEffect, useCallback } from "react";
import userService, { IUser } from "../services/user-service";
import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  _id: string;
  email: string;
  username: string;
  exp: number;
}

export const useAuth = () => {
  const [currentUser, setCurrentUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);
  const logout = useCallback(() => {
    userService.logout();
    setCurrentUser(null);
    setLoading(false);
  }, []);

  const fetchUserDetails = useCallback(async () => {
    try {
      const user = await userService.getCurrentUser();
      setCurrentUser(user);
    } catch (error) {
      console.error("Failed to fetch user details", error);
      logout();
    }
  }, [logout]);

  const checkAuthState = useCallback(async () => {
    setLoading(true);
      const timeoutId = setTimeout(() => {
      console.warn("Auth check timed out");
      setLoading(false);
    }, 5000);
    let token = userService.getRefreshToken();
    if (!token) {
      console.warn("No refresh token found, Checking for Google Account.");
      token = userService.getAccessToken();
    }
    if (!token) {
      console.warn("No access token found, logging out.");
      clearTimeout(timeoutId);
      logout();
      return;
    }
    try {
      const decoded = jwtDecode<DecodedToken>(token);
      const currentTime = Date.now() / 1000;
      if (decoded.exp <= currentTime) {
        console.log("Access token expired, attempting refresh.");
        try {
          const refreshResult = await userService.refresh();
          if (refreshResult) {
            userService.saveTokens(
              refreshResult.accessToken,
              refreshResult.refreshToken
            );
          } else {
            throw new Error("Failed to refresh token");
          }
        } catch (refreshError) {
          console.error("Token refresh failed:", refreshError);
          clearTimeout(timeoutId);
          logout();
          return;
        }
      }
      
      await fetchUserDetails();
      clearTimeout(timeoutId);
      setLoading(false);
    } catch (error) {
      console.error("Error decoding token or refreshing session:", error);
      clearTimeout(timeoutId);
      logout();
    }
  }, [logout, fetchUserDetails]);

  useEffect(() => {
    checkAuthState();
  }, [checkAuthState]);

  return {
    currentUser,
    loading,
    isAuthenticated: !!currentUser,
    updateAuthState: checkAuthState,
    logout,
  };
};