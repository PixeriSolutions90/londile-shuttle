# Rate Limiting Setup Guide

This guide explains how to set up Upstash Redis for rate limiting your Londile Shuttle API.

---

## Overview

Rate limiting protects your API from:
- **Abuse:** Users making excessive requests
- **DDoS attacks:** Malicious traffic flooding your servers
- **Scraping:** Bots harvesting your data
- **Brute force:** Automated login attempts

**Current limits:**
- Booking creation: 10 requests/hour per IP
- Booking lookup: 20 requests/minute per IP
- Quote requests: 50 requests/minute per IP
- Auth attempts: 5 attempts/15 minutes per IP

---

## Step 1: Create Upstash Account

1. Go to **https://upstash.com**
2. Click **Sign Up**
3. Create account (free tier available)
4. Verify email

---

## Step 2: Create Redis Database

1. Log in to Upstash console
2. Click **Create Database**
3. Choose:
   - **Name:** `londile-shuttle` (or any name)
   - **Region:** Select closest to your users (e.g., EU, US)
   - **Type:** Redis
4. Click **Create**

**Upstash free tier includes:**
- ✅ Up to 10,000 commands/day
- ✅ Low latency
- ✅ Auto-scaling
- Enough for small-to-medium apps

---

## Step 3: Get Credentials

After database creation, you'll see:

```
UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxxxxxxxxxx
```

**Keep these secret!** They control access to your database.

---

## Step 4: Add to Environment Variables

### Local Development (.env.local)
```bash
UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxxxxxxxxxx
```

### Vercel Deployment
1. Go to Vercel project settings
2. Environment Variables
3. Add:
   - Name: `UPSTASH_REDIS_REST_URL`
   - Value: `https://xxxxx.upstash.io`
4. Add:
   - Name: `UPSTASH_REDIS_REST_TOKEN`
   - Value: `xxxxxxxxxxx`
5. Select: Production, Preview, Development
6. Redeploy

---

## Step 5: Test It Works

### Test Locally
```bash
npm run dev
```

Then make requests to `/api/bookings/create`:
```bash
# Request 1-10: Should succeed
curl -X POST http://localhost:3000/api/bookings/create \
  -H "Content-Type: application/json" \
  -d '{ ... booking data ... }'

# Request 11 (within 1 hour): Should return 429 Too Many Requests
curl -X POST http://localhost:3000/api/bookings/create \
  -H "Content-Type: application/json" \
  -d '{ ... booking data ... }'
```

**Expected response on rate limit:**
```json
{
  "error": "Too many booking requests",
  "message": "You have made too many booking requests in the last hour. Please try again later.",
  "retryAfter": "3599"
}
```

HTTP Status: **429 Too Many Requests**

### Test on Vercel
```bash
# After deploying to Vercel
curl -X POST https://your-app.vercel.app/api/bookings/create \
  -H "Content-Type: application/json" \
  -d '{ ... booking data ... }'
```

---

## Rate Limit Headers

Every API response includes rate limit info:

```
X-RateLimit-Limit: 10          (max requests allowed)
X-RateLimit-Remaining: 3       (requests left this window)
X-RateLimit-Reset: 2026-08-22T14:30:00Z  (when limit resets)
Retry-After: 3599              (seconds to wait, if rate limited)
```

**Client can use this to show users:**
```
"You have 3 requests left. Limit resets in 55 minutes."
```

---

## Current Rate Limits

### Booking Creation
- **Limit:** 10 requests/hour per IP
- **Reason:** Prevent abuse, avoid duplicate bookings
- **Error:** 429 "Too many booking requests"

**Example:**
- User books at 1:00 PM ✅
- User books at 1:05 PM ✅
- ... (10 bookings max in 1 hour)
- User books at 2:10 PM ✅ (1st booking expired)

### Booking Lookup
- **Limit:** 20 requests/minute per IP
- **Reason:** Guests checking booking status
- **Error:** 429 "Too many requests"

**Example:**
- Guest lookup at 1:00:00 PM ✅
- Guest lookup at 1:00:05 PM ✅
- ... (20 lookups per minute)

### Quote/Pricing
- **Limit:** 50 requests/minute per IP
- **Reason:** No sensitive data, can be generous

### Auth (Login)
- **Limit:** 5 attempts/15 minutes per IP
- **Reason:** Prevent brute force attacks

**Example:**
- Wrong password at 1:00 PM ✅ (1/5)
- Wrong password at 1:00:30 PM ✅ (2/5)
- Wrong password at 1:01 PM ✅ (3/5)
- Wrong password at 1:01:30 PM ✅ (4/5)
- Wrong password at 1:02 PM ✅ (5/5)
- Wrong password at 1:02:30 PM ❌ "Too many attempts" (429)
- Wait 13 more minutes → Can try again

---

## How Rate Limiting Works

### Request Flow

```
1. Client sends request
    ↓
2. Server extracts client IP
    ↓
3. Check Upstash Redis: "Has this IP exceeded limit?"
    ↓
4a. Within limit: Process request normally
    ↓
4b. Over limit: Return 429 + rate limit headers
    ↓
5. Continue tracking in Redis (expires after window)
```

### IP Detection

Rate limiting uses client IP from:
1. **X-Forwarded-For header** (Vercel, Cloudflare)
2. **X-Real-IP header** (Nginx)
3. **CF-Connecting-IP** (Cloudflare)
4. Fallback: "unknown"

**Why:** Correctly identifies users behind proxies

---

## Customizing Limits

To change limits, edit `src/lib/rate-limit.ts`:

