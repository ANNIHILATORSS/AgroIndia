import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Camera, Plus, Trash2, Upload, Check, X, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import imageRecognitionService from '../services/imageRecognitionService';

interface ImageTrainingInterfaceProps {
  language: 'en' | 'hi';
  onClose: () => void;
}

const ImageTrainingInterface: React.FC<ImageTrainingInterfaceProps> = ({ language, onClose }) => {
  const [selectedPlant, setSelectedPlant] = useState<string>('sugarcane');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [trainingProgress, setTrainingProgress] = useState<number>(0);
  const [isTrainingComplete, setIsTrainingComplete] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // List of supported plants
  const supportedPlants = [
    { value: 'sugarcane', label: language === 'en' ? 'Sugarcane' : 'गन्ना' },
    { value: 'wheat', label: language === 'en' ? 'Wheat' : 'गेहूं' },
    { value: 'rice', label: language === 'en' ? 'Rice' : 'चावल' },
    { value: 'maize', label: language === 'en' ? 'Maize/Corn' : 'मक्का' },
    { value: 'potato', label: language === 'en' ? 'Potato' : 'आलू' },
    { value: 'tomato', label: language === 'en' ? 'Tomato' : 'टमाटर' },
    { value: 'cotton', label: language === 'en' ? 'Cotton' : 'कपास' },
    { value: 'pulses', label: language === 'en' ? 'Pulses' : 'दलहन' },
    { value: 'mustard', label: language === 'en' ? 'Mustard' : 'सरसों' },
    { value: 'soybean', label: language === 'en' ? 'Soybean' : 'सोयाबीन' },
  ];

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // Process each file
    Array.from(files).forEach(file => {
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError(language === 'en' 
          ? 'Image size should be less than 5MB' 
          : 'छवि का आकार 5MB से कम होना चाहिए');
        return;
      }

      // Check file type
      if (!file.type.match('image.*')) {
        setError(language === 'en' 
          ? 'Please select an image file' 
          : 'कृपया एक छवि फ़ाइल चुनें');
        return;
      }

      // Read as data URL
      const reader = new FileReader();
      reader.onload = (e) => {
        if (typeof e.target?.result === 'string') {
          setUploadedImages(prev => [...prev, e.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
    
    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove an image
  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  // Start training
  const startTraining = async () => {
    if (uploadedImages.length < 3) {
      setError(language === 'en' 
        ? 'Please upload at least 3 images for training' 
        : 'प्रशिक्षण के लिए कम से कम 3 छवियां अपलोड करें');
      return;
    }

    setIsTraining(true);
    setError(null);
    
    try {
      // Add all images to the training service
      uploadedImages.forEach(imageUrl => {
        imageRecognitionService.addTrainingImage(selectedPlant, imageUrl);
      });
      
      // Start training progress monitoring
      const progressInterval = setInterval(() => {
        const progress = imageRecognitionService.getTrainingProgress();
        setTrainingProgress(progress);
        
        if (progress >= 100) {
          clearInterval(progressInterval);
          setIsTrainingComplete(true);
          setIsTraining(false);
        }
      }, 500);
      
      // Start training
      await imageRecognitionService.trainModel();
      
    } catch (error) {
      console.error('Error training model:', error);
      setError(language === 'en' 
        ? 'Training failed. Please try again.' 
        : 'प्रशिक्षण विफल। कृपया पुन: प्रयास करें।');
      setIsTraining(false);
    }
  };

  return (
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
        {/* Header */}
        <div className="bg-sugarcane-600 text-white px-4 py-3 rounded-t-lg flex items-center justify-between">
          <h3 className="font-medium">
            {language === 'en' ? 'Train Image Recognition Model' : 'छवि पहचान मॉडल प्रशिक्षित करें'}
          </h3>
          <button 
            onClick={onClose} 
            className="hover:bg-sugarcane-700 rounded p-1"
          >
            <X size={16} />
          </button>
        </div>
        
        {/* Body */}
        <div className="p-4">
          {/* Plant selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {language === 'en' ? 'Select Plant Type' : 'पौधे का प्रकार चुनें'}
            </label>
            <select 
              value={selectedPlant}
              onChange={(e) => setSelectedPlant(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              disabled={isTraining}
            >
              {supportedPlants.map((plant) => (
                <option key={plant.value} value={plant.value}>
                  {plant.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* Training guide */}
          <div className="bg-blue-50 text-blue-800 p-3 rounded-md mb-4 text-sm">
            {language === 'en' 
              ? 'Upload multiple images of the selected plant type. Include different angles and growth stages for better recognition.'
              : 'चयनित पौधे के प्रकार की कई छवियां अपलोड करें। बेहतर पहचान के लिए विभिन्न कोणों और विकास चरणों को शामिल करें।'}
          </div>
          
          {/* Upload section */}
          <div className="mb-4">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              ref={fileInputRef}
              multiple
              className="hidden"
              disabled={isTraining}
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-6 border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100"
              disabled={isTraining}
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
          </div>
          
          {/* Error message */}
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4 text-sm">
              {error}
            </div>
          )}
          
          {/* Uploaded images preview */}
          {uploadedImages.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                {language === 'en' 
                  ? `Uploaded Images (${uploadedImages.length})` 
                  : `अपलोड की गई छवियां (${uploadedImages.length})`}
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {uploadedImages.map((image, index) => (
                  <div key={index} className="relative group">
                    <img 
                      src={image} 
                      className="h-24 w-full object-cover rounded-md" 
                      alt={`Training image ${index + 1}`} 
                    />
                    <Button 
                      className="absolute top-1 right-1 h-6 w-6 p-0 bg-red-500 hover:bg-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImage(index)}
                      disabled={isTraining}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Training progress */}
          {isTraining && (
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-700 mb-1">
                <span>
                  {language === 'en' ? 'Training in progress' : 'प्रशिक्षण प्रगति पर है'}
                </span>
                <span>{trainingProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-sugarcane-600 h-2 rounded-full" 
                  style={{ width: `${trainingProgress}%` }}
                ></div>
              </div>
            </div>
          )}
          
          {/* Training success message */}
          {isTrainingComplete && (
            <div className="bg-green-50 text-green-700 p-3 rounded-md mb-4 flex items-center">
              <Check className="h-5 w-5 mr-2" />
              {language === 'en' 
                ? 'Training completed successfully!' 
                : 'प्रशिक्षण सफलतापूर्वक पूरा हुआ!'}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="px-4 py-3 bg-gray-50 rounded-b-lg flex justify-between">
          <Button
            onClick={onClose}
            variant="outline"
            className="text-gray-700"
          >
            {language === 'en' ? 'Close' : 'बंद करें'}
          </Button>
          
          <Button
            onClick={startTraining}
            disabled={uploadedImages.length < 3 || isTraining}
            className="bg-sugarcane-600 hover:bg-sugarcane-700 text-white"
          >
            {isTraining ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {language === 'en' ? 'Training...' : 'प्रशिक्षण हो रहा है...'}
              </>
            ) : (
              <>
                {language === 'en' ? 'Start Training' : 'प्रशिक्षण शुरू करें'}
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ImageTrainingInterface; 