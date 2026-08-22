import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Rate Limiting Utility
 *
 * Uses Upstash Redis to track requests per IP address
 * Prevents API abuse and DDoS attacks
 *
 * Environment variables required:
 * - UPSTASH_REDIS_REST_URL
 * - UPSTASH_REDIS_REST_TOKEN
 */

// Initialize Redis connection (cached to avoid recreating)
let redis: Redis | null = null;

function getRedis(): Redis {
  if (!redis) {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      throw new Error(
        "Missing Upstash Redis configuration. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN"
      );
    }

    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }

  return redis;
}

/**
 * Create a rate limiter with custom limits
 * @param identifier - Unique key (e.g., IP address, user ID)
 * @param limit - Max requests allowed
 * @param windowMs - Time window in milliseconds
 */
export async function rateLimit(
  identifier: string,
  limit: number,
  windowMs: number
) {
  const ratelimit = new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(limit, `${windowMs}ms`),
    analytics: true,
    prefix: "rate-limit",
  });

  return await ratelimit.limit(identifier);
}

/**
 * Pre-configured rate limiters for different endpoints
 */

/**
 * Booking creation: 10 requests per hour per IP
 * (Reasonable limit for legitimate users)
 */
export const bookingRateLimit = (ip: string) =>
  rateLimit(ip, 10, 60 * 60 * 1000); // 10/hour

/**
 * Booking lookup: 20 requests per minute per IP
 * (Higher limit - guests checking status multiple times)
 */
export const bookingLookupRateLimit = (ip: string) =>
  rateLimit(ip, 20, 60 * 1000); // 20/minute

/**
 * Quote/pricing request: 50 requests per minute per IP
 * (No sensitive data, can be more generous)
 */
export const quoteRateLimit = (ip: string) =>
  rateLimit(ip, 50, 60 * 1000); // 50/minute

/**
 * Auth endpoints: 5 attempts per 15 minutes per IP
 * (Strict limit to prevent brute force)
 */
export const authRateLimit = (ip: string) =>
  rateLimit(ip, 5, 15 * 60 * 1000); // 5/15min

/**
 * Extract client IP from request headers
 * Handles proxies (Vercel, Cloudflare, etc.)
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  // Fallback (less reliable)
  return request.headers.get("cf-connecting-ip") || "unknown";
}

/**
 * Check rate limit and return appropriate response
 */
export async function checkRateLimit(
  rateLimitPromise: Promise<any>,
  context: string = "API"
): Promise<{ allowed: boolean; headers?: Record<string, string> }> {
  try {
    const result = await rateLimitPromise;

    // Add rate limit info to response headers
    const headers = {
      "X-RateLimit-Limit": result.limit.toString(),
      "X-RateLimit-Remaining": result.remaining.toString(),
      "X-RateLimit-Reset": new Date(result.resetAfterMs).toISOString(),
    };

    if (!result.success) {
      return {
        allowed: false,
        headers: {
          ...headers,
          "Retry-After": Math.ceil(result.resetAfterMs / 1000).toString(),
        },
      };
    }

    return { allowed: true, headers };
  } catch (error) {
    console.error(`Rate limit check failed for ${context}:`, error);
    // SECURITY: Fail closed - if rate limiter unavailable, reject requests
    // Prevents DDoS if Upstash goes down
    // Better to block requests than to lose rate limiting protection
    return {
      allowed: false,
      headers: {
        "Retry-After": "60",
      },
    };
  }
}
