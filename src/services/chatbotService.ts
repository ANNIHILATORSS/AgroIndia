import axios from 'axios';

// Types for API responses
export interface YieldPredictionParams {
  district: string;
  area: number;
  areaUnit: 'acre' | 'hectare';
  soilType: string;
  irrigationAvailability: 'full' | 'partial' | 'rain-fed';
}

export interface DiseaseIdentificationParams {
  imageBase64: string;
}

// Main chatbot service
export const ChatbotService = {
  // Method to get yield prediction
  predictYield: async (params: YieldPredictionParams): Promise<number> => {
    try {
      // This would ideally connect to your backend API
      // Simplified version for demonstration:
      
      // Mock soil type multipliers
      const soilMultipliers: Record<string, number> = {
        'alluvial': 90,
        'clayLoam': 75, 
        'sandy': 65,
        'sandyLoam': 65,
        'loam': 85,
        'clayey': 60,
      };
      
      // Mock district factors
      const districtFactors: Record<string, number> = {
        'lucknow': 1.15,
        'kanpur': 1.05,
        'meerut': 1.25,
        'bareilly': 1.15,
        'moradabad': 1.1,
        'aligarh': 1.05,
        'saharanpur': 1.2,
        'gorakhpur': 1.1,
        'faizabad': 1.05,
        'jhansi': 0.95,
      };
      
      // Mock irrigation availability factors
      const irrigationFactors: Record<string, number> = {
        'full': 1.0,
        'partial': 0.8,
        'rain-fed': 0.6,
      };
      
      const areaFactor = params.areaUnit === 'hectare' ? 2.47 : 1;
      
      const soilValue = soilMultipliers[params.soilType] || 70;
      const districtValue = districtFactors[params.district.toLowerCase()] || 1.0;
      const irrigationValue = irrigationFactors[params.irrigationAvailability] || 0.8;
      
      const yieldPerAcre = soilValue * districtValue * irrigationValue;
      const totalYield = yieldPerAcre * params.area * areaFactor;
      
      return Math.round(totalYield);

      // In a real implementation, you would call your backend API:
      // const response = await axios.post('/api/predict-yield', params);
      // return response.data.predictedYield;
    } catch (error) {
      console.error("Error predicting yield:", error);
      throw error;
    }
  },
  
  // Method to identify disease from image
  identifyDisease: async (params: DiseaseIdentificationParams): Promise<{
    diseaseName: string,
    confidence: number,
    treatment: string
  }> => {
    try {
      // This would connect to your actual disease prediction model API
      // For now, using mock data
      
      // In a real implementation:
      // const response = await axios.post('/api/identify-disease', params);
      // return response.data;
      
      // Mock response
      return {
        diseaseName: "Red Rot",
        confidence: 89.5,
        treatment: "Remove infected plants, use disease-free setts for planting, treat with fungicides, and practice crop rotation."
      };
    } catch (error) {
      console.error("Error identifying disease:", error);
      throw error;
    }
  },
  
  // Method to get weather information
  getWeatherInfo: async (district: string): Promise<{
    temperature: number,
    humidity: number,
    rainfall: number,
    forecast: string
  }> => {
    try {
      // This would connect to a weather API
      // For now, using mock data
      
      // In a real implementation:
      // const response = await axios.get(`/api/weather?district=${district}`);
      // return response.data;
      
      // Mock response
      return {
        temperature: 32,
        humidity: 65,
        rainfall: 0,
        forecast: "Clear skies with moderate humidity, good conditions for crop growth."
      };
    } catch (error) {
      console.error("Error fetching weather:", error);
      throw error;
    }
  },
  
  // Method to send a message to backend for processing (for more complex queries)
  processMessage: async (message: string, language: 'en' | 'hi'): Promise<string> => {
    try {
      // This would connect to your NLP processing backend
      // For now, just returning the message
      
      // In a real implementation:
      // const response = await axios.post('/api/process-message', { message, language });
      // return response.data.reply;
      
      return `Processed: ${message}`;
    } catch (error) {
      console.error("Error processing message:", error);
      throw error;
    }
  },
  
  // Method to connect user to WhatsApp service
  connectToWhatsApp: async (phoneNumber: string): Promise<boolean> => {
    try {
      // This would connect to your WhatsApp service API
      const response = await axios.post('/api/whatsapp-connect', { phoneNumber });
      return response.data.success;
    } catch (error) {
      console.error("Error connecting to WhatsApp:", error);
      throw error;
    }
  }
};

export default ChatbotService; 