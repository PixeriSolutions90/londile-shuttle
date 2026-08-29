-- ============================================================================
-- DIAGNOSTIC ONLY — makes no changes, safe to run any number of times.
-- Copy the entire result grid back (all rows) so we get ground truth in
-- one shot instead of debugging one error at a time.
-- ============================================================================

SELECT 'TABLE' AS section, table_name AS detail, NULL AS extra
FROM information_schema.tables
WHERE table_schema = 'public'

UNION ALL

SELECT 'BOOKINGS COLUMN', column_name, data_type || CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'bookings'

UNION ALL

SELECT 'PRICING_RULES COLUMN', column_name, data_type || CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'pricing_rules'

UNION ALL

SELECT 'BOOKINGS FK', att.attname, cl.relname
FROM pg_constraint con
JOIN pg_attribute att ON att.attnum = ANY(con.conkey) AND att.attrelid = con.conrelid
JOIN pg_class cl ON cl.oid = con.confrelid
WHERE con.conrelid = 'public.bookings'::regclass AND con.contype = 'f'

ORDER BY 1, 2;
