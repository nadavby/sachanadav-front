import { apiClient } from './api-client';

export interface ComparisonResult {
  isMatch: boolean;
  score: number;
  matchedObjects: Array<{
    objectName: string;
    similarityScore: number;
  }>;
}

export interface AnalysisResult {
  labels: string[];
  objects: Array<{
    name: string;
    score: number;
    boundingBox: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }>;
}

export interface MatchResult {
  item: any;
  matches: Array<{
    item: any;
    score: number;
  }>;
}

const imageComparisonService = {
  compareImages: async (image1Url: string, image2Url: string): Promise<ComparisonResult> => {
    try {
      console.log("Vision API - Compare Images Request:", {
        image1Url,
        image2Url,
        headers: apiClient.defaults.headers
      });
      
      const response = await apiClient.post('/api/image-comparison/compare', {
        image1Url,
        image2Url
      });
      
      console.log("Vision API - Compare Images Response:", {
        status: response.status,
        data: response.data
      });
      
      return response.data;
    } catch (error) {
      console.error("Vision API - Compare Images Error:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers
      });
      throw error;
    }
  },

  analyzeImage: async (imageUrl: string): Promise<AnalysisResult> => {
    try {
      console.log("Vision API - Analyze Image Request:", {
        imageUrl,
        headers: apiClient.defaults.headers
      });
      
      const response = await apiClient.post('/api/image-comparison/analyze', {
        imageUrl
      });
      
      console.log("Vision API - Analyze Image Response:", {
        status: response.status,
        data: response.data
      });
      
      return response.data;
    } catch (error) {
      console.error("Vision API - Analyze Image Error:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers
      });
      throw error;
    }
  },

  findMatches: async (itemId: string): Promise<MatchResult> => {
    try {
      console.log("Vision API - Find Matches Request:", {
        itemId,
        headers: apiClient.defaults.headers
      });
      
      const response = await apiClient.get(`/api/image-comparison/find-matches/${itemId}`);
      
      console.log("Vision API - Find Matches Response:", {
        status: response.status,
        data: response.data
      });
      
      return response.data;
    } catch (error) {
      console.error("Vision API - Find Matches Error:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers
      });
      throw error;
    }
  }
};

export default imageComparisonService; 