# Security & Database Setup Guide

## Overview

This document outlines the security architecture for Londile Shuttle, including:
- Data classification (POPIA compliance)
- Supabase RLS (Row-Level Security) policies
- Authentication & authorization
- Role-based access control

---

## Data Classification

### POPIA-Regulated Data
Personal information requiring explicit consent and protection:
- Names, surnames, contact numbers
- Email addresses
- ID numbers
- Saved addresses
- Password hashes (managed by Supabase)

### Operational Data
System data for booking management:
- Booking numbers, statuses, dates
- VAT/company registration numbers
- Company names/addresses
- User roles

See `data_inventory.md` for complete field-by-field breakdown.

---

## Database Schema

### Tables

#### `profiles` (extends auth.users)
Stores user profile and role information. Every authenticated user has a profile.

**Roles:**
- `admin` - Full system access, can see all data
- `agent` - Can create/manage bookings for clients
- `user` - Regular logged-in user, can only access own bookings

**Key fields:**
- `id` (UUID) - References auth.users(id), auto-deleted on user deletion
- `role` - CHECK constraint ensures valid roles
- `first_name`, `surname`, `id_number`, `contact_number` - POPIA regulated
- `company_*` - Agent-specific fields
- `saved_addresses` - JSONB array for users

#### `bookings`
Stores all booking information for guests, users, and agents.

**Key fields:**
- `booking_number` - Unique, sequential (LS-00001 format)
- `guest_*` - Guest information (POPIA regulated)
- `status` - pending/confirmed/completed/cancelled
- `created_by_agent_id` or `created_by_user_id` - Track who created the booking
- `verification_code` - Allows guests to lookup their booking without authentication

---

## Authentication Flows

### Guests
- **No Supabase Auth account**
- **Lookup:** Booking number + contact phone/email match
- **Access:** Read-only via `get_guest_booking()` function
- **Verification:** Must match contact info to prove ownership

### Logged-In Users
- **Supabase Auth:** Email + password or magic link
- **Profile:** Created automatically on signup (via trigger, see implementation notes)
- **Bookings:** Can only view their own bookings
- **Role:** Defaults to 'user'

### Agents
- **Supabase Auth:** Email + password or magic link
- **Profile:** Role = 'agent', includes company information
- **Bookings:** Can create/read/update all bookings they created
- **Access:** Full `/agent/*` dashboard access (gated by middleware)

### Admins
- **Supabase Auth:** Email + password or magic link
- **Profile:** Role = 'admin', same fields as users
- **Bookings:** Can read/update ALL bookings in system
- **Access:** Full `/admin/*` dashboard access (gated by middleware)

---

## Row-Level Security (RLS) Policies

### Profiles Table

| Policy | Role | Allows |
|--------|------|--------|
| Users can read own profile | Anyone | Read own profile only |
| Admins can read all profiles | admin | Read all profiles |
| Users can update own profile | Anyone | Update own profile (role field protected) |

**Protection:** Role field cannot be changed by user — only admins can assign roles.

### Bookings Table

| Policy | Role | Allows |
|--------|------|--------|
| Agents can read all | agent | Read all bookings |
| Agents can create | agent | Create bookings (must set created_by_agent_id to self) |
| Agents can update own | agent | Update only their own bookings |
| Admins can read all | admin | Read all bookings |
| Admins can update all | admin | Update any booking |
| Users can read own | user | Read only their own bookings |
| Guests can lookup | Anonymous | Via `get_guest_booking()` function only |

**Protection:**
- Guests cannot query the full bookings table (would expose all data)
- Guests use the `get_guest_booking(booking_number, contact_phone)` function instead
- This function is SECURITY DEFINER — runs with full permissions but filters results

---

## Implementation Checklist

