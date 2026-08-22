# Add-ons & Pricing

## Overview

Add-ons are optional extras that customers can select during booking:
- Baby seat (R150)
- Child booster (R100)
- WiFi hotspot (R50)
- Luggage trailer (R200)
- Custom add-ons (admin-configured)

Each add-on has a **flat fee** that's added to the booking total. Prices are **snapshotted at booking time** and never change if the admin adjusts add-on pricing later.

---

## Data Model

### Addons Table

```sql
addons TABLE:
  id (UUID, PK)
  name (TEXT, UNIQUE) — "Baby Seat", "WiFi", etc.
  fee (DECIMAL) — Price in ZAR (>0)
  description (TEXT, optional)
  notes (TEXT, optional) — Internal notes
  is_active (BOOLEAN) — Soft delete
  created_at, updated_at
```

### Booking Addons (Junction Table)

```sql
booking_addons TABLE:
  id (UUID, PK)
  booking_id (FK) — References booking
  addon_id (FK) — References addon
  fee_at_booking (DECIMAL) — Price snapshot at booking time
  UNIQUE(booking_id, addon_id) — No duplicate addons per booking
  created_at
```

**Why snapshot the price?**
- If admin changes addon fee from R150 → R200 later, existing bookings stay at R150
- Customers see the exact price they agreed to
- No disputes over retroactive price changes

---

## Pricing Examples

### Scenario 1: Base Fare Only

```
Booking: Cape Town → Stellenbosch, Comfort Sedan
- Base fare: R730
- Add-ons: None
- Total: R730
```

### Scenario 2: Base Fare + 1 Add-on

```
Booking: Same route + Baby Seat
- Base fare: R730
- Baby seat: R150
- Total: R730 + R150 = R880
```

### Scenario 3: Base Fare + Multiple Add-ons

```
Booking: Same route + Baby Seat + WiFi
- Base fare: R730
- Baby seat: R150
- WiFi hotspot: R50
- Total: R730 + R150 + R50 = R930
```

### Scenario 4: Return Trip with Add-ons

```
Booking: Return trip, Comfort Sedan, Baby Seat
- Base fare: R730
- Return multiplier: 1.5×
- Subtotal: R730 × 1.5 = R1,095
- Baby seat: R150 (NOT multiplied)
- Total: R1,095 + R150 = R1,245
```

**Note:** Add-on fees are **NOT** multiplied by the return trip multiplier. You pay one baby seat fee for the entire journey, not twice.

---

## Admin API: Manage Add-ons

### Endpoint: `/api/admin/addons`

Requires: `Authorization: Bearer <token>` + `x-user-role: admin`

#### GET All Add-ons (Admin View)

```bash
curl -X GET http://localhost:3000/api/admin/addons \
  -H "x-user-role: admin"
```

**Response:**
```json
[
  {
    "id": "addon-uuid-1",
    "name": "Baby Seat",
    "fee": 150.00,
    "description": "Infant car seat (0-9 months)",
    "notes": "Available in all vehicle classes",
    "is_active": true,
    "created_at": "2025-08-22T10:00:00Z"
  },
  {
    "id": "addon-uuid-2",
    "name": "WiFi Hotspot",
    "fee": 50.00,
    "description": "In-vehicle WiFi connectivity",
    "is_active": true,
    "created_at": "2025-08-22T10:05:00Z"
  }
]
```

#### POST Create Add-on

```bash
curl -X POST http://localhost:3000/api/admin/addons \
  -H "Content-Type: application/json" \
  -H "x-user-role: admin" \
  -d '{
    "name": "Pet Carrier",
    "fee": 100.00,
    "description": "Secure pet carrier for small animals",
    "notes": "Max 1 pet per booking"
  }'
```

#### PUT Update Add-on

```bash
curl -X PUT http://localhost:3000/api/admin/addons \
  -H "Content-Type: application/json" \
  -H "x-user-role: admin" \
  -d '{
    "id": "addon-uuid-1",
    "fee": 175.00,
    "notes": "Price increased from R150 → R175 due to supply costs"
  }'
```

**Only affects NEW bookings.** Existing bookings retain their original snapshotted price.

#### DELETE Deactivate Add-on

```bash
curl -X DELETE http://localhost:3000/api/admin/addons \
  -H "Content-Type: application/json" \
  -H "x-user-role: admin" \
  -d '{"id": "addon-uuid-1"}'
```

Sets `is_active = false`. Existing bookings with this add-on are unaffected.

---

## Customer API: Select Add-ons

### Endpoint: `/api/addons/list` (Public)

**No auth required** — Anyone can see available add-ons for the booking form.

```bash
curl -X GET http://localhost:3000/api/addons/list
```

**Response:**
```json
[
  {
    "id": "addon-uuid-1",
    "name": "Baby Seat",
    "fee": 150.00,
    "description": "Infant car seat (0-9 months)"
  },
  {
    "id": "addon-uuid-2",
    "name": "WiFi Hotspot",
    "fee": 50.00,
    "description": "In-vehicle WiFi for your journey"
  },
  {
    "id": "addon-uuid-3",
    "name": "Luggage Trailer",
    "fee": 200.00,
    "description": "Additional luggage storage"
  }
]
```

