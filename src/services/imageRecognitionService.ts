/**
 * Image Recognition Service for AgroBot
 * This service handles plant image recognition and training
 */

// Define types for plant classification results
export interface PlantClassificationResult {
  plantType: string;
  confidence: number;
  healthStatus: string;
  possibleDiseases: string[];
  recommendations: string[];
  imageUrl?: string;
}

class ImageRecognitionService {
  private trainingData: Map<string, string[]> = new Map();
  private modelTrained: boolean = false;
  private trainingProgress: number = 0;
  private readonly supportedPlants = [
    'sugarcane', 'wheat', 'rice', 'maize', 'potato', 
    'tomato', 'cotton', 'pulses', 'mustard', 'soybean'
  ];
  
  // For Hindi support
  private readonly plantTranslations: Record<string, string> = {
    'sugarcane': 'गन्ना',
    'wheat': 'गेहूं',
    'rice': 'चावल',
    'maize': 'मक्का',
    'potato': 'आलू',
    'tomato': 'टमाटर',
    'cotton': 'कपास',
    'pulses': 'दलहन',
    'mustard': 'सरसों',
    'soybean': 'सोयाबीन'
  };
  
  // Disease patterns for each plant type
  private readonly diseasePatternsForPlant: Record<string, string[]> = {
    'sugarcane': ['red rot', 'smut', 'rust', 'leaf scald'],
    'wheat': ['rust', 'powdery mildew', 'loose smut', 'leaf blight'],
    'rice': ['blast', 'blight', 'sheath blight', 'bacterial leaf streak'],
    'maize': ['leaf blight', 'rust', 'smut', 'stalk rot'],
    'potato': ['late blight', 'early blight', 'black scurf', 'viral infection']
  };
  
  constructor() {
    // Initialize with some default training data
    this.supportedPlants.forEach(plant => {
      this.trainingData.set(plant, []);
    });
  }

  /**
   * Add training images for a specific plant type
   * @param plantType The type of plant (e.g., 'sugarcane', 'wheat')
   * @param imageUrl URL or base64 of the image
   * @returns Success status
   */
  public addTrainingImage(plantType: string, imageUrl: string): boolean {
    if (!this.supportedPlants.includes(plantType)) {
      console.error(`Plant type ${plantType} not supported`);
      return false;
    }
    
    const plantData = this.trainingData.get(plantType) || [];
    plantData.push(imageUrl);
    this.trainingData.set(plantType, plantData);
    this.modelTrained = false;
    console.log(`Added training image for ${plantType}. Total: ${plantData.length}`);
    return true;
  }
  
  /**
   * Start training the model with collected images
   * @returns Promise that resolves when training is complete
   */
  public async trainModel(): Promise<boolean> {
    // In a real implementation, this would call a machine learning API
    // or a local TensorFlow.js model training process
    
    let totalImages = 0;
    this.trainingData.forEach(images => {
      totalImages += images.length;
    });
    
    if (totalImages < 5) {
      console.error('Not enough training images (minimum 5 required)');
      return false;
    }
    
    // Simulate training process
    return new Promise((resolve) => {
      this.trainingProgress = 0;
      
      const interval = setInterval(() => {
        this.trainingProgress += 10;
        console.log(`Training progress: ${this.trainingProgress}%`);
        
        if (this.trainingProgress >= 100) {
          clearInterval(interval);
          this.modelTrained = true;
          console.log('Model training completed');
          resolve(true);
        }
      }, 500);
    });
  }
  
  /**
   * Get current training progress
   * @returns Progress percentage (0-100)
   */
  public getTrainingProgress(): number {
    return this.trainingProgress;
  }
  
  /**
   * Check if the model is trained
   * @returns Training status
   */
  public isModelTrained(): boolean {
    return this.modelTrained;
  }
  
  /**
   * Get training statistics
   * @returns Object with training statistics
   */
  public getTrainingStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    
    this.trainingData.forEach((images, plantType) => {
      stats[plantType] = images.length;
    });
    
