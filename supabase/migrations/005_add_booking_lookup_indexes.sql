-- ============================================================================
-- PHASE 5: Booking Lookup Indexes
-- Add guest email field and optimize query performance for booking lookups
-- ============================================================================

-- ============================================================================
-- ADD EMAIL FIELD TO BOOKINGS (if not exists)
-- ============================================================================

-- Add guest_email column for email-based lookups
-- This allows customers to search bookings by: booking number, phone, OR email
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS guest_email TEXT;

-- ============================================================================
-- CREATE INDEXES FOR FAST BOOKING LOOKUPS
-- ============================================================================

-- Index on booking_number (exact lookup by code)
-- Already exists, but verify it's in place
-- Migration will skip if index already exists due to IF NOT EXISTS
CREATE INDEX IF NOT EXISTS bookings_booking_number_idx ON bookings(booking_number);

-- Index on guest_contact (lookup by phone number)
-- Supports guest booking searches by contact number
CREATE INDEX IF NOT EXISTS bookings_guest_contact_idx ON bookings(guest_contact);

-- Index on guest_email (lookup by email address)
-- Supports guest booking searches by email
CREATE INDEX IF NOT EXISTS bookings_guest_email_idx ON bookings(guest_email);

-- Composite index: (guest_contact, booking_number)
-- Optimizes the common pattern: WHERE guest_contact = ? AND booking_number = ?
-- Used in booking lookup workflow
CREATE INDEX IF NOT EXISTS bookings_contact_number_idx
  ON bookings(guest_contact, booking_number);

-- Composite index: (guest_email, booking_number)
-- Optimizes email + booking number lookup
CREATE INDEX IF NOT EXISTS bookings_email_number_idx
  ON bookings(guest_email, booking_number);

-- Index on status (for filtering active bookings)
-- Supports queries like: WHERE status != 'cancelled' AND created_at > ?
CREATE INDEX IF NOT EXISTS bookings_status_idx ON bookings(status);

-- Index on created_at (for time-based queries)
-- Supports recent booking queries
CREATE INDEX IF NOT EXISTS bookings_created_at_idx ON bookings(created_at DESC);

-- Partial index: active bookings only
-- Optimizes lookup queries that exclude cancelled bookings
-- Smaller index = faster scans
CREATE INDEX IF NOT EXISTS bookings_active_lookups_idx
  ON bookings(guest_contact, booking_number)
  WHERE status IN ('pending', 'confirmed', 'completed');

-- ============================================================================
-- INDEX PERFORMANCE NOTES
-- ============================================================================

-- After seeding test data, verify index usage with:
--
-- 1. Booking number lookup (most common):
--    EXPLAIN ANALYZE
--    SELECT * FROM bookings
--    WHERE booking_number = 'LS-00001';
--
-- 2. Phone + booking number lookup (booking modification flow):
--    EXPLAIN ANALYZE
--    SELECT * FROM bookings
--    WHERE guest_contact = '+27123456789' AND booking_number = 'LS-00001';
--
-- 3. Email + booking number lookup (email verification):
--    EXPLAIN ANALYZE
--    SELECT * FROM bookings
--    WHERE guest_email = 'user@example.com' AND booking_number = 'LS-00001';
--
-- 4. Recent active bookings (dashboard):
--    EXPLAIN ANALYZE
--    SELECT * FROM bookings
--    WHERE status IN ('pending', 'confirmed', 'completed')
--    AND created_at > NOW() - INTERVAL '30 days'
--    ORDER BY created_at DESC
--    LIMIT 10;
--
-- Expected output: "Seq Scan" should become "Index Scan" or "Index Only Scan"
-- If still "Seq Scan", the index may not be selective enough (too many matching rows)

-- ============================================================================
-- INDEX USAGE STATISTICS
-- ============================================================================

-- View all indexes on bookings table:
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'bookings';

-- View index usage statistics:
-- SELECT
--   schemaname,
--   tablename,
--   indexname,
--   idx_scan as index_scans,
--   idx_tup_read as tuples_read,
--   idx_tup_fetch as tuples_fetched
-- FROM pg_stat_user_indexes
-- WHERE tablename = 'bookings'
-- ORDER BY idx_scan DESC;

-- Unused indexes (candidates for removal):
-- SELECT
--   schemaname,
--   tablename,
--   indexname,
--   idx_scan
-- FROM pg_stat_user_indexes
-- WHERE tablename = 'bookings' AND idx_scan = 0;
