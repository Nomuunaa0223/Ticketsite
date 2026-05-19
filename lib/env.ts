import { z } from "zod";

const optionalEnv = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().min(1).optional()
);

const optionalNumberEnv = (defaultValue: number) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.coerce.number().int().positive().default(defaultValue)
  );

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  NEXT_PUBLIC_APP_URL: z.string().url().default("https://localhost:3000"),
  REDIS_URL: optionalEnv,
  SEAT_LOCK_TTL_SECONDS: optionalNumberEnv(300),
  OPENAI_API_KEY: optionalEnv,
  OPENAI_CHAT_MODEL: z.string().min(1).default("gpt-4o-mini"),
  OPENAI_EMBEDDING_MODEL: z.string().min(1).default("text-embedding-3-small"),
  PINECONE_API_KEY: optionalEnv,
  PINECONE_INDEX: optionalEnv,
  PINECONE_NAMESPACE: z.string().min(1).default("events"),
  SOCKET_ORIGIN: optionalEnv,
  GOOGLE_CLIENT_ID: optionalEnv,
  GOOGLE_CLIENT_SECRET: optionalEnv,
  CLOUDINARY_CLOUD_NAME: optionalEnv,
  CLOUDINARY_API_KEY: optionalEnv,
  CLOUDINARY_API_SECRET: optionalEnv,
  SEED_ADMIN_EMAIL: z.string().email().default("admin@tixora.local"),
  SEED_ADMIN_PASSWORD: z.string().min(10).default("ChangeMe123!"),
  SMTP_USER: z.string().email().optional(),
  SMTP_PASS: z.string().optional(),
});

const parsedEnv = envSchema.safeParse({
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "https://localhost:3000",
  REDIS_URL: process.env.REDIS_URL,
  SEAT_LOCK_TTL_SECONDS: process.env.SEAT_LOCK_TTL_SECONDS,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_CHAT_MODEL: process.env.OPENAI_CHAT_MODEL ?? "gpt-4o-mini",
  OPENAI_EMBEDDING_MODEL: process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small",
  PINECONE_API_KEY: process.env.PINECONE_API_KEY,
  PINECONE_INDEX: process.env.PINECONE_INDEX,
  PINECONE_NAMESPACE: process.env.PINECONE_NAMESPACE ?? "events",
  SOCKET_ORIGIN: process.env.SOCKET_ORIGIN,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  SEED_ADMIN_EMAIL: process.env.SEED_ADMIN_EMAIL ?? "admin@tixora.local",
  SEED_ADMIN_PASSWORD: process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!",
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
});

if (!parsedEnv.success) {
  const message = parsedEnv.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");

  throw new Error(`Invalid environment variables: ${message}`);
}

export const env = parsedEnv.data;
