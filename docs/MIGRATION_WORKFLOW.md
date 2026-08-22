# Supabase Migration Workflow

## Overview

This project uses **version-controlled database migrations** with Supabase CLI. Every schema change is tracked in git, reproducible, and deployable to any environment.

**Golden Rule:** Never edit the database schema manually in the Supabase dashboard. All schema changes go through migrations.

---

## Why Version-Controlled Migrations?

| Benefit | Example |
|---------|---------|
| **Reproducibility** | Deploy the exact same schema to dev, staging, prod |
| **Auditability** | See who changed what, when, and why (git blame) |
| **Rollback capability** | If something breaks, revert the migration commit |
| **Team collaboration** | Clear, linear schema history; no conflicts |
| **CI/CD integration** | Automatically run migrations on deployment |

---

## Setup

### 1. Install Supabase CLI

```bash
npm install -g supabase
```

Or use your platform's package manager:
```bash
# macOS
brew install supabase/tap/supabase

# Ubuntu/Debian
apt install supabase
```

### 2. Link to Remote Project

```bash
cd londile-shuttle-main
supabase link --project-ref ztpapasdfzgfglvsooie
```

When prompted, enter your Supabase access token (get it from: https://app.supabase.com/account/tokens)

**Result:** Creates `.supabase/config.json` (local only, don't commit)

### 3. Verify Configuration

```bash
supabase projects list
supabase db info
```

Should show your remote Supabase project details.

---

## Workflow: Creating & Running Migrations

### Step 1: Create a New Migration

```bash
supabase migration new <descriptive_name>
```

**Examples:**
```bash
supabase migration new add_payment_table
supabase migration new fix_rls_policy_typo
supabase migration new add_audit_logging
```

**Output:**
```
✓ Created migration: supabase/migrations/20250101140000_add_payment_table.sql
```

The file is timestamped and version-controlled.

### Step 2: Edit the Migration File

Open `supabase/migrations/TIMESTAMP_add_payment_table.sql` and write your SQL:

```sql
-- ============================================================================
-- Add payments table for processing bookings
-- ============================================================================

CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'failed')) DEFAULT 'pending',
  gateway_reference TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE INDEX payments_booking_id_idx ON payments(booking_id);
CREATE INDEX payments_status_idx ON payments(status);

-- RLS: Users can see payments on their own bookings
CREATE POLICY "Users can see own payment status" ON payments
  FOR SELECT USING (
    booking_id IN (SELECT id FROM bookings WHERE created_by_user_id = auth.uid())
  );

-- RLS: Admins can see all payments
CREATE POLICY "Admins can see all payments" ON payments
  FOR SELECT USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );
```

### Step 3: Test Locally (Optional)

```bash
# Start local Supabase stack
supabase start

# Apply migrations to local database
supabase db push
```

**Output:**
```
Applying migration: 20250101140000_add_payment_table.sql
✓ Applied successfully
```

Verify in local studio: `http://localhost:54323`

### Step 4: Push to Remote (Production/Staging)

```bash
# Deploy migrations to remote project
supabase db push --linked
```

**Output:**
```
Applying migration: 20250101140000_add_payment_table.sql to project 'ztpapasdfzgfglvsooie'
✓ Applied successfully
```

Check the remote studio: https://app.supabase.com/project/ztpapasdfzgfglvsooie/editor

### Step 5: Commit to Git

```bash
git add supabase/migrations/TIMESTAMP_add_payment_table.sql
git commit -m "FEATURE: Add payments table

Create payments table for tracking transaction status.
- Stores booking_id, amount, gateway_reference
- RLS: Users see own payments; Admins see all
- Indexed on booking_id and status for query performance"
```

---

## Current Migrations

### 001_init_schema.sql
**Date:** Initial setup

**Creates:**
- profiles (extends auth.users)
- bookings (main booking data)
- RLS policies for basic access control

### 002_auth_and_rbac.sql
**Date:** RBAC & JWT custom claims

**Creates:**
- handle_new_user() trigger (auto-profile on signup)
- get_user_role() function (JWT-optimized role lookup)
- assign_role_to_user() function (admin role assignment)
- request_agent_role() / review_agent_request() functions (agent approval workflow)
- role_requests table (agent requests pending approval)
- audit_logs table (security logging)

### 003_return_trips_schema.sql
**Date:** Return trip support

**Modifies:**
- bookings table: adds pickup/dropoff fields, return_date/return_time, passenger_count, pricing fields
- Updates RLS policies to use optimized get_user_role()

**Creates:**
- get_booking_fare_breakdown() function

### 004_vehicles_and_pricing.sql
**Date:** Fleet & pricing management

**Creates:**
- vehicles (Comfort, Luxury, Van, etc.)
- zones (Geographic service areas)
- pricing_rules (vehicle × zone → fare)
- addons (Baby seat, WiFi, trailer)
- booking_addons (junction table)
- calculate_fare() function (fare calculation)

All tables with RLS policies (public read active, admins manage).

---

## Applying All Existing Migrations

To set up a fresh environment with all current schema:

### Option 1: Push All Migrations at Once

```bash
# This applies ALL migrations since the remote last saw them
supabase db push --linked
```

Supabase automatically:
1. Detects which migrations exist locally but not remotely
2. Applies them in timestamp order
3. Verifies each one succeeds

### Option 2: Reset & Repull (Careful!)

If migrations are out of sync or you want to start fresh:

```bash
# WARNING: This DELETES local data!
supabase db reset

# Then repull the remote schema
supabase db pull

# Verify all tables exist
supabase db info
```

---

## Migration Best Practices

### 1. Descriptive Names

✅ **Good:**
```bash
supabase migration new add_vehicle_capacity_columns
supabase migration new create_audit_logs_table
supabase migration new fix_booking_pricing_snapshot
```

❌ **Bad:**
```bash
supabase migration new update_db
supabase migration new fix_issue
```

### 2. Atomic Migrations

Each migration should be **one logical change**. Don't combine unrelated things.

✅ **Good:**
```sql
-- One migration: Create payments table
CREATE TABLE payments (...)
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payments_rls" ON payments FOR SELECT ...;
```

❌ **Bad:**
```sql
-- Multiple concerns in one migration
CREATE TABLE payments (...);
ALTER TABLE bookings ADD COLUMN payment_status TEXT;
DELETE FROM old_data WHERE created_at < '2025-01-01';
```

### 3. Always Include RLS

For every new table, add RLS:

```sql
ALTER TABLE public.my_table ENABLE ROW LEVEL SECURITY;
CREATE POLICY "policy_name" ON my_table FOR SELECT USING (...);
```

### 4. Include Indexes for Performance

```sql
CREATE INDEX my_table_user_id_idx ON my_table(user_id);
CREATE INDEX my_table_created_at_idx ON my_table(created_at DESC);
```

### 5. Document with Comments

```sql
-- ============================================================================
-- Purpose: Store payment transactions for bookings
-- Usage: Called when customer completes payment
-- Impact: Linked to bookings via foreign key
-- ============================================================================

CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ...
);
```

### 6. Add Data Validation with Constraints

```sql
-- Check constraints prevent invalid data
CREATE TABLE bookings (
  ...
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  ...
);
```

### 7. Use FOREIGN KEY Constraints

```sql
CREATE TABLE booking_addons (
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  addon_id UUID NOT NULL REFERENCES addons(id) ON DELETE RESTRICT,
  ...
);
```

**Cascade vs Restrict:**
- `ON DELETE CASCADE` — Remove addon links when booking is deleted
- `ON DELETE RESTRICT` — Prevent deleting addon if it's linked to bookings

### 8. Provide Rollback Path (If Needed)

When dropping tables, document what data is being lost:

```sql
-- ============================================================================
-- WARNING: This drops the old_quotes table. Backup data first!
-- SELECT * INTO backup_old_quotes FROM old_quotes;
-- ============================================================================

DROP TABLE old_quotes;
```

---

## Common Tasks

### Task 1: Add a New Table

```bash
supabase migration new create_statements_table
```

Edit the file:
```sql
CREATE TABLE public.statements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_amount DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE statements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients see own statements" ON statements
  FOR SELECT USING (client_id IN (SELECT client_id FROM ...));
```

```bash
supabase db push --linked
git add supabase/migrations/...
git commit -m "FEATURE: Add statements table for invoice aggregation"
```

### Task 2: Modify an Existing Table

```bash
supabase migration new add_payment_method_to_bookings
```

Edit the file:
```sql
ALTER TABLE public.bookings
ADD COLUMN payment_method TEXT CHECK (payment_method IN ('card', 'bank_transfer', 'cash')),
ADD COLUMN paid_at TIMESTAMP WITH TIME ZONE;
```

```bash
supabase db push --linked
git add supabase/migrations/...
git commit -m "FEATURE: Add payment tracking to bookings"
```

### Task 3: Drop a Column (Careful!)

```bash
supabase migration new drop_unused_column
```

Edit the file:
```sql
-- Old column is no longer used after migration to new payment system
ALTER TABLE public.bookings DROP COLUMN payment_token;
```

**Safeguard:** Before dropping, back up the data:
```sql
-- Export old data to a view (for reporting)
CREATE VIEW bookings_payment_history AS
SELECT id, old_column FROM bookings_backup;

-- Then drop
ALTER TABLE bookings DROP COLUMN old_column;
```

### Task 4: Create a Function/Trigger

```bash
supabase migration new add_auto_invoice_function
```

Edit the file:
```sql
CREATE OR REPLACE FUNCTION public.auto_create_invoice()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO invoices (booking_id, client_id, amount)
  VALUES (NEW.id, NEW.client_id, NEW.total_fare);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER booking_invoice_trigger
  AFTER INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_invoice();
```

```bash
supabase db push --linked
git add supabase/migrations/...
git commit -m "FEATURE: Auto-create invoices when booking is confirmed"
```

---

## Viewing Migration Status

### List All Migrations

```bash
supabase migration list --linked
```

**Output:**
```
Migrations on remote project 'ztpapasdfzgfglvsooie':
  20250101120000 - init_schema
  20250101120030 - auth_and_rbac
  20250101120045 - return_trips_schema
  20250101120100 - vehicles_and_pricing
```

### Check If Local & Remote Are Sync'd

```bash
supabase db pull
# If no output, you're in sync
# If it shows pending migrations, push them
```

### View Remote Schema

```bash
supabase db pull --schema public --output-schema-only
# Outputs SQL schema as it currently is on remote
```

---

## Troubleshooting

### Problem: "Migration failed: duplicate key value violates unique constraint"

**Cause:** Migration tried to insert data that violates a constraint.

**Solution:**
1. Fix the migration SQL
2. Run `supabase db reset` locally to re-test
3. Don't push until it passes locally

### Problem: "Cannot drop column; it is used in a foreign key constraint"

**Cause:** You're trying to drop a column that's referenced elsewhere.

**Solution:**
1. Drop dependent objects first (foreign keys, constraints)
2. Then drop the column
3. Consider keeping the column and marking it as deprecated instead

### Problem: "Remote is ahead of local"

**Cause:** Someone else pushed migrations to remote that you don't have locally.

**Solution:**
```bash
# Pull their migrations
supabase db pull
# This creates local migration files matching remote
```

### Problem: "supabase db push" says "Already applied"

**Cause:** Migration was already applied to remote; you're running it again.

**Solution:** Don't worry—Supabase skips already-applied migrations. It's safe.

---

## CI/CD Integration

### GitHub Actions Example

In `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main, master]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Supabase migrations
        run: |
          npm install -g supabase
          supabase db push --linked
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          SUPABASE_PROJECT_REF: ztpapasdfzgfglvsooie

      - name: Deploy app
        run: |
          # Deploy to Vercel, AWS, etc.
```

---

## Migration Checklist

Before committing a migration:

- [ ] Migration has a descriptive filename
- [ ] SQL is well-commented
- [ ] RLS policies are included (if adding tables)
- [ ] Indexes are created for query performance
- [ ] Constraints are defined (UNIQUE, CHECK, FK)
- [ ] Migration passes locally: `supabase db push`
- [ ] Migration applies cleanly on remote
- [ ] No sensitive data (secrets, keys) in migration
- [ ] Commit message explains the schema change
- [ ] Rollback path documented (if complex)

---

## Golden Rules

1. ✅ **Always** use migrations for schema changes
2. ✅ **Test** migrations locally before pushing
3. ✅ **Commit** migrations to git with descriptive messages
4. ✅ **Include** RLS policies from the start
5. ❌ **Never** edit schema manually in the dashboard
6. ❌ **Never** commit secrets or keys in migrations
7. ❌ **Never** skip the local test step

---

## Existing Migrations Summary

All migrations are in `supabase/migrations/`:

```
001_init_schema.sql                      (Aug 22)
002_auth_and_rbac.sql                    (Aug 22)
003_return_trips_schema.sql              (Aug 22)
004_vehicles_and_pricing.sql             (Aug 22)
```

**To apply all to a fresh environment:**

```bash
supabase link --project-ref ztpapasdfzgfglvsooie
supabase db push --linked
```

All 4 migrations apply in order, creating the complete production schema.

---

## Next Migrations (Planned)

- `005_add_payments_table.sql` — Payment processing
- `006_add_notifications_logging.sql` — SMS/Email audit trail
- `007_add_analytics_views.sql` — Reporting views
- `008_add_mfa_support.sql` — Multi-factor authentication