Used by the booking form to display available add-ons as checkboxes.

---

## Booking Form Integration

### Booking Submission with Add-ons

```json
{
  "guestFirstName": "John",
  "guestSurname": "Doe",
  "contactNumber": "+27123456789",
  "address": "123 Main St",
  "tripStartDate": "2025-09-10",
  "tripStartTime": "08:00",
  "tripEndDate": "2025-09-10",
  "tripEndTime": "18:00",
  "isReturnTrip": true,
  "returnDate": "2025-09-12",
  "returnTime": "14:00",
  "passengerCount": 2,
  "addonIds": [
    "addon-uuid-1",  // Baby Seat
    "addon-uuid-2"   // WiFi Hotspot
  ],
  "agreeToTerms": true,
  "agreeToPrivacy": true
}
```

### Booking API Response

```json
{
  "success": true,
  "bookingNumber": "LS-00125",
  "fareBreakdown": {
    "baseFare": 730.00,
    "returnMultiplier": 1.5,
    "subtotal": 1095.00,
    "addons": {
      "Baby Seat": 150.00,
      "WiFi Hotspot": 50.00
    },
    "addonTotal": 200.00,
    "totalFare": 1295.00
  },
  "verificationCode": "abc12xyz"
}
```

---

## Server-Side Add-on Pricing

### Booking Creation Logic

1. **Validate add-on IDs** — Check each addon_id exists and is active
2. **Fetch add-on prices** — Get current fee for each addon
3. **Calculate base fare** — Using vehicle + zone pricing rule
4. **Calculate return multiplier** — If is_return_trip = true
5. **Sum add-on fees** — NO multiplier applied to add-ons
6. **Store total** — `bookings.addons_fee` + `bookings.total_fare`
7. **Create booking_addons records** — Link each addon with fee snapshot

**Pseudocode:**

```javascript
// Step 1: Get pricing rule for vehicle + zone
const pricing = await getPricingRule(vehicleId, zoneId);

// Step 2: Calculate base fare
let baseFare = pricing.base_fee;
if (pricing.per_km_rate && estimatedKm > 0) {
  baseFare += pricing.per_km_rate * estimatedKm;
}

// Step 3: Apply return multiplier if needed
const returnMultiplier = isReturnTrip ? (pricing.return_trip_multiplier || 1.5) : 1;
const subtotal = baseFare * returnMultiplier;

// Step 4: Sum add-on fees (NO multiplier)
let addonTotal = 0;
const addonSnapshots = [];
for (const addonId of addonIds) {
  const addon = await getAddon(addonId);
  addonTotal += addon.fee;
  addonSnapshots.push({
    addon_id: addonId,
    fee_at_booking: addon.fee
  });
}

// Step 5: Calculate total
const totalFare = subtotal + addonTotal;

// Step 6: Insert booking with price snapshot
const booking = await supabase.from("bookings").insert({
  booking_number,
  ...bookingData,
  base_fare: subtotal,  // This includes return multiplier
  addons_fee: addonTotal,
  total_fare: totalFare,
  verification_code
});

// Step 7: Link add-ons to booking
for (const snapshot of addonSnapshots) {
  await supabase.from("booking_addons").insert({
    booking_id: booking.id,
    addon_id: snapshot.addon_id,
    fee_at_booking: snapshot.fee_at_booking
  });
}
```

---

## Database Queries

### Get All Add-ons for a Booking

```sql
SELECT
  ba.id,
  a.name,
  a.description,
  ba.fee_at_booking,
  a.fee AS current_fee
FROM booking_addons ba
JOIN addons a ON ba.addon_id = a.id
WHERE ba.booking_id = 'booking-uuid'
ORDER BY a.name;
```

**Example output:**
```
id                | name           | description  | fee_at_booking | current_fee
addon-snap-1      | Baby Seat      | Infant seat   | 150.00         | 175.00 (changed since)
addon-snap-2      | WiFi Hotspot   | WiFi          | 50.00          | 50.00
```

### Calculate Total Add-on Cost for a Booking

```sql
SELECT
  booking_id,
  SUM(fee_at_booking) AS total_addons_paid
FROM booking_addons
WHERE booking_id = 'booking-uuid'
GROUP BY booking_id;
```

### Get Add-on Usage Statistics

```sql
SELECT
  a.name,
  COUNT(ba.id) AS times_selected,
  SUM(ba.fee_at_booking) AS revenue
FROM booking_addons ba
JOIN addons a ON ba.addon_id = a.id
GROUP BY a.id, a.name
ORDER BY revenue DESC;
```

---

## Predefined Add-ons (Seed Data)