```typescript
// Current: 10 per hour
export const bookingRateLimit = (ip: string) =>
  rateLimit(ip, 10, 60 * 60 * 1000);

// Change to: 20 per hour
export const bookingRateLimit = (ip: string) =>
  rateLimit(ip, 20, 60 * 60 * 1000);

// Or: 5 per 30 minutes
export const bookingRateLimit = (ip: string) =>
  rateLimit(ip, 5, 30 * 60 * 1000);
```

**Format:**
```
rateLimit(ip, LIMIT, WINDOW_MS)

LIMIT = number of requests allowed
WINDOW_MS = time window in milliseconds
  - 1 minute = 60 * 1000
  - 1 hour = 60 * 60 * 1000
  - 1 day = 24 * 60 * 60 * 1000
```

---

## Monitoring Rate Limiting

### In Upstash Console

1. Log in to https://upstash.com
2. Go to your database
3. Click **Stats** tab
4. View:
   - Total commands
   - Commands per second
   - Error rate

### In Application Logs

Rate limit checks log to:
- `src/lib/rate-limit.ts` - Rate limit utility logs

Watch for:
```
Rate limit check failed for booking-create
```

This means Redis connection failed. The app will **allow the request** (fail-open policy).

---

## Troubleshooting

### Issue: "Missing Upstash Redis configuration"

**Cause:** Environment variables not set

**Fix:**
1. Verify `.env.local` has both variables
2. Verify Vercel environment variables are set
3. Redeploy if just added to Vercel

### Issue: All requests getting 429 (rate limited)

**Cause 1:** Shared IP address (office, mobile hotspot)
- Many users on same network count as 1 IP
- Limit is per-IP, not per-user
- **Solution:** Adjust limits higher, or use user-based limiting

**Cause 2:** Upstash quota exceeded (free tier limit)
- Free tier: 10,000 commands/day
- **Solution:** Upgrade to paid plan, or optimize rate limit checking

### Issue: "Connection refused" to Upstash

**Cause:** Network issue or wrong credentials

**Fix:**
1. Check credentials in Upstash console
2. Verify environment variables are correct
3. Check firewall (Upstash allows all IPs by default)
4. Test with: `upstash-cli dbsize` (if CLI installed)

### Issue: Rate limiting not working (all requests pass)

**Cause 1:** Rate limit check failed silently
- App logs will show: "Rate limit check failed"
- **Solution:** Check Redis connection

**Cause 2:** Upstash free tier limit reached
- **Solution:** Upgrade plan or wait for daily reset

---

## Best Practices

### 1. Set Reasonable Limits
- Too strict: Users frustrated
- Too loose: Abuse likely
- **Goal:** 99% of legitimate users under limit

### 2. Provide Clear Error Messages
- Tell user: WHY they're limited
- Tell user: WHEN they can try again (Retry-After header)
- Be friendly: "Please wait a moment..."

### 3. Monitor Usage
- Check Upstash stats weekly
- Watch for spikes (possible abuse)
- Adjust limits based on usage patterns

### 4. Handle Rate Limit Failures Gracefully
- If Upstash is down, allow requests (fail-open)
- Better to serve degraded than block everything
- Log failures for investigation

### 5. IP-Based + User-Based Limits (Future)
```typescript
// Current: IP-based
const id = getClientIp(request);

// Future: User-based for authenticated users
const userId = session?.user?.id || getClientIp(request);
```

---

## Cost Estimation

### Upstash Free Tier
- **Cost:** Free
- **Limit:** 10,000 commands/day
- **Suitable for:** Small apps, dev/test

### Estimate Your Usage
```
Requests per day = Active users × Requests per user

Example:
- 100 active users
- 20 requests per user per day
= 2,000 requests/day

Each request = 1 command to Redis
Total: 2,000 commands/day (well under 10,000 limit)
```

### When to Upgrade
- When hitting free tier limit
- For production apps with 1,000+ users
- **Pro Tier:** ~$20/month for 1M commands/month

---

## Security Notes

⚠️ **NEVER:**
- Commit Upstash credentials to Git
- Share tokens in emails
- Expose in client-side code

✅ **DO:**
- Use `.env.local` for local development
- Use Vercel Environment Variables for production
- Rotate tokens if compromised
- Use different tokens for different environments

---

## Integration with Other Features

Rate limiting is implemented on:
- ✅ POST `/api/bookings/create` - Guest bookings (10/hour)
- ✅ POST `/api/bookings/lookup` - Booking search (20/minute)
- ❌ POST `/api/roles/request-agent` - TODO
- ❌ POST `/api/roles/review-request` - TODO (admin only, stricter)
- ❌ POST `/api/roles/assign` - TODO (admin only, stricter)
- ❌ Auth endpoints - TODO

---

## Deployment Checklist

Before deploying to production:

- [ ] Upstash account created
- [ ] Redis database created
- [ ] Credentials copied
- [ ] `.env.local` has credentials (local)
- [ ] Vercel environment variables set (production)
- [ ] Test rate limiting works locally
- [ ] Deployed to Vercel
- [ ] Test rate limiting on Vercel
- [ ] Monitored Upstash stats

---

## Support

**Upstash Documentation:** https://upstash.com/docs

**Issues:**
- Rate limiting not working: Check Upstash connection
- Limits too strict: Adjust in `src/lib/rate-limit.ts`
- Need custom logic: Add new rate limiter (see file)

---

**Version:** 1.0  
**Last Updated:** August 2026  
**Status:** Ready for production
