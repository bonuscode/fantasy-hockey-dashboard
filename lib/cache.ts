import fs from "fs";
import path from "path";

const CACHE_DIR = path.join(process.cwd(), ".cache");

interface CacheEntry<T> {
  value: T;
  expiry: number;
}

export function getCache<T>(key: string): T | null {
  const filePath = path.join(CACHE_DIR, `${key}.json`);
  if (!fs.existsSync(filePath)) return null;

  const data: CacheEntry<T> = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  if (Date.now() > data.expiry) {
    fs.unlinkSync(filePath);
    return null;
  }
  return data.value;
}

export function setCache<T>(key: string, value: T, ttlSeconds: number): void {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }

  const filePath = path.join(CACHE_DIR, `${key}.json`);
  const data: CacheEntry<T> = {
    value,
    expiry: Date.now() + ttlSeconds * 1000,
  };
  fs.writeFileSync(filePath, JSON.stringify(data));
}
