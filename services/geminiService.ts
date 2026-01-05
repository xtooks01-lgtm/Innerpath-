
import { GoogleGenAI, Type, GenerateContentResponse, Modality } from "@google/genai";
import { decode, decodeAudioData, getAudioContext } from "./audioService";

// Helper to get fresh AI instance
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const SYSTEM_PERSONA = `You are Rudh-h, a warm, supportive, and reliable human-like mentor for the InnerPath app.
Your tone is encouraging, empathetic, and wise—like a world-class coach who truly cares about the user's growth.
Avoid robotic jargon like 'candidate', 'node', 'protocol', 'synchronize', 'synthesize', 'verify', or 'diagnostic'. 
Instead, use 'friend', 'step', 'plan', 'journey', 'connection', 'reflection', and 'growth'.
You celebrate wins with genuine excitement and offer firm but kind encouragement when they struggle.
You focus on clarity, gentle discipline, and helping the user live their best life.`;

export interface GoalBreakdownResult {
  subTasks: {
    title: string;
    description: string;
    detailedExplanation: string;
    durationMinutes: number;
  }[];
  category: string;
}

export const breakdownGoalWithAI = async (
  goal: string, 
  category: string, 
  topic: string, 
  notes: string
): Promise<GoalBreakdownResult> => {
  const ai = getAI();
  const prompt = `Hey, let's look at this goal: "${goal}" in the category of ${category}. 
  The topic is ${topic} and the user noted: "${notes}".
  
  Can you break this down into 5 simple, encouraging, and clear steps? 
  Make the explanations feel like a friendly guide is teaching them how to succeed.
  Output in JSON format.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview', 
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_PERSONA,
      thinkingConfig: { thinkingBudget: 20000 },
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          subTasks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                detailedExplanation: { type: Type.STRING },
                durationMinutes: { type: Type.NUMBER }
              },
              required: ['title', 'description', 'detailedExplanation', 'durationMinutes']
            }
          },
          category: { type: Type.STRING }
        },
        required: ['subTasks', 'category']
      }
    }
  });

  return JSON.parse(response.text || '{}');
};

export const analyzeImageForGoal = async (base64Image: string): Promise<{ title: string; topic: string; category: string }> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
        { text: 'Look at this image and tell me what the user is trying to learn or achieve. Give me a friendly title, topic, and category in JSON.' }
      ]
    },
    config: {
      systemInstruction: SYSTEM_PERSONA,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          topic: { type: Type.STRING },
          category: { type: Type.STRING }
        }
      }
    }
  });
  return JSON.parse(response.text || '{}');
};

export const getDailyBriefing = async (name: string, xp: number): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Friend: ${name}, XP: ${xp}. Give them a warm, encouraging morning briefing. Mention a recent relevant event or a piece of wisdom found via search to inspire them.`,
    config: {
      tools: [{ googleSearch: {} }],
      systemInstruction: SYSTEM_PERSONA,
    }
  });
  return response.text || "Every small step counts on your journey. Let's make today meaningful.";
};

export const getSearchGroundedInfo = async (query: string): Promise<{ text: string; sources: any[] }> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: query,
    config: {
      systemInstruction: SYSTEM_PERSONA,
      tools: [{ googleSearch: {} }],
    },
  });
  
  const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  return {
    text: response.text || "I'm having a little trouble finding that right now. Let's focus on what we can do next.",
    sources: sources
  };
};

export const findNearbyResources = async (category: string, lat: number, lng: number): Promise<{ text: string; locations: any[] }> => {
  const ai = getAI();
  const query = `Find some great places like libraries, quiet cafes, or parks nearby for ${category}.`;
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: query,
    config: {
      systemInstruction: SYSTEM_PERSONA,
      tools: [{ googleMaps: {} }, { googleSearch: {} }],
      toolConfig: {
        retrievalConfig: {
          latLng: { latitude: lat, longitude: lng }
        }
      }
    },
  });

  const locations = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  return {
    text: response.text || "Looking for some peaceful spots for you...",
    locations: locations
  };
};

export const generateMasteryPodcast = async (goalTitle: string) => {
  const ai = getAI();
  const prompt = `A warm conversation between two friends about mastering: "${goalTitle}". One is more about steady progress, the other is more about deep focus.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        multiSpeakerVoiceConfig: {
          speakerVoiceConfigs: [
            { speaker: 'Progress', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
            { speaker: 'Focus', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } }
          ]
        }
      }
    }
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (base64Audio) {
    const ctx = getAudioContext(24000);
    const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    source.start();
  }
};

export const generateMotivationalVideo = async (goalTitle: string, category: string): Promise<string> => {
  const ai = getAI();
  const prompt = `A beautiful, inspiring, and cinematic video showing success and growth in ${goalTitle}. Warm lighting, peaceful atmosphere, very human and relatable.`;
  
  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: prompt,
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: '9:16'
    }
  });

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  return `${downloadLink}&key=${process.env.API_KEY}`;
};
