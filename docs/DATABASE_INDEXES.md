# Database Indexes: Booking Lookups & Performance

## Overview

Strategic indexes optimize booking lookup queries. Guest searches by booking number, phone, or email should return results in **milliseconds**, not seconds.

**Applied in:** Migration `005_add_booking_lookup_indexes.sql`

---

## Index Strategy

### Core Principle: Index What You Search By

Every lookup query needs an index on its `WHERE` clause columns:

```sql
-- These queries need indexes:
SELECT * FROM bookings WHERE booking_number = 'LS-00001';              -- INDEX: booking_number
SELECT * FROM bookings WHERE guest_contact = '+27123456789';           -- INDEX: guest_contact
SELECT * FROM bookings WHERE guest_email = 'user@example.com';         -- INDEX: guest_email

-- This query needs a composite index:
SELECT * FROM bookings
WHERE guest_contact = '+27123456789' AND booking_number = 'LS-00001';  -- INDEX: (contact, number)
```

---

## Indexes Created

### 1. Single-Column Indexes (Exact Lookups)

#### booking_number_idx
```sql
CREATE INDEX bookings_booking_number_idx ON bookings(booking_number);
```

**Use case:** Guest enters booking code (LS-00001)
```sql
SELECT * FROM bookings WHERE booking_number = 'LS-00001';
```

**Performance:** O(log N) — Fast, even with millions of rows

#### guest_contact_idx
```sql
CREATE INDEX bookings_guest_contact_idx ON bookings(guest_contact);
```

**Use case:** Guest enters phone number (+27 123 456 789)
```sql
SELECT * FROM bookings WHERE guest_contact = '+27123456789';
```

**Performance:** O(log N)

#### guest_email_idx
```sql
CREATE INDEX bookings_guest_email_idx ON bookings(guest_email);
```

**Use case:** Guest enters email (user@example.com)
```sql
SELECT * FROM bookings WHERE guest_email = 'user@example.com';
```

**Performance:** O(log N)

#### status_idx
```sql
CREATE INDEX bookings_status_idx ON bookings(status);
```

**Use case:** Filter active bookings (exclude cancelled)
```sql
SELECT * FROM bookings WHERE status IN ('pending', 'confirmed', 'completed');
```

**Performance:** O(log N) — But may still scan if too many matching rows

#### created_at_idx
```sql
CREATE INDEX bookings_created_at_idx ON bookings(created_at DESC);
```

**Use case:** Recent bookings (dashboard, reporting)
```sql
SELECT * FROM bookings 
WHERE created_at > NOW() - INTERVAL '30 days'
ORDER BY created_at DESC;
```

**Performance:** O(log N), avoids separate sort step

---

### 2. Composite Indexes (Multi-Column Lookups)

#### (contact, booking_number)
```sql
CREATE INDEX bookings_contact_number_idx 
  ON bookings(guest_contact, booking_number);
```

**Use case:** Booking modification (verify ownership before allowing edit)
```sql
SELECT * FROM bookings
WHERE guest_contact = '+27123456789' AND booking_number = 'LS-00001';
```

**Why composite?** First column narrows results; second column pinpoints exact row.

**Performance:** Much faster than separate lookups

#### (email, booking_number)
```sql
CREATE INDEX bookings_email_number_idx 
  ON bookings(guest_email, booking_number);
```

**Use case:** Email verification workflow
```sql
SELECT * FROM bookings
WHERE guest_email = 'user@example.com' AND booking_number = 'LS-00001';
```

---

### 3. Partial Indexes (Conditional Lookups)

#### Active Bookings Only
```sql
CREATE INDEX bookings_active_lookups_idx
  ON bookings(guest_contact, booking_number)
  WHERE status IN ('pending', 'confirmed', 'completed');
```

**Why partial?** Excludes cancelled bookings from index.

**Benefit:** Smaller index = faster scans = less memory

**Use case:** Lookup workflow rarely searches cancelled bookings
```sql
SELECT * FROM bookings
WHERE guest_contact = '+27123456789' 
  AND booking_number = 'LS-00001'
  AND status IN ('pending', 'confirmed', 'completed');
```

**Performance:** Fastest option for active-only lookups

---

## Index Reference

