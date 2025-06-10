import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Mic, MicOff, Send, Loader2, X, Maximize2, Minimize2, ImagePlus, Settings, Upload } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Avatar } from '../components/ui/avatar';
import WatsonAssistantService from '../services/watsonAssistantService';
import imageRecognitionService from '../services/imageRecognitionService';

// Add SpeechRecognition types
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

type ChatBotProps = {
  language: 'en' | 'hi';
};

interface Message {
  id: number;
  content: string;
  isBot: boolean;
  timestamp: Date;
  image?: string; // Optional image URL or base64 data
}

const ChatBot = ({ language }: ChatBotProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [processingImage, setProcessingImage] = useState(false);
  const [showTrainingInterface, setShowTrainingInterface] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize welcome message
  useEffect(() => {
    setMessages([
      {
        id: 1,
        content: language === 'en' 
          ? 'Hello! I am AgroBot, your agricultural assistant. I can provide information about sugarcane farming, crop recommendations, disease identification, and best practices for Uttar Pradesh farmers. How can I help you today?' 
          : 'नमस्ते! मैं कृषिबॉट हूँ, आपका कृषि सहायक। मैं गन्ना की खेती, फसल अनुशंसाओं, रोग पहचान और उत्तर प्रदेश के किसानों के लिए सर्वोत्तम प्रथाओं के बारे में जानकारी प्रदान कर सकता हूं। आज मैं आपकी कैसे मदद कर सकता हूं?',
        isBot: true,
        timestamp: new Date()
      }
    ]);
  }, [language]);

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = language === 'en' ? 'en-US' : 'hi-IN';

      recognitionInstance.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setUserInput(transcript);
        setIsRecording(false);
      };

      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      setRecognition(recognitionInstance);

      return () => {
        if (recognition) recognition.stop();
      };
    }
  }, [language]);

  // Create Watson Assistant session when chat opens
  useEffect(() => {
    const createSession = async () => {
      if (isOpen && !sessionId) {
        try {
          const newSessionId = await WatsonAssistantService.createSession();
          setSessionId(newSessionId);
          console.log('Created Watson Assistant session:', newSessionId);
        } catch (error) {
          console.error('Failed to create Watson Assistant session:', error);
        }
      }
    };

    createSession();

    // Clean up session when component unmounts
    return () => {
      if (sessionId) {
        WatsonAssistantService.deleteSession(sessionId).catch(error => {
          console.error('Failed to delete Watson Assistant session:', error);
        });
      }
    };
  }, [isOpen, sessionId]);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleRecording = () => {
    if (isRecording) {
      if (recognition) recognition.stop();
    } else {
      if (recognition) {
        recognition.start();
        setIsRecording(true);
      }
    }
  };
  
  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert(language === 'en' 
        ? 'Image size should be less than 5MB' 
        : 'छवि का आकार 5MB से कम होना चाहिए');
      return;
    }

    // Check file type
    if (!file.type.match('image.*')) {
      alert(language === 'en' 
        ? 'Please select an image file' 
        : 'कृपया एक छवि फ़ाइल चुनें');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result as string;
      setSelectedImage(imageData);
      handleImageSubmit(imageData);
    };
    reader.readAsDataURL(file);
  };

  // Process the uploaded image
  const handleImageSubmit = async (imageData: string) => {
    if (!imageData || processingImage) return;
    
    setProcessingImage(true);
    
    // Add user message with image
    const newUserMessage: Message = {
      id: messages.length + 1,
      content: language === 'en' 
        ? 'I\'ve uploaded a plant image for identification.' 
        : 'मैंने पहचान के लिए एक पौधे की छवि अपलोड की है।',
      isBot: false,
      timestamp: new Date(),
      image: imageData
    };
    
    setMessages(prevMessages => [...prevMessages, newUserMessage]);
    setSelectedImage(null);
    
    try {
      // Bot response for image upload
      const botResponse = language === 'en'
        ? 'I\'ve received your plant image. Let me analyze it to identify the plant and any potential issues.'
        : 'मुझे आपकी पौधे की छवि मिल गई है। पौधे की पहचान करने और किसी भी संभावित समस्या का पता लगाने के लिए मुझे इसका विश्लेषण करने दें।';
      
      // Add initial bot response
      const initialBotMessage: Message = {
        id: messages.length + 2,
        content: botResponse,
        isBot: true,
        timestamp: new Date()
      };
      
      setMessages(prevMessages => [...prevMessages, initialBotMessage]);
      
      // Use the image recognition service to classify the plant
      const classificationResult = await imageRecognitionService.classifyPlantImage(imageData, language);
      
      // Format the response based on classification results
      let analysisResponse = '';
      
      if (language === 'en') {
        analysisResponse = `Based on the image, this appears to be a ${classificationResult.plantType} plant with ${Math.round(classificationResult.confidence * 100)}% confidence.\n\n`;
        analysisResponse += `Plant health: ${classificationResult.healthStatus}.\n`;
        
        if (classificationResult.possibleDiseases && classificationResult.possibleDiseases.length > 0) {
          analysisResponse += `Possible issues detected: ${classificationResult.possibleDiseases.join(', ')}.\n\n`;
        }
        
        if (classificationResult.recommendations && classificationResult.recommendations.length > 0) {
          analysisResponse += `Recommendations:\n`;
          classificationResult.recommendations.forEach(rec => {
            analysisResponse += `• ${rec}\n`;
          });
        }
      } else {
        // Hindi response
        analysisResponse = `छवि के आधार पर, यह ${classificationResult.plantType} का पौधा प्रतीत होता है, ${Math.round(classificationResult.confidence * 100)}% विश्वास के साथ।\n\n`;
        analysisResponse += `पौधे का स्वास्थ्य: ${classificationResult.healthStatus}।\n`;
        
        if (classificationResult.possibleDiseases && classificationResult.possibleDiseases.length > 0) {
          analysisResponse += `संभावित समस्याएं: ${classificationResult.possibleDiseases.join(', ')}।\n\n`;
        }
        
        if (classificationResult.recommendations && classificationResult.recommendations.length > 0) {
          analysisResponse += `अनुशंसाएँ:\n`;
          classificationResult.recommendations.forEach(rec => {
            analysisResponse += `• ${rec}\n`;
          });
        }
      }
      
      const detailedBotMessage: Message = {
        id: messages.length + 3,
        content: analysisResponse,
        isBot: true,
        timestamp: new Date()
      };
      
      setMessages(prevMessages => [...prevMessages, detailedBotMessage]);
      
      // If model is not trained, suggest training
      if (!imageRecognitionService.isModelTrained()) {
        setTimeout(() => {
          const trainingPromptMessage: Message = {
            id: messages.length + 4,
            content: language === 'en' 
              ? 'For more accurate plant identification, consider training the model with your own plant images. Click the settings icon to start training.'
              : 'अधिक सटीक पौधों की पहचान के लिए, अपनी खुद की पौधों की छवियों के साथ मॉडल को प्रशिक्षित करने पर विचार करें। प्रशिक्षण शुरू करने के लिए सेटिंग्स आइकन पर क्लिक करें।',
            isBot: true,
            timestamp: new Date()
          };
          setMessages(prevMessages => [...prevMessages, trainingPromptMessage]);
        }, 2000);
      }
      
    } catch (error) {
      console.error('Error processing image:', error);
      
      // Add error message
      const errorMessage: Message = {
        id: messages.length + 2,
        content: language === 'en'
          ? "I'm sorry, I encountered an error processing your image. Please try again later."
          : "मुझे खेद है, आपकी छवि को संसाधित करने में मुझे एक त्रुटि मिली। कृपया बाद में पुनः प्रयास करें।",
        isBot: true,
        timestamp: new Date()
      };
      
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setProcessingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || loading) return;

    // Add user message
    const newUserMessage: Message = {
      id: messages.length + 1,
      content: userInput,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prevMessages => [...prevMessages, newUserMessage]);
    setUserInput('');
    setLoading(true);

    try {
      let response = '';
      
      // Try to use Watson Assistant first, then fall back to local processing
      if (sessionId) {
        try {
          // Attempt to use Watson Assistant
          response = await WatsonAssistantService.sendMessage(sessionId, newUserMessage.content, language);
          console.log('Got response from Watson:', response);
        } catch (watsonError) {
          // If Watson fails, fall back to local processing
          console.warn('Watson Assistant error, using fallback:', watsonError);
          response = await generateLocalResponse(newUserMessage.content, language);
        }
      } else {
        // No session ID, use local processing
        console.log('No Watson session, using local processing');
        response = await generateLocalResponse(newUserMessage.content, language);
      }
      
      // Add bot response
      const newBotMessage: Message = {
        id: messages.length + 2,
        content: response,
        isBot: true,
        timestamp: new Date()
      };

      setMessages(prevMessages => [...prevMessages, newBotMessage]);
    } catch (error) {
      console.error('Error processing message:', error);
      
      // Add error message
      const errorMessage: Message = {
        id: messages.length + 2,
        content: language === 'en'
          ? "I'm sorry, I encountered an error. Please try again later."
          : "मुझे खेद है, मुझे एक त्रुटि मिली। कृपया बाद में पुनः प्रयास करें।",
        isBot: true,
        timestamp: new Date()
      };
      
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // Fallback local response generator
  const generateLocalResponse = async (query: string, lang: 'en' | 'hi'): Promise<string> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const lowerQuery = query.toLowerCase().trim();
    console.log('Processing query:', lowerQuery);

    // Handle greetings
    if (lowerQuery.match(/^(hi|hello|hey|namaste|नमस्ते|हेलो|हाय)$/i)) {
      return lang === 'en'
        ? 'Hello! I\'m AgroBot, your agriculture assistant. How can I help you today with farming information?'
        : 'नमस्ते! मैं कृषिबॉट हूँ, आपका कृषि सहायक। आज मैं आपकी कृषि जानकारी के साथ कैसे मदद कर सकता हूं?';
    }

    // Sugarcane specific queries
    if (lowerQuery.includes('sugarcane') || lowerQuery.includes('गन्ना')) {
      return lang === 'en'
        ? 'Sugarcane is a major crop in Uttar Pradesh. It grows best in well-drained, fertile soils with pH 6.5-7.5. For optimal growth, maintain soil moisture, apply balanced fertilization (NPK 150:60:60 kg/ha), and follow integrated pest management.'
        : 'उत्तर प्रदेश में गन्ना एक प्रमुख फसल है। यह अच्छी जल निकासी वाली, उपजाऊ मिट्टी में pH 6.5-7.5 के साथ सबसे अच्छा बढ़ता है। इष्टतम विकास के लिए, मिट्टी की नमी बनाए रखें, संतुलित उर्वरीकरण (NPK 150:60:60 किग्रा/हेक्टेयर) लागू करें, और एकीकृत कीट प्रबंधन का पालन करें।';
    }

    // Crop recommendation logic
    if (lowerQuery.includes('recommend') || lowerQuery.includes('which crop') || 
        lowerQuery.includes('suggest crop') || lowerQuery.includes('फसल सुझाव') || 
        lowerQuery.includes('कौन सी फसल')) {
      if (lowerQuery.includes('clay') || lowerQuery.includes('मिट्टी')) {
        return lang === 'en' 
          ? 'For clay soils in UP, I recommend growing sugarcane, rice, or wheat. Sugarcane grows well in heavy clay soils with good water retention.'
          : 'यूपी में मिट्टी वाली मिट्टी के लिए, मैं गन्ना, चावल या गेहूं उगाने की सलाह देता हूं। गन्ना अच्छे जल धारण वाली भारी मिट्टी वाली मिट्टी में अच्छी तरह से बढ़ता है।';
      } else if (lowerQuery.includes('sandy') || lowerQuery.includes('बलुई')) {
        return lang === 'en'
          ? 'For sandy soils in UP, consider growing pulses, groundnuts, or certain vegetable crops. For sugarcane in sandy soils, you\'ll need more frequent irrigation and organic matter amendments.'
          : 'यूपी में बलुई मिट्टी के लिए, दलहन, मूंगफली या कुछ सब्जी फसलों को उगाने पर विचार करें। बलुई मिट्टी में गन्ने के लिए, आपको अधिक बार सिंचाई और जैविक पदार्थ संशोधनों की आवश्यकता होगी।';
      } else {
        return lang === 'en'
          ? 'For crop recommendations, I need more information about your soil type (sandy, clay, loam), rainfall in your area, and irrigation facilities.'
          : 'फसल की सिफारिशों के लिए, मुझे आपकी मिट्टी के प्रकार (बलुई, मिट्टी, दोमट), आपके क्षेत्र में वर्षा और सिंचाई सुविधाओं के बारे में अधिक जानकारी की आवश्यकता है।';
      }
    }

    // Disease identification and treatment
    if (lowerQuery.includes('disease') || lowerQuery.includes('pest') || 
        lowerQuery.includes('रोग') || lowerQuery.includes('कीट')) {
      if (lowerQuery.includes('red rot') || lowerQuery.includes('लाल सड़न')) {
        return lang === 'en'
          ? 'Red Rot disease in sugarcane is caused by fungus Colletotrichum falcatum. Look for reddish discoloration inside the stem, leaf yellowing, and wilting. Control by using disease-free seed material, treating setts with fungicides, and removing infected plants.'
          : 'गन्ने में लाल सड़न रोग कवक कोलेटोट्रिकम फालकेटम के कारण होता है। स्टेम के अंदर लालिमा, पत्तियों का पीलापन और मुरझाने के लिए देखें। रोग मुक्त बीज सामग्री का उपयोग करके, कवकनाशी के साथ सेट्स का इलाज और संक्रमित पौधों को हटाकर नियंत्रण करें।';
      } else if (lowerQuery.includes('smut') || lowerQuery.includes('कंडुआ')) {
        return lang === 'en'
          ? 'Smut disease is caused by fungus Ustilago scitaminea. It forms black whip-like structures at growing points. Control by using disease-free material, hot water treatment of setts, and removing infected plants.'
          : 'कंडुआ रोग कवक अस्टिलागो सिटामिनिया के कारण होता है। यह बढ़ने वाले बिंदुओं पर काले चाबुक जैसी संरचनाएँ बनाता है। रोग मुक्त सामग्री का उपयोग करके, सेट्स के गर्म पानी के उपचार और संक्रमित पौधों को हटाकर नियंत्रण करें।';
      } else {
        return lang === 'en'
          ? 'To help identify the disease or pest problem, can you describe the symptoms? Look for discoloration, unusual growth, wilting, or insect presence. You can also use our Disease Detection tool to upload a photo.'
          : 'रोग या कीट समस्या की पहचान करने में मदद करने के लिए, क्या आप लक्षणों का वर्णन कर सकते हैं? रंग परिवर्तन, असामान्य विकास, मुरझाने या कीटों की उपस्थिति देखें। आप फोटो अपलोड करने के लिए हमारे रोग पहचान उपकरण का भी उपयोग कर सकते हैं।';
      }
    }

    // Irrigation advice
    if (lowerQuery.includes('water') || lowerQuery.includes('irrigation') || 
        lowerQuery.includes('पानी') || lowerQuery.includes('सिंचाई')) {
      return lang === 'en'
        ? 'For sugarcane irrigation in UP: Irrigate every 8-10 days during summer months, 15-20 days during winter, and adjust based on rainfall during monsoon. Critical stages for irrigation are germination, tillering, grand growth, and maturity.'
        : 'यूपी में गन्ने की सिंचाई के लिए: गर्मी के महीनों में हर 8-10 दिनों में, सर्दियों के दौरान 15-20 दिनों में सिंचाई करें, और मानसून के दौरान वर्षा के आधार पर समायोजित करें। सिंचाई के महत्वपूर्ण चरण अंकुरण, टिलरिंग, बड़ा विकास और परिपक्वता हैं।';
    }

    // Fertilizer advice
    if (lowerQuery.includes('fertilizer') || lowerQuery.includes('उर्वरक') || 
        lowerQuery.includes('nutrients') || lowerQuery.includes('पोषक तत्व')) {
      return lang === 'en'
        ? 'For sugarcane in UP, apply NPK at 150:60:60 kg/ha in three splits - at planting (30% N, 100% P, 50% K), at 60-70 days (40% N), and at 90-120 days (30% N, 50% K). Also add 10-15 tons/ha of organic manure before planting.'
        : 'यूपी में गन्ने के लिए, तीन बार में NPK को 150:60:60 किग्रा/हेक्टेयर पर लागू करें - रोपण पर (30% N, 100% P, 50% K), 60-70 दिनों पर (40% N), और 90-120 दिनों पर (30% N, 50% K)। रोपण से पहले 10-15 टन/हेक्टेयर जैविक खाद भी जोड़ें।';
    }

    // Yield prediction
    if (lowerQuery.includes('yield') || lowerQuery.includes('production') ||
        lowerQuery.includes('उपज') || lowerQuery.includes('उत्पादन')) {
      return lang === 'en'
        ? 'To predict your sugarcane yield, use our Yield Prediction tool. You\'ll need to provide your district in UP, planted area, soil type, and irrigation details. The average yield in UP ranges from 60-80 tonnes per hectare depending on these factors.'
        : 'अपने गन्ने की उपज की भविष्यवाणी करने के लिए, हमारे उपज भविष्यवाणी उपकरण का उपयोग करें। आपको यूपी में अपना जिला, लगाए गए क्षेत्र, मिट्टी के प्रकार और सिंचाई विवरण प्रदान करने की आवश्यकता होगी। यूपी में औसत उपज इन कारकों के आधार पर 60-80 टन प्रति हेक्टेयर की रेंज में होती है।';
    }

    // Help/navigation
    if (lowerQuery.includes('help') || lowerQuery.includes('मदद') ||
        lowerQuery.includes('how to') || lowerQuery.includes('कैसे')) {
      return lang === 'en'
        ? 'Our website has several tools to help farmers: 1) Yield Prediction - estimate your crop production, 2) Disease Detection - identify diseases from leaf images, 3) Weather Display - check local conditions, and 4) This chatbot for agricultural queries. What would you like help with?'
        : 'हमारी वेबसाइट में किसानों की मदद के लिए कई उपकरण हैं: 1) उपज भविष्यवाणी - अपनी फसल उत्पादन का अनुमान लगाएं, 2) रोग पहचान - पत्ते की छवियों से रोगों की पहचान करें, 3) मौसम प्रदर्शन - स्थानीय परिस्थितियां जांचें, और 4) कृषि प्रश्नों के लिए यह चैटबोट। आप किस प्रकार की सहायता चाहते हैं?';
    }

    // Try to match any agricultural term and provide generic advice
    const agriculturalTerms = [
      {
        en: ['plant', 'sow', 'seed', 'germination', 'grow'],
        hi: ['पौधा', 'बीज', 'अंकुरण', 'बढ़ना'],
        response: {
          en: 'For planting sugarcane, use disease-free setts with 2-3 buds. Plant in furrows 10-15cm deep, with row spacing of 90-120cm. Ensure proper soil preparation with adequate organic matter.',
          hi: 'गन्ना लगाने के लिए, 2-3 आंखों वाले रोग मुक्त सेट्स का उपयोग करें। 10-15 सेमी गहरी नालियों में, 90-120 सेमी पंक्ति दूरी के साथ लगाएं। पर्याप्त जैविक पदार्थ के साथ उचित मिट्टी की तैयारी सुनिश्चित करें।'
        }
      },
      {
        en: ['harvest', 'cut', 'yield', 'mature'],
        hi: ['कटाई', 'उपज', 'परिपक्व'],
        response: {
          en: 'Harvest sugarcane when it reaches full maturity, typically 12-18 months after planting. Look for signs like yellow leaves, reduced growth, and optimal Brix level (sugar content). Cut stalks at the base, close to the ground.',
          hi: 'गन्ने की कटाई तब करें जब वह पूरी तरह से परिपक्व हो जाए, आमतौर पर लगाने के 12-18 महीने बाद। पीले पत्ते, कम विकास और इष्टतम ब्रिक्स स्तर (चीनी सामग्री) जैसे संकेतों को देखें। तनों को आधार पर, जमीन के पास से काटें।'
        }
      }
    ];
    
    // Check for any matching terms in the query
    for (const term of agriculturalTerms) {
      const matchTerms = lang === 'en' ? term.en : term.hi;
      if (matchTerms.some(t => lowerQuery.includes(t))) {
        return lang === 'en' ? term.response.en : term.response.hi;
      }
    }
    
    // Default response
    return lang === 'en'
      ? 'I can help with information about crop recommendations, disease identification, irrigation advice, fertilizer recommendations, and agricultural best practices. What specifically would you like to know about?'
      : 'मैं फसल सिफारिशों, रोग पहचान, सिंचाई सलाह, उर्वरक सिफारिशों और कृषि सर्वोत्तम अभ्यास के बारे में जानकारी के साथ मदद कर सकता हूं। विशेष रूप से आप किस बारे में जानना चाहेंगे?';
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat bot button */}
      {!isOpen && (
        <motion.button
          onClick={() => setIsOpen(true)}
          className="bg-sugarcane-600 hover:bg-sugarcane-700 text-white rounded-full p-4 shadow-lg flex items-center justify-center"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <MessageCircle size={24} />
        </motion.button>
      )}

      {/* Chat interface */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className={`bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col ${
            isMinimized ? 'h-16 w-80' : 'h-[500px] w-80 sm:w-96'
          }`}
        >
          {/* Header */}
          <div className="bg-sugarcane-600 text-white px-4 py-3 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center">
              <Avatar className="h-8 w-8 mr-2 border-2 border-white">
                <img src="/images/robot.png" alt="AgroBot" onError={(e) => {
                  e.currentTarget.src = 'https://img.icons8.com/color/48/000000/robot-2.png';
                }} />
              </Avatar>
              <h3 className="font-medium">
                AgroBot {isMinimized && '(' + messages.length + ')'}
              </h3>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowTrainingInterface(true)}
                className="hover:bg-sugarcane-700 rounded p-1 focus:outline-none"
                title={language === 'en' ? 'Train Model' : 'मॉडल प्रशिक्षित करें'}
              >
                <Settings size={16} />
              </button>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="hover:bg-sugarcane-700 rounded p-1 focus:outline-none"
              >
                {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-sugarcane-700 rounded p-1 focus:outline-none"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[80%] px-4 py-3 rounded-lg ${
                        message.isBot
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-sugarcane-600 text-white'
                      }`}
                    >
                      {message.image && (
                        <div className="mb-2">
                          <img 
                            src={message.image} 
                            alt="Uploaded plant" 
                            className="rounded-md max-w-full max-h-[200px] object-contain"
                          />
                        </div>
                      )}
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      <p className={`text-xs mt-1 ${message.isBot ? 'text-gray-500' : 'text-sugarcane-200'}`}>
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 px-4 py-3 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="animate-pulse w-2 h-2 bg-gray-400 rounded-full"></div>
                        <div className="animate-pulse w-2 h-2 bg-gray-400 rounded-full animation-delay-150"></div>
                        <div className="animate-pulse w-2 h-2 bg-gray-400 rounded-full animation-delay-300"></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input area */}
              <form onSubmit={handleSubmit} className="border-t border-gray-200 p-3 flex items-center">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder={language === 'en' ? 'Type a message...' : 'संदेश टाइप करें...'}
                  className="flex-1 border border-gray-300 rounded-l-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-sugarcane-500 focus:border-transparent"
                  disabled={loading || processingImage}
                />
                
                {/* Hidden file input for image upload */}
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={loading || processingImage}
                />
                
                {/* Image upload button */}
                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  variant="ghost"
                  className="bg-gray-100 text-gray-700 px-3 py-2 border-y border-gray-300"
                  disabled={loading || processingImage}
                >
                  <ImagePlus size={18} />
                </Button>
                
                <Button
                  type="button"
                  onClick={toggleRecording}
                  variant="ghost"
                  className={`${
                    isRecording ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                  } px-3 py-2 border-y border-gray-300`}
                  disabled={!recognition || loading || processingImage}
                >
                  {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
                </Button>
                <Button
                  type="submit"
                  className="bg-sugarcane-600 hover:bg-sugarcane-700 text-white rounded-r-md px-3 py-2 disabled:bg-gray-400"
                  disabled={!userInput.trim() || loading || processingImage}
                >
                  <Send size={18} />
                </Button>
              </form>
            </>
          )}
        </motion.div>
      )}
      
      {/* Image Training Interface (conditionally rendered) */}
      {showTrainingInterface && (
        <motion.div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
          >
            {/* Training Interface Header */}
            <div className="bg-sugarcane-600 text-white px-4 py-3 rounded-t-lg flex items-center justify-between">
              <h3 className="font-medium">
                {language === 'en' ? 'Train Image Recognition Model' : 'छवि पहचान मॉडल प्रशिक्षित करें'}
              </h3>
              <button 
                onClick={() => setShowTrainingInterface(false)} 
                className="hover:bg-sugarcane-700 rounded p-1"
              >
                <X size={16} />
              </button>
            </div>
            
            {/* Training Interface Body */}
            <div className="p-4">
              <select 
                className="w-full border border-gray-300 rounded-md px-3 py-2 mb-4"
              >
                <option value="sugarcane">{language === 'en' ? 'Sugarcane' : 'गन्ना'}</option>
                <option value="wheat">{language === 'en' ? 'Wheat' : 'गेहूं'}</option>
                <option value="rice">{language === 'en' ? 'Rice' : 'चावल'}</option>
                <option value="maize">{language === 'en' ? 'Maize/Corn' : 'मक्का'}</option>
                <option value="potato">{language === 'en' ? 'Potato' : 'आलू'}</option>
              </select>
              
              <div className="bg-blue-50 text-blue-800 p-3 rounded-md mb-4 text-sm">
                {language === 'en' 
                  ? 'Upload multiple images of the selected plant type. Include different angles and growth stages for better recognition.'
                  : 'चयनित पौधे के प्रकार की कई छवियां अपलोड करें। बेहतर पहचान के लिए विभिन्न कोणों और विकास चरणों को शामिल करें।'}
              </div>
              
              <Button
                className="w-full py-6 border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 mb-4"
              >
                <div className="flex flex-col items-center">
                  <Upload className="h-8 w-8 mb-2 text-gray-500" />
                  <span>
                    {language === 'en' ? 'Click to upload images' : 'छवियां अपलोड करने के लिए क्लिक करें'}
                  </span>
                  <span className="text-xs text-gray-500 mt-1">
                    {language === 'en' ? 'JPG, PNG, GIF up to 5MB' : 'JPG, PNG, GIF 5MB तक'}
                  </span>
                </div>
              </Button>
              
              <div className="grid grid-cols-3 gap-2 mb-4">
                {/* Sample images - in a real implementation these would be uploaded images */}
                <div className="bg-gray-200 h-24 rounded flex items-center justify-center">
                  <span className="text-gray-500 text-xs">Image 1</span>
                </div>
                <div className="bg-gray-200 h-24 rounded flex items-center justify-center">
                  <span className="text-gray-500 text-xs">Image 2</span>
                </div>
                <div className="bg-gray-200 h-24 rounded flex items-center justify-center">
                  <span className="text-gray-500 text-xs">Image 3</span>
                </div>
              </div>
            </div>
            
            {/* Training Interface Footer */}
            <div className="px-4 py-3 bg-gray-50 rounded-b-lg flex justify-between">
              <Button
                onClick={() => setShowTrainingInterface(false)}
                variant="outline"
                className="text-gray-700"
              >
                {language === 'en' ? 'Close' : 'बंद करें'}
              </Button>
              
              <Button
                className="bg-sugarcane-600 hover:bg-sugarcane-700 text-white"
              >
                {language === 'en' ? 'Start Training' : 'प्रशिक्षण शुरू करें'}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default ChatBot; 