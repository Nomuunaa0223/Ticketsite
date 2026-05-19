import OpenAI from "openai";
import { env } from "@/lib/env";

type GlobalWithOpenAI = typeof globalThis & {
  tixoraOpenAI?: OpenAI;
};

const globalForOpenAI = globalThis as GlobalWithOpenAI;

export function getOpenAIClient() {
  if (!env.OPENAI_API_KEY) return null;

  const client = globalForOpenAI.tixoraOpenAI ?? new OpenAI({ apiKey: env.OPENAI_API_KEY });
  if (process.env.NODE_ENV !== "production") {
    globalForOpenAI.tixoraOpenAI = client;
  }
  return client;
}

export async function createEmbedding(input: string) {
  const client = getOpenAIClient();
  if (!client) return null;

  try {
    const response = await client.embeddings.create({
      model: env.OPENAI_EMBEDDING_MODEL,
      input
    });

    return response.data[0]?.embedding ?? null;
  } catch (error) {
    console.warn("[openai:embedding] falling back to PostgreSQL search", error);
    return null;
  }
}

export function getOpenAIStatus() {
  return {
    enabled: Boolean(env.OPENAI_API_KEY),
    chatModel: env.OPENAI_CHAT_MODEL,
    embeddingModel: env.OPENAI_EMBEDDING_MODEL
  };
}