```sql
INSERT INTO public.addons (name, fee, description) VALUES
  ('Baby Seat (0-9 months)', 150.00, 'Infant car seat with safety harness'),
  ('Child Booster (9mo-4yr)', 100.00, 'Child booster seat for toddlers'),
  ('WiFi Hotspot', 50.00, 'In-vehicle WiFi hotspot for connectivity'),
  ('Luggage Trailer', 200.00, 'Additional luggage storage trailer'),
  ('Pet Carrier', 75.00, 'Secure carrier for small pets (max 5kg)'),
  ('Wheelchair Access', 0.00, 'Wheelchair lift equipped vehicle (no extra charge)'),
  ('Smoking Policy Override', 25.00, 'Request for smoking-friendly vehicle (not applicable)')
ON CONFLICT (name) DO NOTHING;
```

---

## Security

### Role-Based Access

- **Public:** Can read active add-ons only (`/api/addons/list`)
- **Customers:** Can select add-ons during booking
- **Admins:** Can create, update, deactivate add-ons (`/api/admin/addons`)

### RLS Policies

```sql
-- Anyone can read active addons
CREATE POLICY "Anyone can read active addons" ON addons
  FOR SELECT USING (is_active = TRUE);

-- Only admins can manage addons
CREATE POLICY "Admins can manage addons" ON addons
  FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Users can see addons on their own bookings
CREATE POLICY "Users can see booking addons" ON booking_addons
  FOR SELECT USING (
    booking_id IN (
      SELECT id FROM bookings
      WHERE created_by_user_id = auth.uid()
    )
  );

-- Admins can see all booking addons
CREATE POLICY "Admins can see all booking addons" ON booking_addons
  FOR SELECT USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );
```

### Price Immutability

- Add-on prices are **snapshotted** at booking time in `booking_addons.fee_at_booking`
- Admin price changes do NOT affect existing bookings
- Historical accuracy is guaranteed for invoices and refunds

---

## Testing

### 1. Create Add-on (Admin)

```bash
curl -X POST http://localhost:3000/api/admin/addons \
  -H "Content-Type: application/json" \
  -H "x-user-role: admin" \
  -d '{
    "name": "Test Baby Seat",
    "fee": 150.00,
    "description": "Test addon"
  }'
```

Note the returned `id`.

### 2. List Public Add-ons

```bash
curl -X GET http://localhost:3000/api/addons/list
```

Should include the newly created add-on.

### 3. Book with Add-on

```bash
curl -X POST http://localhost:3000/api/bookings/create \
  -H "Content-Type: application/json" \
  -d '{
    "guestFirstName": "Jane",
    "guestSurname": "Smith",
    "contactNumber": "+27987654321",
    "address": "456 Oak St",
    "tripStartDate": "2025-09-15",
    "tripStartTime": "10:00",
    "tripEndDate": "2025-09-15",
    "tripEndTime": "16:00",
    "isReturnTrip": false,
    "passengerCount": 2,
    "addonIds": ["<addon_id>"],
    "agreeToTerms": true,
    "agreeToPrivacy": true
  }'
```

Response should show:
```json
{
  "fareBreakdown": {
    "baseFare": 730.00,
    "addonTotal": 150.00,
    "totalFare": 880.00
  }
}
```

### 4. Verify in Database

```sql
SELECT
  b.booking_number,
  b.base_fare,
  b.addons_fee,
  b.total_fare,
  json_agg(json_build_object('name', a.name, 'fee', ba.fee_at_booking))
    AS addons
FROM bookings b
LEFT JOIN booking_addons ba ON b.id = ba.booking_id
LEFT JOIN addons a ON ba.addon_id = a.id
WHERE b.booking_number = 'LS-00126'
GROUP BY b.id;
```

---

## Future Enhancements

1. **Addon Availability by Vehicle** — Some add-ons only for certain vehicle classes
   - E.g., "Pet Carrier" only for Comfort/Luxury, not Minibus
   - Add `vehicle_class` filter to addon selection

2. **Addon Availability by Zone** — Some add-ons only in certain areas
   - E.g., "WiFi" only in urban zones

3. **Quantity-Based Add-ons** — Customer selects quantity
   - "How many child booster seats? (1-3)"
   - Store quantity in `booking_addons`

4. **Percentage-Based Add-ons** — Alternative to flat fee
   - E.g., "Luxury Package: +15% surcharge"
   - Add `fee_type` column: 'flat' vs 'percentage'

5. **Bundled Add-ons** — Package deals
   - "Family Pack: Baby Seat + Booster (R200, save R50)"

---

## Summary

✅ **Flexible add-on system:**
- Flat fee per add-on (R150 baby seat, R50 WiFi)
- Price snapshot at booking time (never recalculates)
- No multiplier on add-ons (even for return trips)
- Admin-configurable (no code changes)

✅ **Clean pricing:**
- `base_fare` = vehicle × zone × return multiplier
- `addons_fee` = sum of selected add-ons
- `total_fare` = base_fare + addons_fee

✅ **Security:**
- Public reads active add-ons
- Admins manage add-ons
- RLS policies enforced
- Price immutability guaranteed
