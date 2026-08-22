# Vehicles & Pricing Management

## Overview

The platform allows admins to dynamically manage the fleet and pricing rules without code changes. Three core entities drive fare calculation:

1. **Vehicles** — Fleet inventory with capacity constraints
2. **Zones** — Geographic service areas (local, regional, international)
3. **Pricing Rules** — Vehicle + zone = base fee + optional per-km rate

This design enables flexible, real-time pricing adjustments and fleet management.

---

## Vehicles

### Data Model

```sql
vehicles TABLE:
  id (UUID, PK)
  name (UNIQUE) — e.g., "Comfort Sedan", "Luxury Van"
  vehicle_class (enum) — economy | comfort | luxury | van | minibus
  max_passengers (1-8)
  max_bags (≥0)
  description (optional)
  image_url (optional) — Profile image for booking UI
  registration_number (UNIQUE, optional) — License plate
  is_active (boolean) — Soft delete flag
  notes (optional) — Internal notes
```

### Vehicle Classes

| Class | Passengers | Bags | Example Use | Typical Fare Base |
|-------|-----------|------|-------------|-----------------|
| **Economy** | 4 | 1 | Budget rides | R500–R600 |
| **Comfort** | 4 | 2 | Standard bookings | R730 (per mockup) |
| **Luxury** | 4 | 3 | Premium bookings | R950+ |
| **Van** | 6 | 4 | Small groups, families | R1,200+ |
| **Minibus** | 8 | 6 | Tours, large groups | R1,500+ |

### API: Manage Vehicles

**Endpoint:** `/api/admin/vehicles`

#### GET All Vehicles (Admin)
```bash
curl -X GET http://localhost:3000/api/admin/vehicles \
  -H "Authorization: Bearer <token>" \
  -H "x-user-role: admin"
```

**Response:**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Comfort Sedan",
    "vehicle_class": "comfort",
    "max_passengers": 4,
    "max_bags": 2,
    "description": "Standard sedan for up to 4 passengers",
    "image_url": "https://...",
    "registration_number": "JHB-123-GP",
    "is_active": true,
    "created_at": "2025-08-22T10:30:00Z"
  }
]
```

#### POST Create Vehicle
```bash
curl -X POST http://localhost:3000/api/admin/vehicles \
  -H "Content-Type: application/json" \
  -H "x-user-role: admin" \
  -d '{
    "name": "Luxury SUV",
    "vehicle_class": "luxury",
    "max_passengers": 4,
    "max_bags": 3,
    "description": "Premium SUV with leather seating",
    "registration_number": "JHB-456-GP"
  }'
```

**Response:**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "name": "Luxury SUV",
  "vehicle_class": "luxury",
  "max_passengers": 4,
  "max_bags": 3,
  "is_active": true,
  "created_at": "2025-08-22T11:00:00Z"
}
```

#### PUT Update Vehicle
```bash
curl -X PUT http://localhost:3000/api/admin/vehicles \
  -H "Content-Type: application/json" \
  -H "x-user-role: admin" \
  -d '{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "max_bags": 3,
    "description": "Updated: Now with extra luggage space"
  }'
```

#### DELETE Deactivate Vehicle (Soft Delete)
```bash
curl -X DELETE http://localhost:3000/api/admin/vehicles \
  -H "Content-Type: application/json" \
  -H "x-user-role: admin" \
  -d '{
    "id": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

Sets `is_active = false`. Does NOT delete the record (preserves history).

---

## Zones

### Data Model

```sql
zones TABLE:
  id (UUID, PK)
  name (UNIQUE) — e.g., "Cape Town Local", "Johannesburg"
  description (optional)
  is_international (boolean) — TRUE if outside South Africa
  country_code (optional) — ISO 3166-1 alpha-2 (e.g., 'ZA', 'NA', 'BW')
  min_latitude, max_latitude (optional) — Geographic bounds
  min_longitude, max_longitude (optional)
  is_active (boolean)
```

### Predefined Zones (Recommendations)

| Zone | International | Description |
|------|---------------|-------------|
| Cape Town Local | NO | Within Greater Cape Town metro |
| Western Cape Regional | NO | Stellenbosch, Franschhoek, Hermanus, Tulbagh |
| Johannesburg | NO | Gauteng Province |
| Durban | NO | KwaZulu-Natal Province |
| Southern Africa | YES | Namibia, Botswana, Lesotho |
| International | YES | Other countries (premium pricing) |

### API: Manage Zones

**Endpoint:** `/api/admin/zones`

#### GET All Zones (Admin)
```bash
curl -X GET http://localhost:3000/api/admin/zones \
  -H "x-user-role: admin"
```

#### POST Create Zone
```bash
curl -X POST http://localhost:3000/api/admin/zones \
  -H "Content-Type: application/json" \
  -H "x-user-role: admin" \
  -d '{
    "name": "Cape Town Local",
    "description": "Within Greater Cape Town metro (0-50km)",
    "is_international": false,
    "country_code": "ZA",
    "min_latitude": -34.22,
    "max_latitude": -33.82,
    "min_longitude": 18.35,
    "max_longitude": 18.95
  }'
