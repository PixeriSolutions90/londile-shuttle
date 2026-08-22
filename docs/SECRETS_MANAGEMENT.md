# Secrets Management & Rotation Plan

This document outlines how we manage secrets, prevent accidental exposure, and rotate credentials.

---

## Overview

**Golden Rule:** No real secrets in git. Ever.

Secrets are stored ONLY in:
- ✅ **Local development:** `.env.local` (git-ignored)
- ✅ **Vercel production:** Environment Variables dashboard
- ✅ **Supabase:** Project settings (never in code)
- ✅ **Upstash:** Console dashboard (tokens in Vercel only)
- ✅ **Cloudflare:** Turnstile keys in Vercel only

❌ **NEVER:**
- Commit `.env.local` to git
- Hardcode secrets in source files
- Share secrets in Slack, email, or chat
- Store plaintext in databases
- Log secrets in error messages

---

## Current Secrets

### Development Secrets (.env.local - git-ignored)
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
NEXT_PUBLIC_TURNSTILE_SITE_KEY
TURNSTILE_SECRET_KEY
```

### Production Secrets (Vercel Environment Variables)
**Same as above, but managed in Vercel dashboard**
- Environments: Production, Preview, Development
- Locked to specific environment (can't change once deployed)

### Database Secrets (Supabase)
- **Service Role Key** - Server-side operations (in Vercel only)
- **Anon Key** - Client-side operations (safe to expose)
- **Admin Password** - Never needed in app (Supabase internal)

### External Services
- **Upstash Redis** - Token in Vercel only
- **Cloudflare Turnstile** - Secret Key in Vercel only

---

## Git Protection

### .gitignore Configuration

✅ Current `.gitignore` protects:
```
.env*                 # All .env files
*.pem                 # SSL/TLS certificates
*.key                 # Private keys
```

### What's Protected
- ✅ `.env.local` - Local development secrets
- ✅ `.env.production` - Production override (if any)
- ✅ `.env.test` - Test environment secrets
- ✅ Any `.pem` or `.key` files

### Audit: Check No Secrets Committed

```bash
# Search for common secret patterns
git log -S "SUPABASE_SERVICE_ROLE" --all  # Should return nothing
git log -S "secret_" --all                 # Should return nothing
git log -S "apikey" --all                  # Should return nothing

# Search for .env files in history
git log --all --full-history --name-only | grep "\.env"
# Result: Only .env.example or .env.local.example (if any)
```

---

## Secrets Hierarchy

### Public (Safe to Expose)
```
NEXT_PUBLIC_SUPABASE_URL ✅
NEXT_PUBLIC_SUPABASE_ANON_KEY ✅
NEXT_PUBLIC_TURNSTILE_SITE_KEY ✅
```
- These have "NEXT_PUBLIC_" prefix (visible in browser)
- Limited permissions (Supabase RLS, Turnstile verification-only)
- No write access, no data deletion

### Private (Server-only, Never in Browser)
```
SUPABASE_SERVICE_ROLE_KEY ❌
TURNSTILE_SECRET_KEY ❌
UPSTASH_REDIS_REST_TOKEN ❌
```
- Used only in API routes (server-side)
- Full permissions (can delete data, manage roles, etc.)
- Never appear in frontend code or browser network requests
- If in browser: **Immediate rotation required**

---

## Key Rotation Schedule

### Supabase Anon Key
**Schedule:** Quarterly (every 3 months)  
**Why:** Standard security practice  
**How:**
1. Go to Supabase → Project Settings → API
2. Generate new **Anon Key**
3. Update `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel
4. Redeploy all environments
5. Document rotation in team log

### Supabase Service Role Key
**Schedule:** Every 6 months OR on suspected exposure  
**Why:** Full database access, highest risk  
**How:**
1. Go to Supabase → Project Settings → API
2. Generate new **Service Role Key**
3. Update `SUPABASE_SERVICE_ROLE_KEY` in Vercel
4. Redeploy all environments
5. Test API routes after deploy
6. Document rotation

**Immediate rotation if:**
- Accidentally exposed in logs
- Shared in unencrypted message
- Suspected unauthorized access
- Team member leaves company

### Upstash Redis Token
**Schedule:** Every 6 months  
**Why:** Rate limiting service has access to request data  
**How:**
1. Go to Upstash Console
2. Click database → **Reset token**
3. Copy new token
4. Update `UPSTASH_REDIS_REST_TOKEN` in Vercel
5. Update `UPSTASH_REDIS_REST_URL` if changed
6. Redeploy
7. Test booking/lookup endpoints

### Cloudflare Turnstile Keys
**Schedule:** Annually OR if suspected bot abuse  
**Why:** Lower risk (no data access, only bot detection)  
**How:**
1. Go to Cloudflare Turnstile dashboard
2. Click site → **Rotate keys**
3. Update both keys in Vercel:
   - `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
   - `TURNSTILE_SECRET_KEY`
4. Redeploy
5. Test booking form

### Vercel Environment Variables
**Schedule:** Whenever underlying service keys rotate  
**How:**
1. Update value in Vercel dashboard
2. Select environments (Production, Preview, Development)
3. Click Save
4. Redeploy affected environments

---

## Rotation Calendar

```
January:   Upstash Token rotation
April:     Supabase Anon Key rotation
July:      Upstash Token rotation
October:   Supabase Anon Key rotation + Turnstile annual review

