import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '20mb' }));

// Shared Gemini client utility
let aiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  aiClient = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check & status
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: !!process.env.GEMINI_API_KEY,
    timestamp: Date.now(),
    model: 'gemini-3.8-flash',
    ttsModel: 'gemini-3.8-flash-lite-tts',
  });
});

// Translation & Speech Endpoint
app.post('/api/translate-speech', async (req, res) => {
  try {
    const { text, sourceLang, targetLang, audioBase64, speaker = 'LOCAL_USER' } = req.body;

    if (!text && !audioBase64) {
      return res.status(400).json({ error: 'Either text or audioBase64 must be provided' });
    }

    if (!aiClient) {
      // Mock fallback if API key is not present in local test
      const mockTranslations: Record<string, string> = {
        'Hello, can you hear me?': 'Hola, ¿puedes escucharme?',
        'I am calling regarding the contract update.': 'Llamo con respecto a la actualización del contrato.',
        'The delivery is scheduled for tomorrow at 2 PM.': 'La entrega está programada para mañana a las 2 PM.',
      };
      const translated = mockTranslations[text] || `[${targetLang}] ${text || 'Spoken speech translated'}`;
      return res.json({
        speaker,
        originalText: text || 'Voice message detected',
        translatedText: translated,
        sourceLang,
        targetLang,
        timestamp: Date.now(),
        ttsAudioBase64: null,
      });
    }

    let recognizedText = text;

    // If audio is provided, transcribe it first
    if (audioBase64) {
      const transcribeResponse = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            inlineData: {
              mimeType: 'audio/webm;codecs=opus',
              data: audioBase64,
            },
          },
          {
            text: `Transcribe the spoken speech in this audio accurately. The speaker is speaking in ${sourceLang}. Return ONLY the transcribed text without commentary.`,
          },
        ],
      });
      recognizedText = transcribeResponse.text?.trim() || text || '';
    }

    if (!recognizedText) {
      return res.status(400).json({ error: 'Could not recognize speech or no text provided' });
    }

    // Translate text with low-latency prompt
    const translateResponse = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `You are an ultra-low-latency real-time voice call interpreter. Translate the following speech from ${sourceLang} into ${targetLang}. 
Maintain conversational spoken tone, preserve numbers/names, and output ONLY the translated text without notes or quotes.
Input: "${recognizedText}"`,
      config: {
        temperature: 0.2,
      },
    });

    const translatedText = translateResponse.text?.trim() || recognizedText;

    // Synthesize TTS audio for playback if possible
    let ttsAudioBase64: string | null = null;
    try {
      const voiceMap: Record<string, string> = {
        'es-ES': 'Puck',
        'fr-FR': 'Charon',
        'de-DE': 'Fenrir',
        'ja-JP': 'Kore',
        'en-US': 'Zephyr',
      };
      const voiceName = voiceMap[targetLang] || 'Kore';

      const ttsResponse = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: translatedText,
                speechMetadata: {
                  style: 'Natural conversational phone call voice',
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
        },
      });

      ttsAudioBase64 = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
    } catch (ttsErr) {
      console.warn('TTS generation fallback to browser speech synthesis:', ttsErr);
    }

    res.json({
      speaker,
      originalText: recognizedText,
      translatedText,
      sourceLang,
      targetLang,
      timestamp: Date.now(),
      ttsAudioBase64,
    });
  } catch (error: any) {
    console.error('Translation error:', error);
    res.status(500).json({ error: error.message || 'Translation failed' });
  }
});

// Production or Vite development middleware
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer();
