require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI, SchemaType } = require('@google/generative-ai');

const app = express();
const PORT = Number(process.env.PORT) || 5005;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

app.use(express.json());
app.use(cors());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

app.post('/api/ai/check-symptoms', async (req, res) => {
  try {
    const { symptoms } = req.body;

    if (!symptoms) {
      return res.status(400).json({ error: 'Symptoms are required.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured.' });
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
