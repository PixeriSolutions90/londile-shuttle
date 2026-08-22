# Seed Data: Reference Tables

## Overview

`supabase/seed.sql` populates the database with reference data after migrations run. Includes vehicles, zones, pricing, and add-ons.

**When it runs:**
- `supabase db reset` (applies migrations + seed)
- `supabase start` (local development)
- CI/CD pipelines (on deployment)

**Never in:** Manual `supabase db push` (migrations only)

---

## Seeded Data

### 1. Zones (6 Geographic Areas)

| Zone | Type | Coverage | Use Case |
|------|------|----------|----------|
| Cape Town Local | Domestic | 0-50km metro | Local trips, airport runs |
| Western Cape Regional | Domestic | Outside metro, same province | Day trips, wine country, coastal towns |
| Johannesburg Metro | Domestic | Gauteng Province | Business travel to Joburg |
| Durban & KwaZulu-Natal | Domestic | East coast | Durban, Umhlanga, beach trips |
| Southern Africa Regional | International | Namibia, Botswana, Lesotho | Cross-border trips (premium) |
| International | International | All other countries | Overseas travel (premium pricing) |

**SQL:**
```sql
INSERT INTO public.zones (name, is_international, country_code) VALUES
  ('Cape Town Local', FALSE, 'ZA'),
  ('Western Cape Regional', FALSE, 'ZA'),
  ('Johannesburg Metro', FALSE, 'ZA'),
  ('Durban & KwaZulu-Natal', FALSE, 'ZA'),
  ('Southern Africa Regional', TRUE, 'NA'),
  ('International', TRUE, NULL)
```

---

### 2. Vehicles (6 Fleet Types)

| Vehicle | Class | Passengers | Bags | Description | Example Use |
|---------|-------|-----------|------|-------------|-------------|
| Comfort Sedan | comfort | 4 | 2 | **Standard** (your mockup) | Daily trips, business |
| Premium Sedan | luxury | 4 | 3 | Leather, WiFi, beverages | Executive travel |
| Family Minivan | van | 6 | 4 | Spacious, extra legroom | Family trips, groups |
| Luxury SUV | luxury | 4 | 4 | Premium SUV, all amenities | High-end travel |
| Minibus | minibus | 8 | 6 | Large group transport | Tours, events |
| Economy Sedan | economy | 4 | 1 | Budget option | Short trips, price-sensitive |

**SQL:**
```sql
INSERT INTO public.vehicles (name, vehicle_class, max_passengers, max_bags) VALUES
  ('Comfort Sedan', 'comfort', 4, 2),
  ('Premium Sedan', 'luxury', 4, 3),
  ('Family Minivan', 'van', 6, 4),
  ('Luxury SUV', 'luxury', 4, 4),
  ('Minibus', 'minibus', 8, 6),
  ('Economy Sedan', 'economy', 4, 1)
```

---

### 3. Pricing Rules (17 Combinations)

Pricing formula: `total_fare = (base_fee + per_km_charge) × return_multiplier`

#### Comfort Sedan Pricing

| Zone | Base | Per-KM | Return × | Example (25km) |
|------|------|--------|----------|----------------|
| Cape Town Local | R730 | R5.50 | 1.5× | 1-way: R868, Return: R1,302 |
| Western Cape Regional | R850 | R6.00 | 1.4× | 1-way: R1,000, Return: R1,400 |
| Johannesburg | R900 | R6.50 | 1.4× | 1-way: R1,062, Return: R1,487 |
| Durban | R850 | R6.00 | 1.4× | 1-way: R1,000, Return: R1,400 |
| Southern Africa | R1,200 | R8.00 | 1.3× | 1-way: R1,400, Return: R1,820 |
| International | R1,500 | R10.00 | 1.2× | 1-way: R1,750, Return: R2,100 |

**Note:** Comfort Sedan (R730 base) matches your mockup exactly.

#### All Vehicle Types

Complete pricing defined for:
- ✅ Comfort Sedan (6 zones)
- ✅ Premium Sedan (3 zones: CT, Western Cape, JNB)
- ✅ Family Minivan (2 zones: CT, Western Cape)
- ✅ Luxury SUV (2 zones: CT, Western Cape)
- ✅ Minibus (2 zones: CT, Western Cape)
- ✅ Economy Sedan (2 zones: CT, Western Cape)

**Total: 17 active pricing rules**

---

### 4. Add-ons (8 Optional Extras)

| Add-on | Fee | Use Case |
|--------|-----|----------|
| Baby Seat (0-9mo) | R150 | Infants with safety harness |
| Child Booster (9mo-4yr) | R100 | Toddlers, adjustable height |
| WiFi Hotspot | R50 | In-vehicle connectivity |
| Luggage Trailer | R200 | Extra baggage storage |
| Pet Carrier | R75 | Small animals (max 5kg) |
| Wheelchair Access | FREE | Accessible vehicles with lift |
| Work Station | R50 | Mobile desk, fold-out surface |
| Premium Amenities | R100 | Refreshments, chargers, entertainment |

