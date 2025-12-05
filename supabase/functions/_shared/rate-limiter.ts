/**
 * Rate Limiting Utility for Edge Functions
 * Prevents abuse and DoS attacks
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
}

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60000, // 1 minute
  maxRequests: 10,
};

// In-memory store (consider using Deno KV for production)
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Check if request should be rate limited
 * Returns true if request is allowed, false if rate limited
 */
export function checkRateLimit(
  identifier: string,
  config: Partial<RateLimitConfig> = {}
): { allowed: boolean; remaining: number; resetAt: number } {
  const { windowMs, maxRequests } = { ...DEFAULT_CONFIG, ...config };
  const now = Date.now();
  const limit = rateLimitStore.get(identifier);

  // No existing entry or window expired - allow request
  if (!limit || now > limit.resetAt) {
    const resetAt = now + windowMs;
    rateLimitStore.set(identifier, { count: 1, resetAt });

    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt,
    };
  }

  // Check if limit exceeded
  if (limit.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: limit.resetAt,
    };
  }

  // Increment and allow
  limit.count++;
  return {
    allowed: true,
    remaining: maxRequests - limit.count,
    resetAt: limit.resetAt,
  };
}

/**
 * Create rate limit exceeded response
 */
export function createRateLimitResponse(
  resetAt: number,
  corsHeaders: Record<string, string>
): Response {
  const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);

  return new Response(
    JSON.stringify({
      success: false,
      message: "Rate limit exceeded. Please try again later.",
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Retry-After": String(retryAfter),
        "X-RateLimit-Limit": String(DEFAULT_CONFIG.maxRequests),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(Math.floor(resetAt / 1000)),
      },
    }
  );
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
  headers: Record<string, string>,
  remaining: number,
  resetAt: number,
  maxRequests: number = DEFAULT_CONFIG.maxRequests
): Record<string, string> {
  return {
    ...headers,
    "X-RateLimit-Limit": String(maxRequests),
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Reset": String(Math.floor(resetAt / 1000)),
  };
}

/**
 * Get identifier from request (IP address or user ID)
 */
export function getRequestIdentifier(req: Request, userId?: string | null): string {
  if (userId) {
    return `user:${userId}`;
  }

  // Try to get IP from headers
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return `ip:${forwardedFor.split(",")[0].trim()}`;
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return `ip:${realIp}`;
  }

  // Fallback to a generic identifier
  return "unknown";
}

/**
 * Clean up expired entries (call periodically)
 */
export function cleanupRateLimitStore(): number {
  const now = Date.now();
  let cleaned = 0;

  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(key);
      cleaned++;
    }
  }

  return cleaned;
}

// Clean up every 5 minutes
setInterval(() => {
  cleanupRateLimitStore();
}, 5 * 60 * 1000);
