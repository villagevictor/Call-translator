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
    platform: 'Android 14+ Telecom & Real-Time Voice Engine',
  });
});

// Real-Time Speech Translation Endpoint
app.post('/api/translate-speech', async (req, res) => {
  const startTime = Date.now();
  try {
    const { text, sourceLang, targetLang, audioBase64, speaker = 'LOCAL_USER' } = req.body;

    if (!text && !audioBase64) {
      return res.status(400).json({ error: 'Either text or audioBase64 must be provided' });
    }

    let recognizedText = (text || '').trim();

    // If audio is provided and no text, transcribe using Gemini
    if (audioBase64 && !recognizedText && aiClient) {
      try {
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
              text: `You are an ultra-accurate speech-to-text engine for a live phone call. Transcribe the spoken audio in ${sourceLang}. Return ONLY the exact transcribed text with no commentary or punctuation artifacts.`,
            },
          ],
        });
        recognizedText = transcribeResponse.text?.trim() || '';
      } catch (trErr) {
        console.warn('Transcription error:', trErr);
      }
    }

    if (!recognizedText) {
      return res.status(400).json({ error: 'No recognizable speech content received' });
    }

    let translatedText = recognizedText;

    if (aiClient) {
      // Real translation via Gemini 3.8 Flash
      const prompt = `You are a real-time phone call translation engine.
Translate the following sentence spoken during an active telephone call from language code "${sourceLang}" into language code "${targetLang}".
Requirements:
1. Preserve conversational nuance, natural speech cadence, and spoken idioms.
2. Keep numbers, currencies, dates, and proper names accurate.
3. For Ethiopian languages (Amharic am-ET, Tigrinya ti-ET, Oromo om-ET), provide natural polite phrasing.
4. Output ONLY the translated text without quotes or explanations.

Input text: "${recognizedText}"`;

      const translateResponse = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          temperature: 0.1,
        },
      });

      translatedText = translateResponse.text?.trim() || recognizedText;
    } else {
      // In the absence of an API key, provide straightforward language tagging
      translatedText = `[${targetLang}]: ${recognizedText}`;
    }

    // Optional TTS audio generation via Gemini Flash Lite TTS
    let ttsAudioBase64: string | null = null;
    if (aiClient) {
      try {
        const voiceMap: Record<string, string> = {
          'es-ES': 'Puck',
          'fr-FR': 'Charon',
          'de-DE': 'Fenrir',
          'ja-JP': 'Kore',
          'en-US': 'Zephyr',
          'ar-SA': 'Fenrir',
          'pt-BR': 'Puck',
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
                    style: 'Clear telephone speech',
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
        // Handled gracefully: client will use Web Speech synthesis
      }
    }

    const latencyMs = Date.now() - startTime;

    res.json({
      speaker,
      originalText: recognizedText,
      translatedText,
      sourceLang,
      targetLang,
      timestamp: Date.now(),
      latencyMs,
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
