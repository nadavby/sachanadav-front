import { apiClient, CanceledError } from "./api-client";
export { CanceledError };

interface ChatbotResponse {
  content: string;
  id?: string;
  timestamp?: string;
  metadata?: {
    [key: string]: unknown;
  };
}

export const getAIResponse = async (message: string): Promise<ChatbotResponse> => {
  const token = localStorage.getItem("refreshToken");
  if (!token) {
    console.error("No authentication token found");
    return Promise.reject("Unauthorized: No token found");
  }

  try {
    const response = await apiClient.post<{ response: string | ChatbotResponse }>(
      "/chatbot", 
      { message }, 
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    
    let processedResponse: ChatbotResponse;
    
    if (typeof response.data === 'string') {
      processedResponse = {
        content: response.data
      };
    } else if (typeof response.data.response === 'string') {
      processedResponse = {
        content: response.data.response
      };
    } else {
      processedResponse = response.data.response as ChatbotResponse;
    }
    
    return processedResponse;
  } catch (error) {
    console.error("Error fetching AI response:", error);
    throw new Error("Failed to get AI response");
  }
};