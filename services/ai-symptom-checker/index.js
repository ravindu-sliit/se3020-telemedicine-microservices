require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI, SchemaType } = require('@google/generative-ai');

const app = express();
const PORT = Number(process.env.PORT) || 5005;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY) && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here';

app.use(express.json());
app.use(cors());

const genAI = hasGeminiKey ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

const symptomSchema = {
  type: SchemaType.OBJECT,
  properties: {
    preliminarySuggestion: {
      type: SchemaType.STRING,
      description:
        'A short, professional medical disclaimer and preliminary suggestion based on the symptoms.'
    },
    recommendedSpecialty: {
      type: SchemaType.STRING,
      description:
        'The specific type of doctor the patient should see (e.g., General Physician, Neurologist, Dermatologist).'
    }
  },
  required: ['preliminarySuggestion', 'recommendedSpecialty']
};

const buildFallbackRecommendation = (symptoms = '') => {
  const normalizedSymptoms = symptoms.toLowerCase();

  const matches = [
    {
      keywords: ['chest pain', 'shortness of breath', 'palpitations', 'heart'],
      specialty: 'Cardiologist'
    },
    {
      keywords: ['rash', 'itching', 'skin', 'eczema', 'hives', 'acne'],
      specialty: 'Dermatologist'
    },
    {
      keywords: ['headache', 'dizziness', 'migraine', 'seizure', 'numbness'],
      specialty: 'Neurologist'
    },
    {
      keywords: ['fever', 'cough', 'sore throat', 'cold', 'flu'],
      specialty: 'General Physician'
    },
    {
      keywords: ['bone', 'joint', 'fracture', 'sprain', 'back pain'],
      specialty: 'Orthopedist'
    },
    {
      keywords: ['stomach', 'abdominal', 'nausea', 'vomiting', 'diarrhea'],
      specialty: 'General Physician'
    },
    {
      keywords: ['child', 'baby', 'infant', 'pediatric'],
      specialty: 'Pediatrician'
    }
  ];

  const matchedSpecialty = matches.find((entry) =>
    entry.keywords.some((keyword) => normalizedSymptoms.includes(keyword))
  )?.specialty || 'General Physician';

  return {
    preliminarySuggestion:
      'This is a preliminary suggestion only and is not a medical diagnosis. Please consult a healthcare professional for proper evaluation.',
    recommendedSpecialty: matchedSpecialty
  };
};

app.post('/api/ai/check-symptoms', async (req, res) => {
  try {
    const { symptoms } = req.body;

    if (!symptoms) {
      return res.status(400).json({ error: 'Symptoms are required.' });
    }

    if (!hasGeminiKey) {
      return res.status(200).json({
        ...buildFallbackRecommendation(symptoms),
        mode: 'fallback'
      });
    }

    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: symptomSchema
      }
    });

    const prompt = `You are a medical triage assistant. A patient reports the following symptoms: "${symptoms}". Provide a preliminary health suggestion and recommend the doctor specialty they should book an appointment with. Keep it concise.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const aiData = JSON.parse(responseText);

    return res.json(aiData);
  } catch (error) {
    const errorMessage = String(error?.message || '');
    const providerStatus = Number(error?.status || error?.response?.status || 0);

    if (errorMessage.includes('API key not valid')) {
      return res.status(200).json({
        ...buildFallbackRecommendation(req.body?.symptoms),
        mode: 'fallback'
      });
    }

    if (providerStatus === 403 || providerStatus === 429 || providerStatus === 503) {
      return res.status(200).json({
        ...buildFallbackRecommendation(req.body?.symptoms),
        mode: 'fallback'
      });
    }

    const isProduction = process.env.NODE_ENV === 'production';
    const errorStatus = error?.status || error?.response?.status || 500;
    const debugDetails = {
      message: error?.message || 'Unknown error',
      status: error?.status || error?.response?.status,
      code: error?.code,
      providerDetails: error?.errorDetails || error?.response?.data || null
    };

    console.error('AI Service Error:', debugDetails);

    if (isProduction) {
      return res.status(500).json({ error: 'Failed to analyze symptoms.' });
    }

    return res.status(errorStatus).json({
      error: 'Failed to analyze symptoms.',
      debug: debugDetails
    });
  }
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'AI symptom checker service is running'
  });
});

app.listen(PORT, () => {
  console.log(`AI Symptom Checker Service running on port ${PORT}`);
});
