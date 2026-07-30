export function requestBodyExceeds(request: Request, maxBytes: number) {
  const contentLength = request.headers.get("content-length");
  if (!contentLength) return false;
  const bytes = Number(contentLength);
  return Number.isFinite(bytes) && bytes > maxBytes;
}

type RateLimitBucket = { count: number; resetAt: number };
const rateLimitBuckets = new Map<string, RateLimitBucket>();

function requestClientKey(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip")?.trim() || "anonymous";
}

export function consumeRequestRateLimit(request: Request, name: string, max: number, windowMs: number) {
  const now = Date.now();
  const key = `${name}:${requestClientKey(request)}`;
  const current = rateLimitBuckets.get(key);
  if (!current || current.resetAt <= now) {
    if (rateLimitBuckets.size > 5_000) {
      for (const [bucketKey, bucket] of rateLimitBuckets) if (bucket.resetAt <= now) rateLimitBuckets.delete(bucketKey);
    }
    rateLimitBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: Math.ceil(windowMs / 1_000) };
  }
  current.count += 1;
  return { allowed: current.count <= max, retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1_000)) };
}

export function requestHasSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export function rateLimitHeaders(retryAfter: number) {
  return { "retry-after": String(retryAfter), "cache-control": "no-store" };
}

export function requestHasJsonContentType(request: Request) {
  const contentType = request.headers.get("content-type");
  if (!contentType) return false;
  return contentType.split(";")[0]?.trim().toLowerCase() === "application/json";
}

export async function readJsonBody(request: Request): Promise<unknown | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
