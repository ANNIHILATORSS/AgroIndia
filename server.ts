import express from 'express';
import twilio from 'twilio';
import axios from 'axios';

const app = express();
app.use(express.json());

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

// IBM Watson Assistant credentials
const ASSISTANT_URL = 'https://api.au-syd.assistant.watson.cloud.ibm.com/instances/ede0e927-1a0a-4740-9ebf-c1738f63f3cd';
const ASSISTANT_APIKEY = 'wmCRCm2e9wNxF4Tsqrj2moVkFWIIcSb3YsueUHmiKwo2';
// IMPORTANT: You need to create an assistant in the IBM Watson Assistant dashboard and get its ID
// To do this:
// 1. Go to https://cloud.ibm.com and log in
// 2. Navigate to your Watson Assistant service
// 3. Create a new assistant or use an existing one
// 4. Get the Assistant ID from the assistant settings
// For now, we'll use a placeholder that will allow the local system to work
const ASSISTANT_ID = 'YOUR_ASSISTANT_ID';

// Helper to get IAM token for Watson
async function getWatsonToken() {
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
    console.error('Error getting Watson token:', error);
    throw error;
  }
}

// Watson Assistant API endpoints
app.post('/api/watson/sessions', async (req, res) => {
  try {
    const token = await getWatsonToken();
    const response = await axios.post(
      `${ASSISTANT_URL}/v2/assistants/${ASSISTANT_ID}/sessions?version=2021-06-14`,
      {},
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    res.json(response.data);
  } catch (error) {
    console.error('Error creating Watson session:', error);
    res.status(500).json({ success: false, message: 'Failed to create Watson session' });
  }
});

app.post('/api/watson/message', async (req, res) => {
  try {
    const { sessionId, message, language = 'en' } = req.body;
    
    if (!sessionId || !message) {
      return res.status(400).json({ success: false, message: 'SessionId and message are required' });
    }
    
    const token = await getWatsonToken();
    const context = language === 'hi' ? { skills: { 'main skill': { user_defined: { language: 'hi' } } } } : {};
    
    const response = await axios.post(
      `${ASSISTANT_URL}/v2/assistants/${ASSISTANT_ID}/sessions/${sessionId}/message?version=2021-06-14`,
      {
        input: { text: message },
        context
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    res.json(response.data);
  } catch (error) {
    console.error('Error sending message to Watson:', error);
    res.status(500).json({ success: false, message: 'Failed to send message to Watson' });
  }
});

app.delete('/api/watson/sessions/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'SessionId is required' });
    }
    
    const token = await getWatsonToken();
    await axios.delete(
      `${ASSISTANT_URL}/v2/assistants/${ASSISTANT_ID}/sessions/${sessionId}?version=2021-06-14`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting Watson session:', error);
    res.status(500).json({ success: false, message: 'Failed to delete Watson session' });
  }
});

// New chatbot API endpoint
app.post('/api/chatbot', async (req, res) => {
  try {
    const { message, language = 'en' } = req.body;
    
    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }
    
    // Simple response logic - in a real application, you'd use a more sophisticated NLP system
    // or connect to a service like OpenAI, Google Dialogflow, etc.
    let response = '';
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('yield')) {
      response = language === 'en'
        ? 'To predict sugarcane yield, please provide your district in UP, area in acres/hectares, and soil type.'
        : 'गन्ने की उपज की भविष्यवाणी के लिए, कृपया यूपी में अपना जिला, एकड़/हेक्टेयर में क्षेत्र और मिट्टी का प्रकार प्रदान करें।';
    } else if (lowerMessage.includes('disease')) {
      response = language === 'en'
        ? 'For disease identification, please use our "Disease Detection" feature to upload a photo of your plant.'
        : 'रोग पहचान के लिए, कृपया अपने पौधे की तस्वीर अपलोड करने के लिए हमारी "रोग पहचान" सुविधा का उपयोग करें।';
    } else if (lowerMessage.includes('hello') || lowerMessage.includes('नमस्ते')) {
      response = language === 'en'
        ? 'Hello! How can I help you with your agricultural needs today?'
        : 'नमस्ते! आज मैं आपकी कृषि आवश्यकताओं में कैसे मदद कर सकता हूं?';
    } else {
      response = language === 'en'
        ? 'I can help with information about sugarcane farming, disease detection, yield predictions, and weather forecasts. What would you like to know?'
        : 'मैं गन्ना खेती, रोग पहचान, उपज भविष्यवाणी और मौसम पूर्वानुमान के बारे में जानकारी के साथ मदद कर सकता हूं। आप क्या जानना चाहेंगे?';
    }
    
    res.json({ success: true, response });
  } catch (error) {
    console.error('Chatbot API Error:', error);
    res.status(500).json({ success: false, message: 'Failed to process message' });
  }
});

// /api/whatsapp-connect endpoint
app.post('/api/whatsapp-connect', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    console.log('Received phoneNumber:', phoneNumber); // Debug log

    const message = await client.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${phoneNumber}`,
      body: 'Welcome to AgriConnect! You are now connected to our WhatsApp service. You can ask questions about sugarcane farming anytime.',
    });

    res.json({ success: true, message: 'WhatsApp connection initiated', messageId: message.sid });
  } catch (error) {
    console.error('Twilio Error:', error);
    res.status(500).json({ success: false, message: 'Failed to connect to WhatsApp' });
  }
});

// /api/whatsapp-webhook endpoint
app.post('/api/whatsapp-webhook', (req, res) => {
  const twiml = new twilio.twiml.MessagingResponse();
  const incomingMsg = req.body.Body.toLowerCase();

  if (incomingMsg.startsWith('yield')) {
    const parts = incomingMsg.split(' ').slice(1);
    if (parts.length === 3) {
      const [district, areaStr, soilType] = parts;
      const area = parseFloat(areaStr);
      const areaFactor = areaStr.includes('hectare') ? 2.47 : 1;
      const soilMultipliers = { alluvial: 90, clayLoam: 75, sandyLoam: 65, loam: 85, clayey: 60 };
      const districtFactors = {
        lucknow: 1.15, kanpur: 1.05, meerut: 1.25, bareilly: 1.15, moradabad: 1.1,
        aligarh: 1.05, saharanpur: 1.2, gorakhpur: 1.1, faizabad: 1.05, jhansi: 0.95,
      };

      if (!isNaN(area) && soilMultipliers[soilType] && districtFactors[district.toLowerCase()]) {
        const yieldPerAcre = soilMultipliers[soilType] * districtFactors[district.toLowerCase()];
        const totalYield = yieldPerAcre * area * areaFactor;
        twiml.message(`Predicted yield: ${Math.round(totalYield)} quintals`);
      } else {
        twiml.message('Invalid input. Use: yield <district> <area> <soil> (e.g., yield Lucknow 5 alluvial)');
      }
    } else {
      twiml.message('Please provide district, area, and soil type. Example: yield Lucknow 5 alluvial');
    }
  } else if (incomingMsg.includes('help')) {
    twiml.message('Send "yield <district> <area> <soil>" to predict yield. Example: yield Lucknow 5 alluvial');
  } else {
    twiml.message('Hi! Send "help" for instructions or "yield" to predict sugarcane yield.');
  }

  res.set('Content-Type', 'text/xml');
  res.status(200).send(twiml.toString());
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});