```

#### PUT Update Zone
```bash
curl -X PUT http://localhost:3000/api/admin/zones \
  -H "Content-Type: application/json" \
  -H "x-user-role: admin" \
  -d '{
    "id": "zone-uuid",
    "description": "Updated boundaries"
  }'
```

#### DELETE Deactivate Zone
```bash
curl -X DELETE http://localhost:3000/api/admin/zones \
  -H "Content-Type: application/json" \
  -H "x-user-role: admin" \
  -d '{"id": "zone-uuid"}'
```

---

## Pricing Rules

### Data Model

```sql
pricing_rules TABLE:
  id (UUID, PK)
  vehicle_id (FK) — Which vehicle
  zone_id (FK) — Which zone
  base_fee (DECIMAL) — Starting price (required)
  per_km_rate (DECIMAL, nullable) — Optional: add per-km charge
  return_trip_multiplier (DECIMAL) — Default 1.5 (50% premium for returns)
  is_active (boolean)
  notes (optional)
  
  UNIQUE (vehicle_id, zone_id) — Only one active rule per vehicle/zone
```

### Pricing Model

**Flat Rate:**
```
Customer books Comfort Sedan in Cape Town Local
→ base_fee: R730
→ Total for 1-way: R730
```

**Per-KM (Distance-Based):**
```
Customer books Comfort Sedan in Johannesburg
→ base_fee: R850
→ per_km_rate: R6.00
→ Estimated distance: 25 km
→ Subtotal: 850 + (25 × 6) = R1,000

If return trip → R1,000 × 1.5 = R1,500
```

### Predefined Pricing (Example Fleet)

| Vehicle | Zone | Base Fee | Per-KM | Return × |
|---------|------|----------|--------|----------|
| Comfort Sedan | Cape Town Local | R730 | R5.50 | 1.5× |
| Comfort Sedan | Western Cape Regional | R850 | R6.00 | 1.4× |
| Luxury Sedan | Cape Town Local | R950 | R6.50 | 1.5× |
| Minivan | Cape Town Local | R1,200 | R7.00 | 1.4× |

### API: Manage Pricing

**Endpoint:** `/api/admin/pricing`

#### GET All Pricing Rules (Admin)
```bash
curl -X GET http://localhost:3000/api/admin/pricing \
  -H "x-user-role: admin"
```

**Response (includes vehicle/zone details):**
```json
[
  {
    "id": "pricing-uuid",
    "vehicle_id": "550e8400-e29b-41d4-a716-446655440000",
    "zone_id": "660e8400-e29b-41d4-a716-446655440002",
    "base_fee": 730.00,
    "per_km_rate": 5.50,
    "return_trip_multiplier": 1.5,
    "is_active": true,
    "notes": "Standard weekday pricing",
    "vehicles": {
      "name": "Comfort Sedan",
      "vehicle_class": "comfort"
    },
    "zones": {
      "name": "Cape Town Local",
      "is_international": false
    },
    "created_at": "2025-08-22T10:30:00Z"
  }
]
```

#### POST Create Pricing Rule
```bash
curl -X POST http://localhost:3000/api/admin/pricing \
  -H "Content-Type: application/json" \
  -H "x-user-role: admin" \
  -d '{
    "vehicle_id": "550e8400-e29b-41d4-a716-446655440000",
    "zone_id": "660e8400-e29b-41d4-a716-446655440002",
    "base_fee": 730.00,
    "per_km_rate": 5.50,
    "return_trip_multiplier": 1.5,
    "notes": "Standard weekday pricing for Comfort Sedan in Cape Town"
  }'
```

#### PUT Update Pricing Rule
```bash
curl -X PUT http://localhost:3000/api/admin/pricing \
  -H "Content-Type: application/json" \
  -H "x-user-role: admin" \
  -d '{
    "id": "pricing-uuid",
    "base_fee": 750.00,
    "per_km_rate": 5.75,
    "notes": "Increased pricing effective 2025-09-01"
  }'
```

**When to use:**
- Seasonal pricing adjustments
- Peak hour multipliers
- Response to fuel cost changes
- Promotional discounts

#### DELETE Deactivate Pricing Rule
```bash
curl -X DELETE http://localhost:3000/api/admin/pricing \
  -H "Content-Type: application/json" \
  -H "x-user-role: admin" \
  -d '{"id": "pricing-uuid"}'
```

---

## Fare Calculation Function

### Database Function: `calculate_fare()`

```sql
SELECT * FROM calculate_fare(
  p_vehicle_id := 'vehicle-uuid',
  p_zone_id := 'zone-uuid',
  p_is_return_trip := true,
  p_estimated_km := 25.0
);
```

**Response:**
```
base_fee: 730.00
per_km_charge: 137.50 (25 × 5.50)
subtotal: 867.50
return_multiplier: 1.5
total_fare: 1301.25
```

**Used by:**
- Quote generation endpoints (show customer what they'll pay)
- Booking creation (price snapshot stored at booking time)
- Admin reports (fare breakdown analysis)

### Never Recalculate After Booking

Once a booking is created:
1. Price snapshot stored in `bookings.base_fare`, `bookings.addons_fee`, `bookings.total_fare`
2. Admin pricing rule changes do **NOT** affect existing bookings
3. Existing bookings are grandfathered at the price they were quoted at booking time

This protects customer trust and prevents disputes over changing prices.

---

## Addons (Optional Extras)

### Data Model

```sql
addons TABLE:
  id (UUID, PK)
  name (UNIQUE) — e.g., "Baby Seat", "WiFi Hotspot"
  fee (DECIMAL) — Price of addon
  description (optional)
  is_active (boolean)