| Index | Type | Columns | Use Case | Performance |
|-------|------|---------|----------|-------------|
| booking_number_idx | Single | booking_number | Lookup by code | O(log N) |
| guest_contact_idx | Single | guest_contact | Lookup by phone | O(log N) |
| guest_email_idx | Single | guest_email | Lookup by email | O(log N) |
| status_idx | Single | status | Filter by status | O(log N) |
| created_at_idx | Single | created_at DESC | Recent bookings | O(log N) |
| contact_number_idx | Composite | (guest_contact, booking_number) | Phone + code lookup | O(log N) |
| email_number_idx | Composite | (guest_email, booking_number) | Email + code lookup | O(log N) |
| active_lookups_idx | Partial | (guest_contact, booking_number) WHERE active | Fast active-only lookup | O(log N) |

---

## Performance Testing with EXPLAIN ANALYZE

### What is EXPLAIN ANALYZE?

Shows HOW the database executes a query:
- **Seq Scan:** Reads entire table (slow for large tables)
- **Index Scan:** Uses index (fast)
- **Index Only Scan:** Gets data entirely from index (fastest)

### Test Query 1: Exact Booking Number Lookup

```sql
EXPLAIN ANALYZE
SELECT * FROM bookings
WHERE booking_number = 'LS-00001';
```

**Expected output (good):**
```
Index Scan using bookings_booking_number_idx on bookings  (cost=0.42..8.44 rows=1 width=200)
  Index Cond: (booking_number = 'LS-00001'::text)
```

**Bad output (needs index):**
```
Seq Scan on bookings  (cost=0.00..35.50 rows=1 width=200)
  Filter: (booking_number = 'LS-00001'::text)
```

### Test Query 2: Phone + Booking Number (Modification Workflow)

```sql
EXPLAIN ANALYZE
SELECT * FROM bookings
WHERE guest_contact = '+27123456789' AND booking_number = 'LS-00001';
```

**Expected output:**
```
Index Scan using bookings_contact_number_idx on bookings  (cost=0.42..8.44 rows=1 width=200)
  Index Cond: (guest_contact = '+27123456789'::text AND booking_number = 'LS-00001'::text)
```

### Test Query 3: Active Bookings Only

```sql
EXPLAIN ANALYZE
SELECT * FROM bookings
WHERE guest_contact = '+27123456789' 
  AND booking_number = 'LS-00001'
  AND status IN ('pending', 'confirmed', 'completed');
```

**Expected output (uses partial index):**
```
Index Scan using bookings_active_lookups_idx on bookings  (cost=0.42..8.44 rows=1 width=200)
  Index Cond: (guest_contact = '+27123456789'::text AND booking_number = 'LS-00001'::text)
```

### Test Query 4: Recent Bookings (Dashboard)

```sql
EXPLAIN ANALYZE
SELECT * FROM bookings
WHERE status IN ('pending', 'confirmed', 'completed')
  AND created_at > NOW() - INTERVAL '30 days'
ORDER BY created_at DESC
LIMIT 10;
```

**Expected output:**
```
Limit  (cost=0.42..100.50 rows=10 width=200)
  ->  Index Scan Backward using bookings_created_at_idx on bookings  (cost=0.42..1000.50 rows=500 width=200)
        Index Cond: (created_at > now() - '30 days'::interval)
        Filter: (status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'completed'::text]))
```

---

## Testing Indexes with Seed Data

### Step 1: Reset Database (Apply Migrations + Seed)

```bash
supabase db reset
```

This creates all indexes from migration 005 and populates test data from seed.sql.

### Step 2: Run Performance Tests

```bash
# Connect to local database
supabase db start  # Make sure it's running

# Open psql or use Supabase Studio
supabase start
# Go to http://localhost:54323 → SQL Editor
```

### Step 3: Execute EXPLAIN ANALYZE Queries

Paste these queries into the SQL editor:

**Test 1: Simple booking lookup**
```sql
EXPLAIN ANALYZE
SELECT booking_number, guest_name, guest_contact, status
FROM bookings
WHERE booking_number = 'LS-00001';
```

**Test 2: Phone + booking lookup**
```sql
EXPLAIN ANALYZE
SELECT booking_number, guest_name, guest_contact, status
FROM bookings
WHERE guest_contact = '+27123456789' AND booking_number = 'LS-00001';
```

**Test 3: Email lookup**
```sql
EXPLAIN ANALYZE
SELECT booking_number, guest_name, guest_email, status
FROM bookings
WHERE guest_email = 'user@example.com';
```

**Test 4: Active bookings**
```sql
EXPLAIN ANALYZE
SELECT booking_number, guest_name, created_at
FROM bookings
WHERE status IN ('pending', 'confirmed', 'completed')
  AND created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC
LIMIT 5;
```

### Step 4: View Index Usage Statistics

See which indexes are actually used:

