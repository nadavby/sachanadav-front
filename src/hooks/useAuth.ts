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

  const checkAuthState = useCallback(async () => {
    setLoading(true);
    const token = userService.getRefreshToken();
    if (!token) {
      console.warn("No access token found, logging out.");
      logout();
      return;
    }

    try {
      const decoded = jwtDecode<DecodedToken>(token);
      const currentTime = Date.now() / 1000;

      if (decoded.exp <= currentTime) {
        console.log("Access token expired, attempting refresh.");
        const refreshResult = await userService.refresh();
        userService.saveTokens(refreshResult.accessToken, refreshResult.refreshToken);
      }
      await fetchUserDetails();
    } catch (error) {
      console.error("Error decoding token or refreshing session:", error);
      logout();
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUserDetails = async () => {
    try {
      const user = await userService.getCurrentUser();
      setCurrentUser(user);
    } catch (error) {
      console.error("Failed to fetch user details", error);
      logout();
    }
  };

  const logout = () => {
    userService.logout();
    setCurrentUser(null);
  };

  useEffect(() => {
    checkAuthState();
  }, [checkAuthState]);

  return { currentUser, loading, isAuthenticated: !!currentUser, updateAuthState: checkAuthState, logout };
};
