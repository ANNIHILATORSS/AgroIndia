# Team Name: ANNIHILATORS

**Problem Statement Name:** Predicting Crop Yields & Weather Impact for Farmers

# AgroIndia - AI-Driven Crop Yield & Weather Impact Prediction System
![AgroIndia](/Media/Screenshot%202025-06-11%20031306.png)

## Demo Video:
👉 [Watch the demo video here](https://youtu.be/rpJdWsRCqxM?si=ga3Vintgfdu8fuDz)

## 📌 Project Overview

A comprehensive platform designed to empower farmers with AI-powered yield predictions, disease detection, real-time weather insights, multilingual chatbot assistance, and personalized farming guidelines. This project integrates machine learning and accessible communication tools to support decision-making and enhance agricultural productivity.

---

## Screenshots
![AgroIndia](Media/Screenshot%202025-06-11%20024459.png)

<p align="center">
  <img src="Media/Screenshot%202025-06-11%20024524.png" alt="AgroS1" width="48%" />
  <img src="Media/Screenshot%202025-06-11%20024618.png" alt="AgroS2" width="48%" />
</p>

## 🧠 Team Data:

| Name              | Role                    |
|-------------------|-------------------------|
| OM SINGH          | Team Lead, AI/ML        |
| JAHNAVI SHUKLA    | UI/UX Specialist        |
| SOURAV NISHAD     | Cloud Engineer          |
| VATSALY SHUKLA    | AI/ML Developer         |
| YASH SRIVASTAVA   | Web Developer           |

## 🚀 Features

* **Yield Prediction**: Uses historical agricultural and weather data to forecast sugarcane production.
* **Disease Detection**: Image-based detection of common diseases using machine learning.
* **Weather & Rainfall Data**: Fetches location-based weather data using APIs for agricultural planning.
* **WhatsApp Connectivity**: Farmers can ask questions via WhatsApp in voice/text format.
* **Voice Input**: Supports local language voice queries for ease of use.
* **Multi-Language Support**: Offers language selection (e.g., Hindi/English) to enhance accessibility.
* **Farming Guidelines**: Provides climate-sensitive farming practices tailored to user location.
* **Ask Doubt Section**: Searchable Q\&A system for common queries, especially for sugarcane farming.
* **Centralized Farmer Dashboard**: Visual interface combining yield data, disease alerts, and weather conditions.
* **The Agro Bot**: AI Assistant provides farmers with personalized advice and insights by leveraging cutting-edge AI models.

---
## 📂 Project Structure

<html>
<pre><code>AgroIndia/
├── public/
├── src/
├── venv/
├── .gitignore
├── FarmingGuidelinesProps/
├── README.md
├── Yield_prediction_AgriConnect.ipynb
├── bun.lockb
├── components.json
├── eslint.config.js
├── index.html
├── package-lock.json
├── package.json
├── postcss.config.js
├── server.ts
├── leaf-disease-prediction.ipynb
├── tailwind.config.ts
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
├── upload-training-data.js
├── vite.config.ts
├── watson-training-data.json
├── watson-training-guide.md</code></pre>
</html>

## 📂 Datasets Used

* Yield Dataset (State/Crop-wise historical data)
* Weather and Rainfall Dataset (Government and public API sources)
* Disease Image Dataset (Labeled image data of plant diseases)
* Farmer interaction logs (Static/mock data for chatbot and UI)

---

## 🛠️ Tech Stack

* **Frontend**: HTML/CSS, React, Tailwind CSS 
* **Backend**: Flask, Python
* **Models**: Watson.ai
* **Machine Learning**: Scikit-learn, TensorFlow (Prediction and classification models)
* **APIs**: OpenWeatherMap, Twilio (for WhatsApp), Watson.ai Assistant

---

## 🔄 System Architecture

1. Farmer inputs data via chatbot or dashboard.
2. Backend processes query.
3. API fetches or serves result to frontend.
4. Result shown via WhatsApp bot or dashboard UI.
5. AI Assistant provides farmers with personalized advice and insights by leveraging cutting-edge AI models.


---


## ✅ Outcomes

* Accurate yield forecasting for informed planning.
* Disease alerts and mitigation strategies.
* Personalized, weather-based farming tips.
* Multilingual support and voice interaction to ensure inclusivity.
* AI Assistant provides farmers with personalized advice and insights by leveraging cutting-edge AI models.


---

## 📌 How to Run the Project

1. Clone the repo
2. Install dependencies: `pip install -r requirements.txt`
3. Set API keys in `.env` file
4. Run backend server: `python app.py`
5. Launch frontend or open dashboard in browser
6. Connect chatbot using Twilio sandbox