    return stats;
  }
  
  /**
   * Classify a plant image
   * @param imageUrl URL or base64 of the image to classify
   * @param language Language code ('en' or 'hi')
   * @returns Classification result
   */
  public async classifyPlantImage(imageUrl: string, language: 'en' | 'hi' = 'en'): Promise<PlantClassificationResult> {
    // In a real implementation, this would send the image to an ML model
    
    if (!this.modelTrained) {
      // If model is not trained, use random results
      return this.getRandomClassification(language);
    }
    
    // Simulate image analysis with delay
    return new Promise((resolve) => {
      setTimeout(() => {
        // In a real implementation, we would analyze the actual image
        // For now, use a weighted selection based on training data
        
        let plantTypes = Array.from(this.trainingData.keys());
        let weights: number[] = [];
        
        // Plants with more training data get higher weights
        plantTypes.forEach(plant => {
          const imageCount = this.trainingData.get(plant)?.length || 0;
          weights.push(imageCount + 1); // Add 1 to avoid zero weight
        });
        
        // Select a plant type based on weights
        const selectedPlant = this.weightedRandomSelection(plantTypes, weights);
        
        resolve(this.generateClassificationResult(selectedPlant, language, imageUrl));
      }, 1500);
    });
  }
  
  /**
   * Helper method for weighted random selection
   */
  private weightedRandomSelection(items: string[], weights: number[]): string {
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < items.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return items[i];
      }
    }
    
    return items[0]; // Fallback
  }
  
  /**
   * Generate a random classification result (used when model is not trained)
   */
  private getRandomClassification(language: 'en' | 'hi'): PlantClassificationResult {
    const plantType = this.supportedPlants[Math.floor(Math.random() * this.supportedPlants.length)];
    return this.generateClassificationResult(plantType, language);
  }
  
  /**
   * Generate a detailed classification result for a plant type
   */
  private generateClassificationResult(plantType: string, language: 'en' | 'hi', imageUrl?: string): PlantClassificationResult {
    const confidence = 0.7 + (Math.random() * 0.25); // 70-95% confidence
    const healthOptions = ['healthy', 'minor issues', 'possible disease', 'needs attention'];
    const healthIndex = Math.floor(Math.random() * healthOptions.length);
    const healthStatus = healthOptions[healthIndex];
    
    // Get possible diseases for this plant
    const possibleDiseases = this.diseasePatternsForPlant[plantType] || [];
    let selectedDiseases: string[] = [];
    
    if (healthIndex > 1) {
      // If health status suggests disease, randomly select 1-2 diseases
      const diseaseCount = Math.min(1 + Math.floor(Math.random() * 2), possibleDiseases.length);
      
      for (let i = 0; i < diseaseCount; i++) {
        const randomDisease = possibleDiseases[Math.floor(Math.random() * possibleDiseases.length)];
        if (!selectedDiseases.includes(randomDisease)) {
          selectedDiseases.push(randomDisease);
        }
      }
    }
    
    // Generate recommendations based on health status
    const recommendations: string[] = [];
    if (healthStatus === 'healthy') {
      recommendations.push('Continue regular care and monitoring');
    } else if (healthStatus === 'minor issues') {
      recommendations.push('Check irrigation levels');
      recommendations.push('Monitor for pest activity');
    } else {
      recommendations.push('Consider applying appropriate fungicide/pesticide');
      recommendations.push('Consult with local agricultural extension office');
      recommendations.push('Isolate affected plants if possible');
    }
    
    // Translate if needed
    if (language === 'hi') {
      return {
        plantType: this.plantTranslations[plantType] || plantType,
        confidence: confidence,
        healthStatus: this.translateHealthStatus(healthStatus),
        possibleDiseases: selectedDiseases.map(disease => this.translateDisease(disease)),
        recommendations: recommendations.map(rec => this.translateRecommendation(rec)),
        imageUrl
      };
    }
    
    return {
      plantType,
      confidence,
      healthStatus,
      possibleDiseases: selectedDiseases,
      recommendations,
      imageUrl
    };
  }
  
  // Basic Hindi translations for health status
  private translateHealthStatus(status: string): string {
    const translations: Record<string, string> = {
      'healthy': 'स्वस्थ',
      'minor issues': 'मामूली समस्याएं',
      'possible disease': 'संभावित रोग',
      'needs attention': 'ध्यान देने की आवश्यकता है'
    };
    return translations[status] || status;
  }
  
  // Basic Hindi translations for diseases
  private translateDisease(disease: string): string {
    const translations: Record<string, string> = {
      'red rot': 'लाल सड़न',
      'smut': 'कंडुआ',
      'rust': 'रतुआ',
      'leaf scald': 'पत्ती झुलसा',
      'powdery mildew': 'चूर्णिल आसिता',
      'loose smut': 'ढीला कंडुआ',
      'leaf blight': 'पत्ती झुलसा',
      'blast': 'झोंका',
      'blight': 'झुलसा',
      'sheath blight': 'आवरण झुलसा',
      'bacterial leaf streak': 'बैक्टीरियल पत्ती धारी',
      'stalk rot': 'तना सड़न',
      'late blight': 'लेट झुलसा',
      'early blight': 'अर्ली झुलसा',
      'black scurf': 'काला पपड़ी',
      'viral infection': 'वायरल संक्रमण'
    };
    return translations[disease] || disease;
  }
  
  // Basic Hindi translations for recommendations
  private translateRecommendation(recommendation: string): string {
    const translations: Record<string, string> = {
      'Continue regular care and monitoring': 'नियमित देखभाल और निगरानी जारी रखें',
      'Check irrigation levels': 'सिंचाई के स्तर की जांच करें',
      'Monitor for pest activity': 'कीट गतिविधि के लिए निगरानी करें',
      'Consider applying appropriate fungicide/pesticide': 'उपयुक्त फफूंदीनाशक/कीटनाशक लगाने पर विचार करें',
      'Consult with local agricultural extension office': 'स्थानीय कृषि विस्तार कार्यालय से परामर्श करें',
      'Isolate affected plants if possible': 'यदि संभव हो तो प्रभावित पौधों को अलग करें'
    };
    return translations[recommendation] || recommendation;
  }
}

export default new ImageRecognitionService(); 