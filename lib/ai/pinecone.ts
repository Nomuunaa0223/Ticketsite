import { Pinecone } from "@pinecone-database/pinecone";
import { env } from "@/lib/env";
import { createEmbedding } from "@/lib/ai/openai";

type EventVectorMetadata = {
  eventId: number;
  title: string;
  slug: string;
  category?: string;
  city?: string;
};

type GlobalWithPinecone = typeof globalThis & {
  tixoraPinecone?: Pinecone;
};

const globalForPinecone = globalThis as GlobalWithPinecone;

function getPineconeClient() {
  if (!env.PINECONE_API_KEY || !env.PINECONE_INDEX) return null;

  const client = globalForPinecone.tixoraPinecone ?? new Pinecone({ apiKey: env.PINECONE_API_KEY });
  if (process.env.NODE_ENV !== "production") {
    globalForPinecone.tixoraPinecone = client;
  }
  return client;
}

function getEventIndex() {
  const client = getPineconeClient();
  if (!client || !env.PINECONE_INDEX) return null;
  return client.index<EventVectorMetadata>(env.PINECONE_INDEX).namespace(env.PINECONE_NAMESPACE);
}

export async function upsertEventEmbedding(input: {
  id: number;
  title: string;
  slug: string;
  summary: string;
  description: string;
  category?: string;
  city?: string;
}) {
  const index = getEventIndex();
  if (!index) return { indexed: false, reason: "Pinecone is not configured." };

  const embedding = await createEmbedding(`${input.title}\n${input.summary}\n${input.description}`);
  if (!embedding) return { indexed: false, reason: "OpenAI embeddings are not configured." };

  await index.upsert({
    records: [
      {
        id: String(input.id),
        values: embedding,
        metadata: {
          eventId: input.id,
          title: input.title,
          slug: input.slug,
          category: input.category,
          city: input.city
        }
      }
    ]
  });

  return { indexed: true };
}

export async function queryEventEmbeddings(query: string, topK = 6) {
  const index = getEventIndex();
  if (!index) return null;

  const embedding = await createEmbedding(query);
  if (!embedding) return null;

  const result = await index.query({
    vector: embedding,
    topK,
    includeMetadata: true
  });

  return result.matches
    ?.map((match) => ({
      eventId: Number(match.metadata?.eventId ?? match.id),
      score: match.score ?? 0
    }))
    .filter((match) => Number.isFinite(match.eventId)) ?? [];
}

export function getPineconeStatus() {
  return {
    enabled: Boolean(env.PINECONE_API_KEY && env.PINECONE_INDEX),
    index: env.PINECONE_INDEX,
    namespace: env.PINECONE_NAMESPACE
  };
}
