/** @format */

import { apiClient, CanceledError } from "./api-client";
export { CanceledError };

export const getAIResponse = async (message: string): Promise<string> => {
  const token = localStorage.getItem("refreshToken");
  if (!token) {
    console.error("No authentication token found");
    return Promise.reject("Unauthorized: No token found");
  }

  try {
    const response = await apiClient.post<{ response: string }>("/chatbot", 
      { message }, 
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log(response.data);  
    const responseAI: string = response.data as unknown as string;
    return responseAI;
  } catch (error) {
    console.error("Error fetching AI response:", error);
    throw new Error("Failed to get AI response");
  }
};
