# Cloudflare Turnstile Bot Protection Setup

This guide explains how to set up Cloudflare Turnstile for bot protection on public booking and lookup forms.

---

## What is Turnstile?

Cloudflare Turnstile is a free bot protection service that:
- ✅ Prevents automated form submission abuse
- ✅ Protects against credential stuffing
- ✅ Stops scrapers from harvesting data
- ✅ Free tier includes up to 1M challenges/month
- ✅ Privacy-focused (no tracking, GDPR compliant)

---

## Step 1: Sign Up for Turnstile

1. Go to **https://dash.cloudflare.com/sign-up**
2. Create account (or login if you have one)
3. Go to **Turnstile** (in left sidebar under Security)
4. Click **Create Site**

---

## Step 2: Configure Site

**Form:**
- **Site name:** `londile-shuttle` (or any name)
- **Domain:** `localhost:3000` (for local testing)
- **Turnstile Mode:** 
  - ✅ **Managed** (recommended - Cloudflare decides if challenge needed)
  - Alternative: **Invisible** (silently checks)

Click **Create**

---

## Step 3: Get Your Keys

After creation, you'll see:
```
Site Key (Public):   xxxxxxxxxxxxxxxx
Secret Key (Private): xxxxxxxxxxxxxxxx
```

**Keep these safe!**
- **Site Key:** Used in browser (visible in HTML)
- **Secret Key:** Used on server (NEVER expose to client)

---

## Step 4: Add to Environment Variables

### Local Development (.env.local)

```bash
# Turnstile (Bot Protection)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=xxxxxxxxxxxxxxxx
TURNSTILE_SECRET_KEY=xxxxxxxxxxxxxxxx
```

### Vercel Deployment

1. Go to Vercel project → **Settings** → **Environment Variables**
2. Add two variables:

**Variable 1 (Public):**
```
Name: NEXT_PUBLIC_TURNSTILE_SITE_KEY
Value: xxxxxxxxxxxxxxxx
Environments: Production, Preview, Development
```

**Variable 2 (Secret):**
```
Name: TURNSTILE_SECRET_KEY
Value: xxxxxxxxxxxxxxxx
Environments: Production, Preview, Development
```

3. Redeploy

---

## How It Works

### User Flow (Client-Side)

```
1. User fills booking form
2. Turnstile widget loads (checkbox or invisible)
3. User clicks "I'm not a robot" (or auto-verifies)
4. Browser gets verification token
5. User clicks "Confirm Booking"
6. Token sent to server
```

### Server Verification (Backend)

```
1. Server receives form + Turnstile token
2. Server calls Cloudflare API to verify token
3. Token is valid? ✅ Process booking
4. Token invalid/expired? ❌ Reject with 403
```

---

## Where Turnstile is Used

### 1. Booking Creation Form
**File:** `src/components/BookingForm.tsx`

- Turnstile widget renders before submit button
- Token required before submission
- Server verifies in `POST /api/bookings/create`

### 2. Booking Lookup Form
**File:** `src/components/BookingLookupForm.tsx`

- Guests search bookings without login
- Turnstile prevents automated lookup attacks
- Server verifies in `POST /api/bookings/lookup`

---

## Implementation Details

### Client-Side (React Component)

```typescript
import Turnstile from "react-turnstile";

<Turnstile
  sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
  onSuccess={(token) => setTurnstileToken(token)}
  onError={() => handleError()}
  theme="light"
/>
```

### Server-Side (API Route)

```typescript
import { verifyTurnstileToken } from "@/lib/turnstile";

const verification = await verifyTurnstileToken(token, clientIp);
if (!verification.success) {
  return NextResponse.json(
    { error: "Bot verification failed" },
    { status: 403 }
  );
}
```

---

## Testing Locally

### Test Valid Flow

```bash
npm run dev
# Visit http://localhost:3000/book
# Fill form and submit
# Should succeed if token is valid
```

### Test Invalid Token

Remove Turnstile widget from component (set `sitekey=""`)
Try to submit → Should get 403 error
This verifies server-side verification works!

### In Development Mode

If `TURNSTILE_SECRET_KEY` is missing:
- Development: Requests are **allowed** (for testing)
- Production: Requests are **blocked**

This is helpful for local development without needing keys set.

---

## Monitoring

### Cloudflare Dashboard

1. Go to **Turnstile** → Your site
2. See real-time stats:
   - Challenges issued
   - Success/failure rates
   - Blocked requests
   - Verification performance

### Application Logs

Turnstile errors are logged:
```
[Turnstile verification error]: ...
```

Check logs if:
- Widget isn't showing
- Tokens are always failing
- Server-side verification errors

---

## Troubleshooting

### Widget Not Showing

**Cause:** Missing or incorrect Site Key

**Fix:**
```bash
# Verify .env.local has NEXT_PUBLIC_TURNSTILE_SITE_KEY
echo $NEXT_PUBLIC_TURNSTILE_SITE_KEY

# Restart dev server
npm run dev
```

### "Token verification failed" on Valid Submission

**Cause 1:** Secret key is wrong or missing

**Fix:**
```bash
# Check .env.local has correct TURNSTILE_SECRET_KEY
echo $TURNSTILE_SECRET_KEY

# Verify it matches Cloudflare dashboard
```

**Cause 2:** Token expired (valid for ~5 minutes)

**Fix:**
- User waits too long before submitting
- Toast message tells them to try again

### Token Works Locally but Fails in Production

**Cause:** Vercel doesn't have environment variables set

**Fix:**
1. Go to Vercel → Settings → Environment Variables
2. Add both variables (Site Key + Secret Key)
3. Redeploy

### High Failure Rate

**Cause:** May indicate:
- Bot attack (good! Turnstile is working)
- Legitimate users having issues
- Token timing issues

**Action:**
- Monitor in Cloudflare dashboard
- Check application logs for errors
- Consider raising report to Cloudflare

---

## Cost

### Free Tier (Included)
- ✅ 1M challenges/month
- ✅ Unlimited verification requests
- ✅ All challenge types
- Suitable for small to medium apps

### If You Scale
- 1-10M challenges/month: $1.50/100k
- 10M+ challenges/month: Custom pricing

**Estimate for Londile Shuttle:**
- 100 daily users × 5 bookings = 500 challenges/day
- 500 × 30 days = 15,000/month
- **Cost: $0 (well under 1M free limit)**

---

## Security Notes

⚠️ **CRITICAL:**
- **Site Key:** Safe to expose (needed in browser)
- **Secret Key:** NEVER expose in frontend code
- **Always verify on server** - Client-side token means nothing without server verification

✅ **Best Practices:**
- Store Secret Key in `.env.local` (git-ignored)
- Use Vercel Environment Variables for production
- Rotate keys periodically
- Monitor for suspicious activity

---

## Next Steps

1. ✅ Sign up for Cloudflare (free)
2. ✅ Create Turnstile site
3. ✅ Add Site Key to `.env.local`
4. ✅ Add Secret Key to `.env.local`
5. ✅ Restart `npm run dev`
6. ✅ Test booking form (widget should appear)
7. ✅ Add to Vercel environment variables
8. ✅ Redeploy to production

---

## Support

**Cloudflare Turnstile Docs:** https://developers.cloudflare.com/turnstile/

**Getting Help:**
- Widget not showing: Check browser console for errors
- Verification failing: Check Turnstile dashboard for blocked IPs
- Questions: Cloudflare community forum

---

**Version:** 1.0  
**Status:** Ready for deployment  
**Last Updated:** August 2026