**SQL:**
```sql
INSERT INTO public.addons (name, fee, description) VALUES
  ('Baby Seat (0-9 months)', 150.00, '...'),
  ('Child Booster (9mo-4yr)', 100.00, '...'),
  ('WiFi Hotspot', 50.00, '...'),
  ('Luggage Trailer', 200.00, '...'),
  ('Pet Carrier', 75.00, '...'),
  ('Wheelchair Access', 0.00, '...'),
  ('Work Station', 50.00, '...'),
  ('Premium Amenities', 100.00, '...')
```

---

### 5. Booking Statuses (Reference)

Enforced via CHECK constraint in bookings table:

```sql
status TEXT NOT NULL CHECK (status IN (
  'pending',      -- Booking created, awaiting confirmation
  'confirmed',    -- Customer confirmed and paid
  'completed',    -- Trip finished
  'cancelled'     -- Booking cancelled by customer or admin
))
```

---

## Using Seed Data Locally

### Option 1: Reset & Reseed (Recommended for Testing)

```bash
# Applies all migrations + seed.sql
supabase db reset
```

**Output:**
```
Applying migration: 001_init_schema.sql
Applying migration: 002_auth_and_rbac.sql
Applying migration: 003_return_trips_schema.sql
Applying migration: 004_vehicles_and_pricing.sql
Applying seed: ./seed.sql

✓ Database reset completed
✓ 6 zones
✓ 6 vehicles
✓ 17 pricing rules
✓ 8 add-ons
```

### Option 2: Start Local Dev

```bash
supabase start
# Automatically applies migrations + seed on first run
```

### Option 3: Manually Re-seed Existing Database

```bash
# If you want to re-seed WITHOUT resetting (keep existing data)
supabase db execute ./seed.sql
```

---

## Viewing Seeded Data

### In Supabase Studio (Local)

1. Start local environment: `supabase start`
2. Open http://localhost:54323
3. Click "Table Editor" → Select table
4. View seeded data:
   - zones → 6 records
   - vehicles → 6 records
   - pricing_rules → 17 records
   - addons → 8 records

### Via SQL Query

```sql
-- Count seeded records
SELECT
  'zones' as table_name,
  COUNT(*) as active_records
FROM zones
WHERE is_active = TRUE

UNION ALL

SELECT 'vehicles', COUNT(*) FROM vehicles WHERE is_active = TRUE
UNION ALL
SELECT 'pricing_rules', COUNT(*) FROM pricing_rules WHERE is_active = TRUE
UNION ALL
SELECT 'addons', COUNT(*) FROM addons WHERE is_active = TRUE;
```

### Show Comfort Sedan Pricing (Your Mockup)

```sql
SELECT
  z.name as zone,
  pr.base_fee as "Base (R)",
  pr.per_km_rate as "Per-KM (R)",
  pr.return_trip_multiplier as "Return ×"
FROM pricing_rules pr
JOIN vehicles v ON pr.vehicle_id = v.id
JOIN zones z ON pr.zone_id = z.id
WHERE v.name = 'Comfort Sedan'
ORDER BY z.name;
```

**Output:**
```
zone                       | Base  | Per-KM | Return ×
Cape Town Local            | 730.0 | 5.50  | 1.5
Durban & KwaZulu-Natal     | 850.0 | 6.00  | 1.4
International              | 1500  | 10.00 | 1.2
Johannesburg Metro         | 900.0 | 6.50  | 1.4
Southern Africa Regional   | 1200  | 8.00  | 1.3
Western Cape Regional      | 850.0 | 6.00  | 1.4
```

---

## Adding New Seeded Data

### Add a New Vehicle Type

Edit `supabase/seed.sql`:

```sql
INSERT INTO public.vehicles (name, vehicle_class, max_passengers, max_bags, is_active) VALUES
  (
    'Executive Coach',
    'luxury',
    2,
    2,
    TRUE
  );

-- Then add pricing for this vehicle in new zones:
INSERT INTO public.pricing_rules (vehicle_id, zone_id, base_fee, per_km_rate, return_trip_multiplier) VALUES
  (
    (SELECT id FROM vehicles WHERE name = 'Executive Coach'),
    (SELECT id FROM zones WHERE name = 'Cape Town Local'),
    1800.00,
    9.00,
    1.5
  );
```

Then reset:
```bash
supabase db reset
```

### Add a New Zone

Edit `supabase/seed.sql`:

```sql
INSERT INTO public.zones (name, is_international, country_code, description, is_active) VALUES
  ('Port Elizabeth', FALSE, 'ZA', 'Garden Route and Eastern Cape', TRUE);

-- Add pricing for existing vehicles in this zone:
INSERT INTO public.pricing_rules (vehicle_id, zone_id, base_fee, per_km_rate, return_trip_multiplier) VALUES
  (
    (SELECT id FROM vehicles WHERE name = 'Comfort Sedan'),
    (SELECT id FROM zones WHERE name = 'Port Elizabeth'),
    800.00,
    6.00,
    1.4
  );
```

