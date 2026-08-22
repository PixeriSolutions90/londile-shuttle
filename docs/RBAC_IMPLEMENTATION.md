# Role-Based Access Control (RBAC) Implementation

## Overview

This document describes the complete RBAC system including:
- Auto-profile creation on signup
- JWT-optimized role checking
- Role assignment workflows
- Audit logging

---

## Architecture

### Authentication Flow

```
User Signs Up
    ↓
auth.users entry created (Supabase Auth)
    ↓
Trigger: handle_new_user() fires
    ↓
profiles table entry created (role = 'user')
    ↓
User is now authenticated
```

### Role Assignment Flow

#### User → Agent (Request + Approval)
```
User requests agent role
    ↓
POST /api/roles/request-agent (with company details)
    ↓
role_requests entry created (status = 'pending')
    ↓
Admin reviews in dashboard
    ↓
Admin approves/rejects
    ↓
If approved: assign_role_to_user('agent') is called
    ↓
JWT custom claims updated
    ↓
RLS policies recognize new role
```

#### Admin Direct Assignment
```
Admin calls POST /api/roles/assign
    ↓
assign_role_to_user() function runs
    ↓
1. Updates profiles.role
2. Updates auth.users.raw_app_meta_data (JWT claims)
3. Logs to audit_logs
```

---

## Database Tables

### profiles (Extended with RBAC)
```sql
id              UUID (PK, FK to auth.users)
role            TEXT ('admin', 'agent', 'user')
first_name      TEXT
surname         TEXT
... (existing fields)
```

### role_requests (New)
```sql
id                    UUID (PK)
user_id              UUID (FK to profiles)
requested_role       TEXT ('agent', 'admin')
company_details      JSONB (company info for agent requests)
status               TEXT ('pending', 'approved', 'rejected')
reviewed_by          UUID (FK to profiles) - admin who reviewed
admin_notes          TEXT
created_at           TIMESTAMP
reviewed_at          TIMESTAMP
updated_at           TIMESTAMP
```

### audit_logs (New)
```sql
id         UUID (PK)
user_id    UUID (FK to profiles)
action     TEXT (role_assigned, agent_role_requested, etc.)
resource   TEXT (what was affected: 'user:123')
details    JSONB (additional info)
created_at TIMESTAMP
```

---

## Supabase Functions

### 1. handle_new_user() - Trigger
**Fires:** After INSERT on auth.users
**Does:** Creates a profile entry with role = 'user'

```sql
INSERT INTO profiles (id, role)
VALUES (new_auth_user_id, 'user');
```

### 2. get_user_role() - Optimized Role Checker
**Called by:** RLS policies
**Does:** 
- Checks JWT custom claims first (fast)
- Falls back to database query (safe fallback)
- Returns user's role

```sql
-- Usage in RLS policies:
WHERE get_user_role() = 'admin'
```

**Benefits:**
- JWT claims are checked first (no DB query)
- If JWT is stale/missing, DB query is fallback
- Much faster than always querying database

### 3. assign_role_to_user() - Admin Role Assignment
**Called by:** Admin API endpoint, agent approval workflow
**Does:**
1. Verifies caller is admin
2. Updates profiles.role
3. Updates auth.users custom claims (JWT)
4. Logs to audit_logs

```sql
SELECT assign_role_to_user('user-uuid', 'agent');
```

**Returns:**
```json
{
  "success": true,
  "message": "Role assigned successfully",
  "user_id": "uuid",
  "new_role": "agent"
}
```

### 4. request_agent_role() - Agent Request
**Called by:** User endpoint
**Does:**
1. Validates user doesn't already have agent role
2. Updates profile with company details
3. Creates role_requests entry (status = pending)
4. Logs to audit_logs

```sql
SELECT request_agent_role(
  'My Company Ltd',
  'ZA123456789',
  'REG123456',
  '123 Main St, Cape Town'
);
```

**Returns:**
```json
{
  "success": true,
  "message": "Agent role request submitted. Awaiting admin approval.",
  "user_id": "uuid"
}
```

### 5. review_agent_request() - Admin Approval
**Called by:** Admin endpoint
**Does:**
1. Verifies caller is admin
2. Updates role_requests status
3. If approved: calls assign_role_to_user('agent')
4. Logs to audit_logs

```sql
SELECT review_agent_request(
  'request-uuid',
  true,
  'Verified company registration'
);
```

**Returns:**
```json
{
  "success": true,
  "message": "Agent request approved",
  "user_id": "uuid",
  "status": "approved"
}
```

---

## Next.js API Routes

### POST /api/roles/assign
**Admin Only** - Direct role assignment

```javascript
// Request
{
  userId: "user-uuid",
  role: "agent"
}

// Response
{
  success: true,
  message: "Role assigned successfully",
  user_id: "user-uuid",
  new_role: "agent"
}
```

### POST /api/roles/request-agent
**Authenticated Users Only** - Request agent role

```javascript
// Request
{
  companyName: "My Company Ltd",
  vatNumber: "ZA123456789",
  companyRegistration: "REG123456",
  companyAddress: "123 Main St, Cape Town"
}

// Response
{
  success: true,
  message: "Agent role request submitted. Awaiting admin approval.",
  user_id: "user-uuid"
}
```

### POST /api/roles/review-request
**Admin Only** - Review agent role requests

