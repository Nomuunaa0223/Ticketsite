import Redis from "ioredis";
import { env } from "@/lib/env";

type CacheEntry = {
  value: string;
  expiresAt: number;
};

const memoryCache = new Map<string, CacheEntry>();

type GlobalWithRedis = typeof globalThis & {
  tixoraRedis?: Redis;
};

const globalForRedis = globalThis as GlobalWithRedis;

export const redis =
  env.REDIS_URL
    ? globalForRedis.tixoraRedis ?? new Redis(env.REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 1 })
    : null;

if (redis && process.env.NODE_ENV !== "production") {
  globalForRedis.tixoraRedis = redis;
}

async function ensureRedisConnected() {
  if (!redis) return null;
  try {
    if (redis.status === "wait" || redis.status === "end") {
      await redis.connect();
    }
    return redis;
  } catch (error) {
    console.warn("[redis] falling back to in-memory cache", error);
    return null;
  }
}

function readMemory(key: string) {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    memoryCache.delete(key);
    return null;
  }
  return entry.value;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const client = await ensureRedisConnected();
  const value = client ? await client.get(key) : readMemory(key);
  if (!value) return null;

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export async function cacheMGet<T>(keys: string[]): Promise<Array<T | null>> {
  if (keys.length === 0) return [];

  const client = await ensureRedisConnected();
  const values = client ? await client.mget(...keys) : keys.map((key) => readMemory(key));

  return (values ?? []).map((value) => {
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  });
}

export async function cacheSet<T>(key: string, value: T, ttlSeconds: number) {
  const payload = JSON.stringify(value);
  const client = await ensureRedisConnected();
  if (client) {
    await client.set(key, payload, "EX", ttlSeconds);
    return;
  }

  memoryCache.set(key, { value: payload, expiresAt: Date.now() + ttlSeconds * 1000 });
}

export async function cacheSetNx<T>(key: string, value: T, ttlSeconds: number) {
  const payload = JSON.stringify(value);
  const client = await ensureRedisConnected();
  if (client) {
    const result = await client.set(key, payload, "EX", ttlSeconds, "NX");
    return result === "OK";
  }

  if (readMemory(key)) return false;
  memoryCache.set(key, { value: payload, expiresAt: Date.now() + ttlSeconds * 1000 });
  return true;
}

export async function cacheDel(...keys: string[]) {
  if (keys.length === 0) return;
  const client = await ensureRedisConnected();
  if (client) {
    await client.del(...keys);
    return;
  }

  for (const key of keys) {
    memoryCache.delete(key);
  }
}

export function getCacheStatus() {
  return {
    provider: redis ? "redis" : "memory",
    enabled: Boolean(redis)
  };
}
