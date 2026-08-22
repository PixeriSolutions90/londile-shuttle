# Security Headers Configuration

This document explains the security headers configured in Next.js (`next.config.ts`).

---

## Overview

Security headers protect against common web vulnerabilities:
- **XSS** - Cross-Site Scripting injection attacks
- **Clickjacking** - Embedding your site in malicious frames
- **MIME sniffing** - Tricking browsers into executing wrong content types
- **Man-in-the-middle** - Forcing HTTPS everywhere

All headers are automatically sent on every response from your Vercel deployment.

---

## Headers Configured

### 1. Strict-Transport-Security (HSTS)
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

**What it does:**
- Forces browser to always use HTTPS
- Prevents downgrade attacks (HTTP → HTTPS)
- Valid for 1 year (31536000 seconds)
- Includes subdomains

**Impact:**
- ✅ Secure - Vercel provides HTTPS automatically
- ⚠️ Once set: Browsers will reject HTTP for 1 year
  - If you need HTTP: Remove or reduce max-age

---

### 2. Content-Security-Policy (CSP)
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com; ...
```

**What it does:**
- Restricts where resources (scripts, styles, images) can load from
- Prevents XSS by blocking inline scripts unless whitelisted
- Blocks eval() unless explicitly allowed

**Directives:**
| Directive | Allows | Purpose |
|-----------|--------|---------|
| `default-src 'self'` | Same origin only | Default fallback |
| `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com` | Self + inline + Cloudflare | Next.js + Turnstile need this |
| `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com` | Self + Google Fonts | CSS styling |
| `img-src 'self' data: https:` | Self + data URIs + HTTPS | Images |
| `font-src 'self' data: https://fonts.gstatic.com` | Self + Google Fonts | Web fonts |
| `connect-src 'self' https://upstash.io ...` | API calls to Upstash, Cloudflare, Vercel | Fetch, WebSocket |
| `frame-src 'self' https://challenges.cloudflare.com` | Self + Cloudflare | iframes (Turnstile) |
| `frame-ancestors 'none'` | Block all framing | Prevent clickjacking |
| `base-uri 'self'` | Same origin | Prevent base tag injection |
| `form-action 'self'` | Same origin | Form submissions only to self |
| `upgrade-insecure-requests` | Auto-upgrade HTTP to HTTPS | Force HTTPS |

**Why `unsafe-inline` and `unsafe-eval`?**
- ⚠️ Not ideal for production, but required by Next.js
- Next.js injects scripts inline (hydration, hot reload)
- Consider using nonce-based CSP in future for stricter control

---

### 3. X-Frame-Options
```
X-Frame-Options: DENY
```

**What it does:**
- Prevents your site from being embedded in iframes
- Stops clickjacking attacks (malicious overlay)

**Options:**
- `DENY` - Can't be framed anywhere
- `SAMEORIGIN` - Can be framed by same origin only
- `ALLOW-FROM uri` - Can be framed by specific URI (deprecated)

**We use:** `DENY` (most restrictive)

**Impact:**
- ✅ Secure - Your site can't be framed
- ❌ If you need iframes elsewhere: Change to `SAMEORIGIN`

---

### 4. X-Content-Type-Options
```
X-Content-Type-Options: nosniff
```

**What it does:**
- Forces browser to respect declared content type
- Prevents MIME type sniffing attacks

**Example:**
```
Without nosniff:
- Server says: "this is text/plain"
- Browser sees: "looks like JavaScript"
- Browser executes it ❌

With nosniff:
- Server says: "this is text/plain"
- Browser trusts it and renders as text ✅
```

---

### 5. X-XSS-Protection
```
X-XSS-Protection: 1; mode=block
```

**What it does:**
- Enables browser's built-in XSS filter
- Blocks page if XSS detected

**Note:** Modern CSP is more effective, but this adds defense-in-depth.

---

### 6. Referrer-Policy
```
Referrer-Policy: strict-origin-when-cross-origin
```

**What it does:**
- Controls what referrer info is sent to other sites
- Prevents leaking your URL query parameters to third parties

**Values:**
- `strict-origin-when-cross-origin` - Send only origin for cross-origin requests
- Prevents query string leaks (e.g., `?userId=123`)

---

### 7. Permissions-Policy
```
Permissions-Policy: accelerometer=(), ambient-light-sensor=(), camera=(), geolocation=(), ...
```

**What it does:**
- Restricts browser feature access (camera, microphone, location)
- Prevents malicious code from accessing device hardware

**Enabled features:**
- None (all disabled with empty parentheses `()`)

**If you need geolocation:**
```
geolocation=(self "https://trusted-domain.com")
```

---

### 8. Cross-Origin Policies
```
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
```

**What they do:**
- Isolate your site from other origins
- Prevent Spectre/Meltdown side-channel attacks
- Enforce same-origin for resources

---

## Verification

### Test with securityheaders.com

After deployment:

1. Go to **https://securityheaders.com**
2. Enter your domain: `https://londile-shuttle.vercel.app`
3. View report

**Expected results:**
- ✅ A+ or A grade
- ✅ All tested headers present
- ⚠️ CSP may show warnings (due to `unsafe-inline` necessity)

### Manual Testing (Browser DevTools)

```javascript
// Open browser console and check response headers
fetch('https://londile-shuttle.vercel.app')
  .then(r => {
    console.log('Strict-Transport-Security:', r.headers.get('Strict-Transport-Security'));
    console.log('Content-Security-Policy:', r.headers.get('Content-Security-Policy'));
    console.log('X-Frame-Options:', r.headers.get('X-Frame-Options'));
  });
```

---

## What Each Header Protects Against

| Attack | Header | Protection |
|--------|--------|-----------|
| MITM (downgrade to HTTP) | HSTS | Force HTTPS |
| XSS injection | CSP | Block malicious scripts |
| Clickjacking | X-Frame-Options | Prevent framing |
| MIME sniffing | X-Content-Type-Options | Trust content-type |
| Browser XSS filter bypass | X-XSS-Protection | Enable filter |
| Referrer leaks | Referrer-Policy | Hide query params |
| Malicious feature access | Permissions-Policy | Disable features |
| Spectre/Meltdown | CORP/COEP/COOP | Isolate site |

---

## For Future Reference

### If You Need to Allow Something

**Example: Allow YouTube iframes**

Current:
```
frame-src 'self' https://challenges.cloudflare.com
```

Change to:
```
frame-src 'self' https://challenges.cloudflare.com https://www.youtube.com
```

**Example: Allow external images**

Current:
```
img-src 'self' data: https:
```

Change to:
```
img-src 'self' data: https: https://cdn.example.com
```

### CSP Improvements (Future)

The current CSP uses `unsafe-inline` because Next.js requires it. In the future, you could:

1. **Use nonce-based CSP** (more secure)
2. **Use hash-based CSP** (for specific scripts)
3. **Migrate to strict CSP** (once Next.js fully supports it)

For now, the current setup is a good balance of security and functionality.

---

## Deployment Checklist

- [x] Security headers configured in `next.config.ts`
- [ ] Deploy to Vercel
- [ ] Verify headers appear in response (check DevTools)
- [ ] Test with securityheaders.com
- [ ] Monitor for CSP violations in browser console
- [ ] Add CSP report-uri if violations found (future enhancement)

---

## Support

**Security Headers Reference:** https://owasp.org/www-project-secure-headers/

**Test Your Headers:** https://securityheaders.com

**CSP Guide:** https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP

---

**Version:** 1.0  
**Status:** Deployed to Vercel  
**Last Updated:** August 2026
