"use client";

import { supabase } from "@/lib/supabase";

type CacheEntry = {
  url: string;
  expiresAt: number;
};

const SIGNED_URL_SECONDS = 60 * 60;
const CACHE_SAFE_MS = 50 * 60 * 1000;
const MAX_CACHE_ENTRIES = 1200;

const cache = new Map<string, CacheEntry>();

function keyOf(bucket: string, path: string) {
  return `${bucket}::${path}`;
}

function pruneCache() {
  const now = Date.now();

  for (const [key, entry] of cache) {
    if (entry.expiresAt <= now) {
      cache.delete(key);
    }
  }

  if (cache.size <= MAX_CACHE_ENTRIES) {
    return;
  }

  const overflow = cache.size - MAX_CACHE_ENTRIES;

  for (const key of Array.from(cache.keys()).slice(0, overflow)) {
    cache.delete(key);
  }
}

export async function getSignedMediaUrlMap(
  bucket: string,
  paths: string[]
) {
  pruneCache();

  const unique = [...new Set(paths.filter(Boolean))];

  if (!unique.length) {
    return new Map<string, string>();
  }

  const now = Date.now();
  const result = new Map<string, string>();
  const missing: string[] = [];

  for (const mediaPath of unique) {
    const cached = cache.get(
      keyOf(bucket, mediaPath)
    );

    if (
      cached &&
      cached.expiresAt > now &&
      cached.url
    ) {
      result.set(mediaPath, cached.url);
    } else {
      missing.push(mediaPath);
    }
  }

  if (!missing.length) {
    return result;
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrls(
      missing,
      SIGNED_URL_SECONDS
    );

  if (error) {
    console.error(
      `[Alumni signed media cache] ${bucket}:`,
      error
    );
    return result;
  }

  const expiresAt = Date.now() + CACHE_SAFE_MS;

  for (const item of data || []) {
    if (!item.path || !item.signedUrl) {
      continue;
    }

    cache.set(
      keyOf(bucket, item.path),
      {
        url: item.signedUrl,
        expiresAt,
      }
    );

    result.set(
      item.path,
      item.signedUrl
    );
  }

  pruneCache();

  return result;
}

/* ALUMNI_PERFORMANCE_HARDENING_SIGNED_MEDIA_CACHE_V4 */