```javascript
// Request
{
  requestId: "request-uuid",
  approved: true,
  adminNotes: "Verified company details"
}

// Response
{
  success: true,
  message: "Agent request approved",
  user_id: "user-uuid",
  status: "approved"
}
```

---

## Client-Side Utilities (src/lib/auth.ts)

### getUserRole()
```typescript
const role = await getUserRole(); // Returns 'admin' | 'agent' | 'user' | null
```

### isAdmin()
```typescript
if (await isAdmin()) {
  // Show admin dashboard
}
```

### isAgent()
```typescript
if (await isAgent()) {
  // Show agent dashboard
}
```

### requestAgentRole()
```typescript
await requestAgentRole(
  'My Company',
  'ZA123456789',
  'REG123456',
  '123 Main St'
);
```

### getPendingAgentRequests()
```typescript
const requests = await getPendingAgentRequests(); // Admin only
```

### reviewAgentRequest()
```typescript
await reviewAgentRequest(
  'request-uuid',
  true, // approved
  'Notes'
);
```

### assignRole()
```typescript
await assignRole('user-uuid', 'agent'); // Admin only
```

---

## JWT Custom Claims

When a role is assigned, Supabase updates `auth.users.raw_app_meta_data`:

```json
{
  "role": "agent"
}
```

**How RLS uses it:**
```sql
(current_setting('request.jwt.claims', true)::jsonb->>'role')
```

**Benefits:**
- Role is embedded in JWT token
- No database query needed for every request
- Faster RLS policy evaluation

---

## RLS Policies (Using get_user_role())

### Profiles Table
| Policy | Condition | Action |
|--------|-----------|--------|
| Users can read own profile | user_id = auth.uid() | SELECT |
| Admins can read all | get_user_role() = 'admin' | SELECT |
| Users can update own | user_id = auth.uid() AND role unchanged | UPDATE |

### Bookings Table
| Policy | Condition | Action |
|--------|-----------|--------|
| Agents can read all | get_user_role() = 'agent' | SELECT |
| Agents can create | get_user_role() = 'agent' | INSERT |
| Agents can update own | get_user_role() = 'agent' AND created_by_agent_id = auth.uid() | UPDATE |
| Admins can read all | get_user_role() = 'admin' | SELECT |
| Admins can update all | get_user_role() = 'admin' | UPDATE |

### role_requests Table
| Policy | Condition | Action |
|--------|-----------|--------|
| Users see own | user_id = auth.uid() | SELECT |
| Admins see all | get_user_role() = 'admin' | SELECT |
| Admins update | get_user_role() = 'admin' | UPDATE |

### audit_logs Table
| Policy | Condition | Action |
|--------|-----------|--------|
| Admins only | get_user_role() = 'admin' | SELECT |

---

## Testing

### 1. Test Signup → Auto-Profile Creation
```bash
# Sign up a new user
# Check Supabase: profiles table should have new entry with role = 'user'
```

### 2. Test Agent Role Request
```bash
# As user, call: POST /api/roles/request-agent
# Check: role_requests table has 'pending' entry
```

### 3. Test Agent Approval
```bash
# As admin, call: POST /api/roles/review-request (approved=true)
# Check:
#   - profiles.role changed to 'agent'
#   - auth.users.raw_app_meta_data updated
#   - audit_logs has entry
```

### 4. Test RLS Enforcement
```sql
-- In Supabase SQL Editor
-- Set role to 'agent'
SELECT * FROM bookings; -- Should see all

-- Set role to 'user'
SELECT * FROM bookings; -- Should see only own bookings

-- Set role to 'anon'
SELECT * FROM bookings; -- Should fail
```

---

## Audit Trail

All role changes are logged to `audit_logs`:

```json
{
  "action": "role_assigned",
  "resource": "user:target-user-id",
  "details": {
    "new_role": "agent",
    "target_user": "target-user-id"
  }
}
```

**Admin can view all audit logs:**
```typescript
const logs = await supabase
  .from('audit_logs')
  .select('*')
  .order('created_at', { ascending: false });
```

---

## Migration Steps

### Phase 1: Database
- [ ] Run `002_auth_and_rbac.sql` in Supabase SQL Editor

### Phase 2: Backend
- [ ] API routes created (/api/roles/*)
- [ ] Functions deployed

### Phase 3: Frontend
- [ ] Install client utilities (lib/auth.ts)
- [ ] Create signup page (auto-profile creation now works)
- [ ] Create agent onboarding page
- [ ] Create admin approval dashboard

### Phase 4: Testing
- [ ] Test signup flow
- [ ] Test agent request & approval
- [ ] Test RLS enforcement
- [ ] Test audit logging

---

## Security Notes

1. **Never trust client role claim** - Always verify server-side
2. **JWT expiration** - Roles cached in JWT, new roles take effect at login/token refresh
3. **Audit everything** - All role changes logged
4. **RLS is your safety net** - Database enforces access control
5. **Service role key** - Only use server-side for admin operations

---

## Common Issues

### Issue: User can still see data after role was downgraded
**Cause:** JWT token still has old role
**Solution:** User must logout and login again to refresh token

### Issue: Agent approval takes effect immediately
**Cause:** Using get_user_role() checks JWT first
**Solution:** User sees new role after logout/login; RLS enforces correctly even before that

### Issue: "Only admins can assign roles" error
**Cause:** Calling function with non-admin user
**Solution:** All role assignment must be admin-initiated or via approval workflow