```sql
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as "Scans",
  idx_tup_read as "Tuples Read",
  idx_tup_fetch as "Tuples Fetched"
FROM pg_stat_user_indexes
WHERE tablename = 'bookings'
ORDER BY idx_scan DESC;
```

**Output example:**
```
schemaname | tablename | indexname                  | Scans | Tuples Read | Tuples Fetched
public     | bookings  | bookings_booking_number_idx| 10    | 10          | 10
public     | bookings  | bookings_contact_number_idx| 5     | 5           | 5
public     | bookings  | bookings_guest_contact_idx | 3     | 15          | 3
...
```

---

## Index Maintenance

### View All Indexes on Bookings

```sql
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'bookings'
ORDER BY indexname;
```

### Find Unused Indexes (Candidates for Removal)

```sql
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan
FROM pg_stat_user_indexes
WHERE tablename = 'bookings' AND idx_scan = 0
ORDER BY indexname;
```

Indexes with `idx_scan = 0` are never used. Consider dropping them:

```sql
DROP INDEX IF EXISTS bookings_unused_idx;
```

### Index Size

```sql
SELECT
  indexrelname,
  pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE tablename = 'bookings'
ORDER BY pg_relation_size(indexrelid) DESC;
```

**Watch for:** Indexes larger than expected (may indicate too many included columns).

---

## Index Design Decisions

### Why Composite Index Before Single Indexes?

**Question:** Why have both `contact_number_idx` and separate `guest_contact_idx`?

**Answer:** Different queries:
- Composite index fast for: `WHERE contact AND booking_number`
- Single index needed for: `WHERE contact` (without booking_number)

```sql
-- Uses composite index
SELECT * FROM bookings
WHERE guest_contact = ? AND booking_number = ?;

-- Uses single index
SELECT * FROM bookings
WHERE guest_contact = ?;  -- Can't use composite (no booking_number)
```

### Why Partial Index?

**Regular Index:**
```sql
CREATE INDEX bookings_contact_number_idx 
  ON bookings(guest_contact, booking_number);
-- Includes ALL bookings, even cancelled
```

**Partial Index:**
```sql
CREATE INDEX bookings_active_lookups_idx 
  ON bookings(guest_contact, booking_number)
  WHERE status IN ('pending', 'confirmed', 'completed');
-- Only active bookings → smaller, faster
```

**Trade-off:** Partial index faster for active-only lookups, but can't answer questions about cancelled bookings.

**Best practice:** Use partial index + add separate query:
```sql
-- Active lookups (fast, partial index)
SELECT * FROM bookings
WHERE guest_contact = ? AND status != 'cancelled';

-- If customer asks "What happened to my cancelled booking?"
SELECT * FROM bookings
WHERE guest_contact = ? AND status = 'cancelled';  -- Slower, but separate query
```

---

## Real-World Performance Impact

### Without Indexes (Seq Scan)

```
Table: bookings (1,000,000 rows)
Query: SELECT * FROM bookings WHERE booking_number = 'LS-00001';

Time: 200ms (scans 1,000,000 rows)
```

### With Index (Index Scan)

```
Time: 2ms (scans ~10 rows via index)
```

**100× faster** with proper indexing!

---

## API Route Optimization

### Booking Lookup Route

**File:** `src/app/api/bookings/lookup/route.ts`

Uses composite index for fast lookups:

```typescript
// This query uses bookings_contact_number_idx
const { data: booking, error } = await supabase
  .from("bookings")
  .select("*")
  .eq("booking_number", p_booking_number)
  .eq("guest_contact", p_contact_text)
  .single();

// Should execute in <5ms with index
```

---

## Migration Applied

**File:** `supabase/migrations/005_add_booking_lookup_indexes.sql`

Creates:
- ✅ 5 single-column indexes
- ✅ 2 composite indexes
- ✅ 1 partial index
- ✅ guest_email field (for email lookups)

**Run with:**
```bash
supabase db reset  # Applies all 5 migrations + seed
```

---

## Summary

✅ **Strategic indexing** for guest lookups
✅ **Composite indexes** for multi-column WHERE clauses
✅ **Partial indexes** for active-only queries
✅ **EXPLAIN ANALYZE** queries provided for performance testing
✅ **Index maintenance** queries documented
✅ **Real-world performance** expectations explained

**Expected performance:**
- Booking number lookup: **<5ms**
- Phone + booking number lookup: **<5ms**
- Email lookup: **<5ms**
- Recent bookings list: **<50ms**

**Test locally:**
```bash
supabase db reset
# Open http://localhost:54323 → SQL Editor
# Paste EXPLAIN ANALYZE queries to verify indexes
```