### Phase 1: Database Setup
- [ ] Run migration: `supabase/migrations/001_init_schema.sql`
- [ ] Test in Supabase SQL editor:
  ```sql
  -- Should work (admin or agent role)
  SELECT * FROM bookings;
  
  -- Should return empty for regular user
  SELECT * FROM bookings WHERE created_by_user_id = auth.uid();
  
  -- Test guest lookup
  SELECT * FROM get_guest_booking('LS-00001', '+27123456789');
  ```

### Phase 2: Next.js Middleware
- [ ] Create `src/middleware.ts` for role-based route protection
- [ ] Gate `/agent/*` routes: require role = 'agent'
- [ ] Gate `/admin/*` routes: require role = 'admin'
- [ ] Redirect unauthorized users to `/dashboard`

### Phase 3: Frontend Implementation
- [ ] Create login/signup pages
- [ ] Create profile setup (user fills in name, contact, etc.)
- [ ] Create agent onboarding (with company details)
- [ ] Create booking form (for agents and logged-in users)
- [ ] Create guest lookup page (booking number + contact)

### Phase 4: Testing
- [ ] Test guest lookup (should work without auth)
- [ ] Test user booking access (should only see own)
- [ ] Test agent dashboard (should see all their bookings)
- [ ] Test admin dashboard (should see everything)
- [ ] Test middleware (should redirect to login)

### Phase 5: Compliance
- [ ] Add POPIA privacy policy page
- [ ] Add consent checkboxes on signup
- [ ] Implement data deletion endpoint (right to erasure)
- [ ] Add audit logging for sensitive operations

---

## Testing RLS Policies

In Supabase SQL editor:
1. Click **"Run as role"** dropdown (top-right)
2. Select a test role: `authenticated` or specific user
3. Run queries to verify RLS is working

**Example tests:**
```sql
-- Test 1: Regular user should only see own bookings
SET role authenticated;
SET request.jwt.claims = '{"sub":"<USER-ID>"}';
SELECT * FROM bookings; -- Should be empty or only user's bookings

-- Test 2: Agent should see all
SET role authenticated;
SET request.jwt.claims = '{"sub":"<AGENT-ID>","role":"agent"}';
SELECT * FROM bookings; -- Should see all

-- Test 3: Guest lookup should work
SET role anon;
SELECT * FROM get_guest_booking('LS-00001', '+27123456789'); -- Should work
SELECT * FROM bookings; -- Should fail
```

---

## POPIA Compliance Notes

### Data Subject Rights
- **Right to access:** Users can view their own data via `/profile`
- **Right to rectification:** Users can update their own profile
- **Right to erasure:** Implement delete account endpoint (deletes auth user + profile)
- **Right to data portability:** Export user data as JSON

### Consent Management
- [ ] Add explicit consent checkbox on signup
- [ ] Log all consent decisions with timestamps
- [ ] Allow users to revoke consent at any time
- [ ] Display privacy policy before signup

### Data Retention
- **Guest bookings:** 7 years (tax/legal requirement)
- **User accounts:** Until user deletes account
- **Audit logs:** 1 year minimum
- **Deleted data:** Implement soft deletes initially, hard delete after retention period

### Data Subject Requests
- [ ] Implement GDPR/POPIA request handling workflow
- [ ] Set up email notification system
- [ ] Document all data processing activities
- [ ] Maintain audit trail of data access

---

## Security Best Practices

1. **Never trust the client:** Always validate user role server-side
2. **RLS is your safety net:** Always enable RLS on sensitive tables
3. **Test policies:** Use "Run as role" to verify RLS works before deployment
4. **Audit logs:** Log all sensitive operations (bookings created, profiles updated)
5. **Secrets management:** Never commit `.env.local` or API keys
6. **Rate limiting:** Implement on auth endpoints to prevent brute force
7. **HTTPS only:** Ensure all connections are encrypted in production

---

## Next Steps

1. **Review and approve** this security plan
2. **Run the SQL migration** in Supabase
3. **Test the RLS policies** in the SQL editor
4. **Implement middleware** for route protection
5. **Build signup/login flows** with proper validation
6. **Add audit logging** for sensitive operations
