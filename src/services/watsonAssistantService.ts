import axios from 'axios';

// IBM Watson Assistant credentials
const ASSISTANT_URL = 'https://api.au-syd.assistant.watson.cloud.ibm.com/instances/ede0e927-1a0a-4740-9ebf-c1738f63f3cd';
const ASSISTANT_APIKEY = 'wmCRCm2e9wNxF4Tsqrj2moVkFWIIcSb3YsueUHmiKwo2';
const ASSISTANT_AUTH_TYPE = 'iam';

// You'll need to create an assistant and get its ID from the Watson Assistant dashboard
// This is an example ID - you need to replace with your actual Assistant ID
const ASSISTANT_ID = 'YOUR_ASSISTANT_ID'; 

export const WatsonAssistantService = {
  // Create a new session
  createSession: async (): Promise<string> => {
    try {
      const response = await axios.post('/api/watson/sessions');
      return response.data.session_id;
    } catch (error) {
      console.error('Error creating Watson Assistant session:', error);
      throw error;
    }
  },

  // Send message to Watson Assistant
  sendMessage: async (sessionId: string, message: string, language: 'en' | 'hi'): Promise<string> => {
    try {
      const response = await axios.post('/api/watson/message', {
        sessionId,
        message,
        language
      });
      
      // Extract the response
      if (response.data.output && response.data.output.generic && response.data.output.generic.length > 0) {
        // Return the first text response
        const textResponses = response.data.output.generic
          .filter((item: any) => item.response_type === 'text')
          .map((item: any) => item.text);
        
        return textResponses.join('\n\n');
      }
      
      return language === 'en' 
        ? "I'm sorry, I couldn't process that request." 
        : "मुझे खेद है, मैं उस अनुरोध को संसाधित नहीं कर सका।";
    } catch (error) {
      console.error('Error sending message to Watson Assistant:', error);
      throw error;
    }
  },

  // Delete session when done
  deleteSession: async (sessionId: string): Promise<void> => {
    try {
      await axios.delete(`/api/watson/sessions/${sessionId}`);
    } catch (error) {
      console.error('Error deleting Watson Assistant session:', error);
      // Don't throw on cleanup errors
    }
  },
  
  // Get IAM token for authentication
  getIAMToken: async (): Promise<string> => {
    try {
      const response = await axios.post(
        'https://iam.cloud.ibm.com/identity/token',
        new URLSearchParams({
          'grant_type': 'urn:ibm:params:oauth:grant-type:apikey',
          'apikey': ASSISTANT_APIKEY
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      
      return response.data.access_token;
    } catch (error) {
      console.error('Error getting IAM token:', error);
      throw error;
    }
  }
};

export default WatsonAssistantService; 