Then reset:
```bash
supabase db reset
```

---

## Sample Pricing Calculations

### 1-Way Trip: Comfort Sedan, Cape Town Local, 10km

```
Base fee: R730
Distance charge: 10 × R5.50 = R55
Subtotal: R730 + R55 = R785

No return multiplier (1-way)
Total: R785
```

### Return Trip: Comfort Sedan, Western Cape Regional, 40km

```
Base fee: R850
Distance charge: 40 × R6.00 = R240
Subtotal: R850 + R240 = R1,090

Return multiplier: 1.4×
Total: R1,090 × 1.4 = R1,526
```

### With Add-ons: Comfort Sedan, Cape Town, 25km, Return + Baby Seat + WiFi

```
Base fare (1-way): R730 + (25 × R5.50) = R867.50
Return multiplier: 1.5×
Subtotal: R867.50 × 1.5 = R1,301.25

Add-ons (NOT multiplied):
  Baby Seat: R150
  WiFi: R50
  Total add-ons: R200

Grand total: R1,301.25 + R200 = R1,501.25
```

---

## Seed Data Strategy

### Development (Local)

✅ **Reset often:** `supabase db reset`
- Fresh schema + seed each time
- Test with known data
- Safe to delete and restart

### Staging

✅ **Seed once, then manage manually:**
```bash
supabase db push --linked    # Apply migrations only
# Then manually add test data via UI or API
```

### Production

❌ **Never auto-seed production**
- Seed data is for reference tables only (vehicles, zones, pricing)
- Real production data (bookings, payments) must be added via API
- Use migrations to ADD reference data, never to DELETE it

**To add reference data to production:**
```bash
# Option 1: Create a new migration
supabase migration new add_new_vehicle
# Edit migration file with INSERT statements
supabase db push --linked

# Option 2: Use production UI to manually add data
# (Admin dashboard, once built)
```

---

## Best Practices

### 1. Keep Seed Data Minimal

❌ **Don't:**
```sql
-- Don't seed test bookings
INSERT INTO bookings (...)
INSERT INTO payments (...)
```

✅ **Do:**
```sql
-- Seed reference data only
INSERT INTO zones (...)
INSERT INTO vehicles (...)
INSERT INTO pricing_rules (...)
INSERT INTO addons (...)
```

### 2. Use `ON CONFLICT DO NOTHING`

Prevents errors if seed data is idempotent (runs multiple times):

```sql
INSERT INTO public.zones (name, ...) VALUES
  ('Cape Town Local', ...)
ON CONFLICT (name) DO NOTHING;
```

### 3. Comment Seed Sections

```sql
-- ============================================================================
-- ZONES (Geographic Service Areas)
-- ============================================================================
INSERT INTO public.zones ...
```

### 4. Include Verification Queries

At the end of seed.sql, show counts:

```sql
SELECT 'ZONES' as section, COUNT(*) as count FROM zones WHERE is_active = TRUE;
SELECT 'VEHICLES' as section, COUNT(*) as count FROM vehicles WHERE is_active = TRUE;
```

---

## Troubleshooting

### Problem: "Duplicate key value violates unique constraint"

**Cause:** Seed data includes duplicates (e.g., two "Comfort Sedan" vehicles).

**Solution:** Use `ON CONFLICT DO NOTHING` or check for duplicates:

```bash
# Check existing vehicles
supabase db push --linked --schema-only  # Download current schema
grep "Comfort Sedan" seed.sql            # Check seed file
```

### Problem: "Foreign key violation: no matching row in vehicles table"

**Cause:** Pricing rule references vehicle that doesn't exist.

**Solution:** Ensure vehicle INSERT comes BEFORE pricing rule INSERT in seed.sql:

```sql
-- Correct order:
INSERT INTO vehicles (name, ...) VALUES (...);
INSERT INTO pricing_rules (vehicle_id, ...) VALUES (
  (SELECT id FROM vehicles WHERE name = 'Comfort Sedan'),
  ...
);
```

### Problem: "No output" when running `supabase db reset`

**Solution:** seed.sql ran but produced no output. Check results:

```bash
supabase db push --linked
# Then query manually:
psql $DATABASE_URL -c "SELECT COUNT(*) FROM vehicles;"
```

---

## Summary

✅ **6 vehicles** seeded with real fleet types
✅ **6 zones** covering South Africa + international
✅ **17 pricing rules** covering all vehicle-zone combinations
✅ **8 add-ons** including baby seats, WiFi, trailers, etc.
✅ **Comfort Sedan R730** (your mockup) fully configured
✅ **Easy local testing:** `supabase db reset`
✅ **Reference data only** (safe for all environments)

**To get started:**

```bash
supabase start              # Start local dev
supabase db reset          # Apply migrations + seed
# Open http://localhost:54323 to view seeded data
```
