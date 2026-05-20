import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "@/lib/env";

type GlobalWithGemini = typeof globalThis & {
  tixoraGemini?: GoogleGenerativeAI;
};

const globalForGemini = globalThis as GlobalWithGemini;

function getGeminiApiKey() {
  return env.GEMINI_API_KEY ?? env.GOOGLE_API_KEY ?? null;
}

export function getGeminiClient() {
  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;

  const client = globalForGemini.tixoraGemini ?? new GoogleGenerativeAI(apiKey);
  if (process.env.NODE_ENV !== "production") {
    globalForGemini.tixoraGemini = client;
  }

  return client;
}

export async function generateGeminiText(prompt: string) {
  const client = getGeminiClient();
  if (!client) return null;

  try {
    const model = client.getGenerativeModel({
      model: env.GEMINI_CHAT_MODEL,
      systemInstruction:
        "You are Tixora's AI ticket assistant. Answer in the user's language when clear. Use only the provided platform context for event, ticket, seat, and resale facts. Be concise, practical, and helpful.",
    });
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    return text || null;
  } catch (error) {
    console.warn("[gemini:generate] falling back to local AI mode", error);
    return null;
  }
}

export function getGeminiStatus() {
  return {
    enabled: Boolean(getGeminiApiKey()),
    chatModel: env.GEMINI_CHAT_MODEL,
  };
}
