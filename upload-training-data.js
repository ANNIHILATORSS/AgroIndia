/**
 * Script to upload training data to IBM Watson Assistant
 * 
 * This script will help you upload the intents, entities, and dialog nodes
 * created in watson-training-data.json to your Watson Assistant instance
 * 
 * Prerequisites:
 * 1. Node.js installed
 * 2. IBM Watson Assistant service created
 * 3. Assistant ID obtained from Watson Assistant dashboard
 * 
 * Usage:
 * 1. Update the credentials and assistant ID below
 * 2. Run with: node upload-training-data.js
 */

const fs = require('fs');
const axios = require('axios');

// Update these with your actual credentials
const ASSISTANT_URL = 'https://api.au-syd.assistant.watson.cloud.ibm.com/instances/ede0e927-1a0a-4740-9ebf-c1738f63f3cd';
const ASSISTANT_APIKEY = 'wmCRCm2e9wNxF4Tsqrj2moVkFWIIcSb3YsueUHmiKwo2';

// Replace this with your actual Assistant ID from the Watson Assistant dashboard
const ASSISTANT_ID = 'YOUR_ASSISTANT_ID';

// Read training data
const trainingData = JSON.parse(fs.readFileSync('./watson-training-data.json', 'utf8'));

// Get IAM token
async function getIAMToken() {
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

// Create skill in Watson Assistant
async function createSkill(token) {
  try {
    // First, create a skill
    const skillResponse = await axios.post(
      `${ASSISTANT_URL}/v2/assistants/${ASSISTANT_ID}/skills?version=2021-06-14`,
      {
        name: "AgroBot Skill",
        description: "Agricultural assistant for UP farmers",
        language: "en"
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    const skillId = skillResponse.data.skill_id;
    console.log(`Created skill with ID: ${skillId}`);
    return skillId;
  } catch (error) {
    console.error('Error creating skill:', error);
    throw error;
  }
}

// Upload intents to skill
async function uploadIntents(token, skillId) {
  try {
    console.log('Uploading intents...');
    for (const intent of trainingData.intents) {
      await axios.post(
        `${ASSISTANT_URL}/v2/assistants/${ASSISTANT_ID}/skills/${skillId}/intents?version=2021-06-14`,
        intent,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      console.log(`Uploaded intent: ${intent.intent}`);
    }
  } catch (error) {
    console.error('Error uploading intents:', error);
    throw error;
  }
}

// Upload entities to skill
async function uploadEntities(token, skillId) {
  try {
    console.log('Uploading entities...');
    for (const entity of trainingData.entities) {
      await axios.post(
        `${ASSISTANT_URL}/v2/assistants/${ASSISTANT_ID}/skills/${skillId}/entities?version=2021-06-14`,
        entity,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      console.log(`Uploaded entity: ${entity.entity}`);
    }
  } catch (error) {
    console.error('Error uploading entities:', error);
    throw error;
  }
}

// Upload dialog nodes to skill
async function uploadDialogNodes(token, skillId) {
  try {
    console.log('Uploading dialog nodes...');
    for (const node of trainingData.dialog_nodes) {
      await axios.post(
        `${ASSISTANT_URL}/v2/assistants/${ASSISTANT_ID}/skills/${skillId}/dialog_nodes?version=2021-06-14`,
        node,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      console.log(`Uploaded dialog node: ${node.dialog_node}`);
    }
  } catch (error) {
    console.error('Error uploading dialog nodes:', error);
    throw error;
  }
}

// Main function to upload all data
async function uploadTrainingData() {
  try {
    console.log('Starting upload of training data...');
    
    if (ASSISTANT_ID === 'YOUR_ASSISTANT_ID') {
      console.error('Please update the ASSISTANT_ID in this script with your actual Assistant ID from the Watson Assistant dashboard.');
      return;
    }
    
    const token = await getIAMToken();
    const skillId = await createSkill(token);
    
    await uploadIntents(token, skillId);
    await uploadEntities(token, skillId);
    await uploadDialogNodes(token, skillId);
    
    console.log('Training data uploaded successfully!');
    console.log('Your Watson Assistant is now trained with agricultural knowledge.');
    console.log('\nNow update server.ts with your Assistant ID:');
    console.log(`const ASSISTANT_ID = '${skillId}';`);
  } catch (error) {
    console.error('Error uploading training data:', error);
  }
}

uploadTrainingData(); 