import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  SEED_ADMIN_EMAIL: z.string().email().default("admin@tixora.local"),
  SEED_ADMIN_PASSWORD: z.string().min(10).default("ChangeMe123!")
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  SEED_ADMIN_EMAIL: process.env.SEED_ADMIN_EMAIL ?? "admin@tixora.local",
  SEED_ADMIN_PASSWORD: process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!"
});
