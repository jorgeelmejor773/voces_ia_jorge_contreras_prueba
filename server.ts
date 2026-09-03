import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI, Modality } from "@google/genai";

dotenv.config();

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is missing.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Convert raw PCM data (24kHz 16-bit mono) to standard playable WAV with 44-byte RIFF header
function wrapPcmInWav(pcmBuffer: Buffer, sampleRate = 24000, numChannels = 1, bitsPerSample = 16): Buffer {
  // If the buffer already starts with "RIFF", it's already a valid WAV
  if (pcmBuffer.length >= 4 && pcmBuffer.toString("ascii", 0, 4) === "RIFF") {
    return pcmBuffer;
  }

  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataLength = pcmBuffer.length;
  const wavHeader = Buffer.alloc(44);

  // RIFF Chunk Descriptor
  wavHeader.write("RIFF", 0, 4, "ascii");
  wavHeader.writeUInt32LE(36 + dataLength, 4);
  wavHeader.write("WAVE", 8, 4, "ascii");

  // "fmt " sub-chunk
  wavHeader.write("fmt ", 12, 4, "ascii");
  wavHeader.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  wavHeader.writeUInt16LE(1, 20); // AudioFormat (1 for PCM)
  wavHeader.writeUInt16LE(numChannels, 22);
  wavHeader.writeUInt32LE(sampleRate, 24);
  wavHeader.writeUInt32LE(byteRate, 28);
  wavHeader.writeUInt16LE(blockAlign, 32);
  wavHeader.writeUInt16LE(bitsPerSample, 34);

  // "data" sub-chunk
  wavHeader.write("data", 36, 4, "ascii");
  wavHeader.writeUInt32LE(dataLength, 40);

  return Buffer.concat([wavHeader, pcmBuffer]);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // TTS Generation endpoint using gemini-3.1-flash-tts-preview
  app.post("/api/tts/generate", async (req, res) => {
    try {
      const {
        text,
        voiceName = "Kore",
        accent = "Español Neutro",
        tone = "Natural y claro",
        customInstruction = "",
        multiSpeaker = false,
        speakerVoiceConfigs = [],
      } = req.body;

      if (!text || typeof text !== "string" || text.trim().length === 0) {
        return res.status(400).json({ error: "El texto es obligatorio para sintetizar la voz." });
      }

      const ai = getGeminiClient();

      // Build effective prompt
      let promptText = "";
      if (multiSpeaker && Array.isArray(speakerVoiceConfigs) && speakerVoiceConfigs.length === 2) {
        promptText = `TTS the following conversation in Spanish with natural pronunciation:\n${text}`;
      } else {
        const styleParts: string[] = [];
        if (accent) styleParts.push(`acento ${accent}`);
        if (tone) styleParts.push(`tono ${tone}`);
        if (customInstruction && customInstruction.trim()) styleParts.push(customInstruction.trim());

        const styleGuidance = styleParts.length > 0 ? ` con ${styleParts.join(", ")}` : "";
        promptText = `Lee en español${styleGuidance}: ${text}`;
      }

      // Configure speech options
      const speechConfig: any = {};
      if (multiSpeaker && Array.isArray(speakerVoiceConfigs) && speakerVoiceConfigs.length === 2) {
        speechConfig.multiSpeakerVoiceConfig = {
          speakerVoiceConfigs: [
            {
              speaker: speakerVoiceConfigs[0].speaker || "Locutor 1",
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: speakerVoiceConfigs[0].voiceName || "Kore" },
              },
            },
            {
              speaker: speakerVoiceConfigs[1].speaker || "Locutor 2",
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: speakerVoiceConfigs[1].voiceName || "Puck" },
              },
            },
          ],
        };
      } else {
        speechConfig.voiceConfig = {
          prebuiltVoiceConfig: { voiceName: voiceName || "Kore" },
        };
      }

      const ttsModels = [
        "gemini-2.5-flash-preview-tts",
        "gemini-2.5-pro-preview-tts",
        "gemini-3.1-flash-tts-preview",
      ];

      let rawBase64: string | undefined;
      let lastServerErr: any = null;

      for (const model of ttsModels) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: [{ parts: [{ text: promptText }] }],
            config: {
              responseModalities: [Modality.AUDIO],
              speechConfig,
            },
          });
          const audioPart = response.candidates?.[0]?.content?.parts?.[0];
          rawBase64 = audioPart?.inlineData?.data;
          if (rawBase64) break;
        } catch (err: any) {
          lastServerErr = err;
          continue;
        }
      }

      if (!rawBase64) {
        return res.status(502).json({
          error: "No se recibió audio del modelo de síntesis de voz.",
          details: lastServerErr?.message || "Respuesta sin datos binarios de audio",
        });
      }

      const rawPcmBuffer = Buffer.from(rawBase64, "base64");
      // Wrap raw 24kHz PCM in standard WAV container
      const wavBuffer = wrapPcmInWav(rawPcmBuffer, 24000, 1, 16);
      const wavBase64 = wavBuffer.toString("base64");
      const durationSeconds = (rawPcmBuffer.length / (24000 * 2)).toFixed(2);

      res.json({
        success: true,
        audioBase64: wavBase64,
        mimeType: "audio/wav",
        duration: parseFloat(durationSeconds),
        sampleRate: 24000,
        bytes: wavBuffer.length,
      });
    } catch (err: any) {
      let userMessage = err.message || "Ocurrió un error al procesar el audio con Gemini TTS.";
      const errStr = String(err?.message || err || "");

      if (!process.env.GEMINI_API_KEY || errStr.includes("GEMINI_API_KEY environment variable is missing")) {
        userMessage = "La clave GEMINI_API_KEY no está configurada. Por favor, actívala o configúrala en el menú lateral de Settings > Secrets.";
      } else if (errStr.includes("API_KEY_INVALID") || errStr.includes("PERMISSION_DENIED") || errStr.includes("403") || errStr.includes("400")) {
        userMessage = "La clave GEMINI_API_KEY no tiene permisos o no es válida. Revisa la clave en Settings > Secrets.";
      } else if (errStr.includes("RESOURCE_EXHAUSTED") || errStr.includes("429")) {
        userMessage = "Límite de cuota alcanzado (Error 429). Espera unos segundos antes de intentar generar audio nuevamente.";
      } else if (errStr.includes("NOT_FOUND") || errStr.includes("404")) {
        userMessage = "Modelo de voz no disponible o nombre inválido en la solicitud.";
      }

      res.status(500).json({
        error: userMessage,
        rawError: errStr,
      });
    }
  });

  // Spanish text enhancer for TTS (punctuation, phonetics, natural pauses)
  app.post("/api/tts/enhance-text", async (req, res) => {
    try {
      const { text, mode = "fluidez" } = req.body;
      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "Texto requerido" });
      }

      const ai = getGeminiClient();

      let instruction = "Eres un editor de guiones para locución y locutores profesionales en español.";
      if (mode === "fluidez") {
        instruction += " Mejora la puntuación (agrega signos ¿ ?, ¡ !, comas para pausas de respiración naturales, escribe números en palabras completas si mejora la lectura), manteniendo el mensaje exacto intacto.";
      } else if (mode === "dramatismo") {
        instruction += " Añade pausas expresivas (puntos suspensivos, exclamaciones bien puestas) para dar mayor dramatismo y emoción al texto sin alterar su significado clave.";
      } else if (mode === "comercial") {
        instruction += " Optimiza el texto para un spot comercial dinámico, persuasivo y con excelente ritmo de locución.";
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: `Optimiza este texto para locución en español:\n\n"${text}"\n\nDevuelve ÚNICAMENTE el texto mejorado, sin explicaciones ni comillas extras.`,
        config: {
          systemInstruction: instruction,
          temperature: 0.3,
        },
      });

      const enhancedText = response.text ? response.text.trim() : text;
      res.json({ success: true, enhancedText });
    } catch (err: any) {
      console.error("Error al mejorar texto:", err);
      res.status(500).json({ error: err.message || "Error al optimizar texto" });
    }
  });

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`VozStudio server running on http://localhost:${PORT}`);
  });
}

startServer();