Every 6 months (Jan + July): Supabase Service Role Key rotation
```

**Tracking:**
- Add reminders in team calendar
- Create GitHub issues for tracking rotations
- Document completion in SECRETS_LOG.md

---

## Emergency Response

### If a Secret is Exposed

**Immediate (within 1 hour):**
1. [ ] Identify which secret was exposed
2. [ ] Determine exposure duration/scope
3. [ ] Start immediate rotation (see above)
4. [ ] Alert team in private channel

**Short-term (within 24 hours):**
1. [ ] Rotate secret in source system (Supabase, Upstash, etc.)
2. [ ] Verify new secret works in staging
3. [ ] Deploy new secret to production
4. [ ] Verify old secret is no longer used
5. [ ] Check logs for abuse during exposure window

**Documentation (within 48 hours):**
1. [ ] Write incident report
2. [ ] Document how exposure happened
3. [ ] Implement prevention (code review, pre-commit hooks, etc.)
4. [ ] Update this runbook if needed

### Prevention Checks

**Pre-commit:**
```bash
# Hook to prevent .env commits (add to .git/hooks/pre-commit)
#!/bin/bash
if git diff --cached --name-only | grep -E "\.env\..*local|\.pem|\.key"; then
  echo "❌ Error: Attempting to commit secrets!"
  echo "These files must stay local:"
  echo "  - .env.local"
  echo "  - .env.*.local"
  echo "  - *.pem, *.key"
  exit 1
fi
```

**Git audit (monthly):**
```bash
# Search for common secret patterns
git log --all -S "password" --source --all-match
git log --all -S "secret" --source --all-match
git log --all -S "key" --source --all-match

# Search for .env files
git log --all --full-history -- "*.env*" | grep "deleted mode"
```

---

## Per-Service Checklist

### Supabase
- [ ] Project owner: Confirm API keys visible only to admins
- [ ] Service role key: Stored in Vercel only (never frontend)
- [ ] Anon key: Safe to expose (public)
- [ ] RLS enabled: All tables have row-level security
- [ ] Rotation scheduled: Every 6 months (service role), quarterly (anon)

### Upstash
- [ ] Redis token: Stored in Vercel only
- [ ] Token type: `REDIS_REST_TOKEN` (not CLI token)
- [ ] Rate limiting: Deployed and working
- [ ] Rotation scheduled: Every 6 months
- [ ] Monitoring: Check Upstash dashboard for abuse

### Cloudflare Turnstile
- [ ] Site key: Public (in frontend code)
- [ ] Secret key: Server-only (Vercel environment variable)
- [ ] Server verification: Implemented in API routes
- [ ] Rotation scheduled: Annually
- [ ] Testing: Verify bot protection works

### Vercel
- [ ] All secrets in Environment Variables (not in code)
- [ ] Environments set correctly (Production/Preview/Development)
- [ ] Preview deployments: Use staging secrets if possible
- [ ] Audit log: Check who accessed/modified secrets
- [ ] Access control: Only necessary team members have access

---

## Team Access

### Who Can Access Secrets?

**Vercel Environment Variables:**
- Product owner
- Tech lead
- DevOps/Platform engineer
- (Not: junior engineers, interns, contractors without need)

**Supabase:**
- Product owner
- Tech lead
- (Database access: only for migrations and emergencies)

**Upstash:**
- Tech lead
- (Rate limit monitoring/debugging: product owner)

**Cloudflare Turnstile:**
- Tech lead
- (Stats: product owner via dashboard)

### Onboarding New Team Member

**Don't:**
- Share `.env.local` file
- Send secrets via email or Slack
- Add to shared password managers

**Do:**
1. Add to Vercel project (gives read access to Environment Variables)
2. Add to Supabase project (read-only)
3. Add to Upstash (read-only)
4. Add to Cloudflare (read-only)
5. Provide this documentation link

---

## Suspicious Activity Indicators

Watch for:
- [ ] Failed auth attempts in logs
- [ ] Unexpected API quota usage (Supabase)
- [ ] Unusual Redis commands (Upstash)
- [ ] Rate limit spikes (bot attacks, Turnstile)
- [ ] Geographic access from unexpected locations
- [ ] Unusual data access patterns

**Action:** If detected, trigger emergency rotation (see above)

---

## Documentation

### SECRETS_LOG.md (Private, Not in Git)

Maintained separately (never committed):
```
# Secret Rotation Log

## 2026-01-15: Supabase Service Role Key
- Reason: Quarterly rotation
- Old key: Revoked
- New key: Verified in staging/production
- Rotated by: @tech-lead
- Status: ✅ Complete

## 2026-01-15: Upstash Redis Token
- Reason: Quarterly rotation
- Old token: Revoked
- New token: Verified (rate limiting working)
- Rotated by: @tech-lead
- Status: ✅ Complete
```

---

## Compliance

This plan aligns with:
- **OWASP:** Secret management best practices
- **POPIA:** Personal data protection (no secrets in logs)
- **SOC 2:** Security controls and monitoring
- **PCI DSS:** If processing payments (future enhancement)

---

## Automated Rotation (Future)

Consider in next phase:
- Vercel API for automated secret rotation
- Supabase API for key regeneration
- Scheduled GitHub Actions for logging
- Slack notifications on rotations

---

## Resources

- **Vercel Security:** https://vercel.com/docs/security
- **Supabase Security:** https://supabase.com/docs/guides/security
- **Upstash Security:** https://upstash.com/docs/redis/security
- **OWASP Secrets Management:** https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html

---

## Checklist for This Quarter

**Q3 2026:**
- [ ] Supabase Anon Key rotation (April → Q2 complete, next: July)
- [ ] Upstash Token rotation (July → Q3)
- [ ] Audit: No secrets in git history
- [ ] Verify all .env.local files are git-ignored
- [ ] Review team access in all platforms
- [ ] Document any emergency rotations

---

**Version:** 1.0  
**Last Updated:** August 2026  
**Next Review:** November 2026 (Quarterly)  
**Owner:** Tech Lead