booking_addons TABLE:
  id (UUID, PK)
  booking_id (FK)
  addon_id (FK)
  fee_at_booking (DECIMAL) — Price snapshot at booking time
  UNIQUE(booking_id, addon_id) — No duplicate addons per booking
```

### Available Addons (Recommendations)

| Addon | Fee | Use Case |
|-------|-----|----------|
| Baby Seat (0-9mo) | R150 | Infants |
| Child Booster (9mo-4yr) | R100 | Toddlers |
| WiFi Hotspot | R50 | Business/connectivity |
| Luggage Trailer | R200 | Extra baggage |

### API: Manage Addons

**Endpoint:** `/api/admin/addons` (to be implemented)

---

## Admin Panel UI Tasks

### Required Components (Not Yet Built)

1. **Vehicles Manager**
   - Table: Name, Class, Passengers, Bags, Status
   - Actions: Add, Edit, Deactivate
   - Filter: Active/Inactive

2. **Zones Manager**
   - Table: Name, International, Status
   - Actions: Add, Edit, Deactivate
   - Filter: By international flag

3. **Pricing Manager**
   - Table: Vehicle, Zone, Base Fee, Per-KM, Return ×, Status
   - Actions: Add, Edit, Deactivate
   - Filters: By vehicle class, zone

4. **Addons Manager**
   - Table: Name, Fee, Status
   - Actions: Add, Edit, Deactivate

---

## Security

### Role-Based Access

- **Public:** Can read active vehicles, zones, pricing (for quotes)
- **Admins:** Can create, read, update, deactivate vehicles, zones, pricing
- **Guests:** Cannot access any admin endpoints

### RLS Policies

```sql
-- Vehicles: Anyone reads active; Admins manage all
CREATE POLICY "Anyone can read active vehicles" ON vehicles
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Admins can manage vehicles" ON vehicles
  FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
```

Same pattern for zones, pricing_rules, addons.

### Price Immutability

Pricing rules updates affect **only future bookings**. Historical bookings retain their original fare snapshots.

---

## Testing

### 1. Create a Zone
```bash
curl -X POST http://localhost:3000/api/admin/zones \
  -H "Content-Type: application/json" \
  -H "x-user-role: admin" \
  -d '{
    "name": "Test Zone",
    "is_international": false
  }'
```

Note the returned `zone_id`.

### 2. Create a Vehicle
```bash
curl -X POST http://localhost:3000/api/admin/vehicles \
  -H "Content-Type: application/json" \
  -H "x-user-role: admin" \
  -d '{
    "name": "Test Sedan",
    "vehicle_class": "comfort",
    "max_passengers": 4,
    "max_bags": 2
  }'
```

Note the returned `vehicle_id`.

### 3. Create a Pricing Rule
```bash
curl -X POST http://localhost:3000/api/admin/pricing \
  -H "Content-Type: application/json" \
  -H "x-user-role: admin" \
  -d '{
    "vehicle_id": "<vehicle_id>",
    "zone_id": "<zone_id>",
    "base_fee": 730.00,
    "per_km_rate": 5.50
  }'
```

### 4. Calculate Fare
```sql
SELECT * FROM calculate_fare(
  '<vehicle_id>'::uuid,
  '<zone_id>'::uuid,
  false,  -- not a return trip
  0       -- no distance estimate
);
```

Should return:
```
base_fee: 730.00
per_km_charge: 0.00
subtotal: 730.00
return_multiplier: 1
total_fare: 730.00
```

---

## Future Enhancements

1. **Seasonal Pricing** — Add `season_name`, `start_date`, `end_date` to pricing rules
2. **Surge Pricing** — Multiplier during peak hours/dates
3. **Loyalty Discounts** — Track repeat customers, apply discounts
4. **Corporate Rates** — Special pricing for business accounts
5. **Dynamic Pricing** — Adjust fares based on demand
6. **Fuel Surcharges** — Percentage-based adjustments for fuel costs

---

## Summary

✅ **Fully admin-configurable:**
- No code changes to adjust fleet or pricing
- Immediate effect on all new bookings
- Historical bookings unaffected (price snapshots)
- Soft deletes preserve audit trail

✅ **Flexible pricing:**
- Flat rates or distance-based
- Return trip premiums
- Per-vehicle, per-zone combinations
- Addons for extras (baby seat, WiFi, etc.)

✅ **Secure:**
- Admin-only access
- RLS policies enforced
- Price immutability after booking
