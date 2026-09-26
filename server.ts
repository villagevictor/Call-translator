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
      // High-quality bilingual fallback for popular demo phrases
      const mockDictionary: Record<string, Record<string, string>> = {
        'Hello! Can you hear me?': {
          'es-ES': '¡Hola! ¿Puedes escucharme claramente?',
          'fr-FR': 'Bonjour! Est-ce que vous m’entendez bien?',
          'am-ET': 'ሰላም! በደንብ ይሰማዎታል?',
          'de-DE': 'Hallo! Können Sie mich deutlich hören?',
          'ar-SA': 'مرحباً! هل تسمعني بوضوح؟',
          'ja-JP': 'もしもし、私の声がはっきりと聞こえますか？',
        },
        'Yes, I can hear you clearly.': {
          'en-US': 'Yes, I can hear you clearly.',
          'es-ES': 'Sí, puedo escucharte perfectamente.',
          'am-ET': 'አዎ፣ በደንብ ይሰማኛል።',
          'fr-FR': 'Oui, je vous entends parfaitement.',
        }
      };

      const translated =
        mockDictionary[text]?.[targetLang] ||
        `[Translated to ${targetLang}]: ${text}`;

      return res.json({
        speaker,
        originalText: text,
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
              text: `Transcribe the spoken speech in this audio accurately. The speaker is speaking in ${sourceLang}. Return ONLY the transcribed text without commentary.`,
            },
          ],
        });
        recognizedText = transcribeResponse.text?.trim() || text || '';
      } catch (trErr) {
        console.warn('Transcription fallback:', trErr);
      }
    }

    if (!recognizedText) {
      return res.status(400).json({ error: 'Could not recognize speech or no text provided' });
    }

    // Translate text with low-latency prompt
    const translateResponse = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `You are an ultra-low-latency real-time phone call interpreter.
Translate the following spoken phone statement from ${sourceLang} into ${targetLang}.
Guidelines:
- Maintain natural, conversational spoken language.
- Preserve proper names, company names, currency, and times accurately.
- For Ethiopian languages (Amharic am-ET, Tigrinya ti-ET, Oromo om-ET), use native script and polite phone etiquette.
- Return ONLY the exact translated sentence without quotes, notes, or explanations.

Input: "${recognizedText}"`,
      config: {
        temperature: 0.1,
      },
    });

    const translatedText = translateResponse.text?.trim() || recognizedText;

    // Optional TTS audio generation if supported
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
                  style: 'Conversational phone call speaker',
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
      // Fallback to client-side speech synthesis
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

// Partner Reply Endpoint: For simulated live telephone conversations
app.post('/api/call-partner-reply', async (req, res) => {
  try {
    const {
      contactName,
      contactRole,
      contactLang,
      userLang,
      conversationHistory,
      lastUserMessage,
    } = req.body;

    if (!aiClient) {
      return res.json({
        partnerNativeText: `Entendido. Gracias por la información, seguimos en contacto.`,
        translatedToUserText: `Understood. Thank you for the information, let us stay in touch.`,
      });
    }

    const historyFormatted = (conversationHistory || [])
      .map((item: any) => `${item.speaker === 'LOCAL_USER' ? 'Caller' : contactName}: "${item.originalText}"`)
      .join('\n');

    const prompt = `You are playing the role of ${contactName} (${contactRole}) on a live telephone call.
Your native language is ${contactLang}.
The caller speaks ${userLang} and is using a real-time call translation device.

Caller just said: "${lastUserMessage}"

Recent Call Context:
${historyFormatted}

Task:
1. Respond naturally as ${contactName} in 1-2 spoken phone sentences in ${contactLang}. Be polite, professional, and directly address what they said.
2. Provide an accurate translation of your response into ${userLang}.

Format your output EXACTLY as JSON:
{
  "partnerNativeText": "Your spoken reply in ${contactLang}",
  "translatedToUserText": "The translation in ${userLang}"
}`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    res.json({
      partnerNativeText: parsed.partnerNativeText || 'Hola, todo comprendido.',
      translatedToUserText: parsed.translatedToUserText || 'Hello, all understood.',
    });
  } catch (err: any) {
    console.error('Call partner reply error:', err);
    res.status(500).json({ error: err.message || 'Call partner reply failed' });
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
