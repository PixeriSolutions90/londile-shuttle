# Return Trips Design & Implementation

## Overview

Return trips are modeled as **a single booking row with optional return fields**. This matches the booking form's single return toggle and simplifies pricing, notifications, and RLS policies.

## Schema Design

### Single Row Model (Chosen)

```sql
bookings TABLE:
  id (PK)
  booking_number (LS-12345)
  
  -- Outbound trip
  pickup_date DATE NOT NULL
  pickup_time TIME NOT NULL
  dropoff_date DATE NOT NULL
  dropoff_time TIME NOT NULL
  
  -- Return trip (optional)
  is_return_trip BOOLEAN DEFAULT FALSE
  return_date DATE (nullable, only set if is_return_trip=true)
  return_time TIME (nullable, only set if is_return_trip=true)
  
  -- Pricing (snapshot at booking time)
  base_fare DECIMAL (covers both legs if return trip)
  addons_fee DECIMAL
  total_fare DECIMAL
```

### Constraints

**Temporal Integrity:**
```sql
-- Return date must be >= dropoff date
return_date >= dropoff_date

-- Return time only valid if is_return_trip=true
IF is_return_trip THEN return_date NOT NULL AND return_time NOT NULL
ELSE return_date IS NULL AND return_time IS NULL
```

## Why Single Row?

| Aspect | Single Row | Dual Rows (not chosen) |
|--------|-----------|------------------------|
| **Simplicity** | One booking = one transaction | Two bookings, complex linking |
| **Pricing** | Single `total_fare` | Separate fares, reconciliation complexity |
| **Form UI** | Toggle on form | Two separate form submissions |
| **Notifications** | One confirmation | Two confirmations |
| **Cancellation** | Cancel one row | Must cancel both, handle refunds |
| **Compliance** | One audit entry | Split audit trail |
| **Passenger continuity** | Same vehicle, same passenger | Risk of mismatch |

## Pricing Model

### Outbound Only
```
booking: {
  base_fare: 150.00,
  addons_fee: 25.00,
  total_fare: 175.00,
  is_return_trip: false
}
```

### Round Trip
```
booking: {
  base_fare: 250.00,  // Return trip premium applied
  addons_fee: 50.00,  // Addons for both legs
  total_fare: 300.00,
  is_return_trip: true,
  return_date: "2025-09-05",
  return_time: "15:00"
}
```

**Pricing Rule:** The `base_fare` is calculated once at booking time, covering both legs if `is_return_trip=true`. No separate pricing or recalculation occurs for the return leg.

## Operational Flow

### 1. Booking Creation

**Client submits form:**
```json
{
  "guestName": "John",
  "guestSurname": "Doe",
  "pickupDate": "2025-09-01",
  "pickupTime": "09:00",
  "dropoffDate": "2025-09-01",
  "dropoffTime": "17:00",
  "isReturnTrip": true,
  "returnDate": "2025-09-05",
  "returnTime": "15:00"
}
```

**Server inserts:**
```sql
INSERT INTO bookings (
  booking_number, guest_name, guest_surname,
  pickup_date, pickup_time, dropoff_date, dropoff_time,
  is_return_trip, return_date, return_time,
  base_fare, addons_fee, total_fare,
  verification_code, created_by_user_id
)
VALUES (
  'LS-00123', 'John', 'Doe',
  '2025-09-01', '09:00:00', '2025-09-01', '17:00:00',
  true, '2025-09-05', '15:00:00',
  250.00, 50.00, 300.00,
  'abc12xyz', <user-id>
)
```

### 2. Confirmation & Notifications

Send **one confirmation** with both legs:
- "Pickup: Sep 1, 09:00"
- "Dropoff: Sep 1, 17:00"
- "Return trip: Sep 5, 15:00"
- "Total: R300.00"

### 3. Guest Lookup

Guest uses booking number + contact to retrieve the **single row**, which includes return details.

### 4. Cancellation

**Client requests cancellation** → Update status to `'cancelled'` on the single row. Both legs are cancelled together.

**Refund policy:**
- Full refund if cancelled ≥ 24 hours before first pickup
- 50% refund if cancelled < 24 hours before pickup
- No refund if cancelled after pickup begins

### 5. Completion

Mark status as `'completed'` after **first leg** is done. Return leg is tracked via the same booking's `is_return_trip` and `return_date` fields.

(In future: Add `completion_status` sub-fields to track "outbound_completed", "return_completed" separately if needed.)

## RLS Policies

Return trips **do not require special RLS logic** because the entire booking (both legs) is one row:

```sql
-- Guests can see their own booking (via verification code)
-- Agents can see bookings they created (regardless of return trip)
-- Admins can see all bookings
```

No need for separate return-trip-specific policies.

## Audit Trail

A single booking entry in `audit_logs`:
```json
{
  "action": "booking.created",
  "entity_type": "booking",
  "entity_id": "123e4567-e89b-12d3-a456-426614174000",
  "changes": {
    "is_return_trip": true,
    "return_date": "2025-09-05",
    "return_time": "15:00",
    "total_fare": 300.00
  }
}
```

No split audit entries.

## API Contract

### Create Booking
```typescript
POST /api/bookings/create

{
  "guestFirstName": "John",
  "guestSurname": "Doe",
  "contactNumber": "+27123456789",
  "address": "123 Main St",
  
  // Outbound leg (required)
  "tripStartDate": "2025-09-01",
  "tripStartTime": "09:00",
  "tripEndDate": "2025-09-01",
  "tripEndTime": "17:00",
  
  // Return leg (optional)
  "isReturnTrip": false,
  "returnDate": null,
  "returnTime": null,
  
  "passengerCount": 1,
  "specialRequests": "Need child seat"
}
```

### Response
```json
{
  "success": true,
  "bookingNumber": "LS-00123",
  "totalFare": 300.00
}
```

## Future Enhancements

1. **Separate return leg pricing** (if needed): Add `return_base_fare` column to override per-leg pricing.
2. **Partial cancellations** (if needed): Add `return_cancelled_at` field to allow cancelling return leg only.
3. **Multi-leg trips** (future phase): Move to a separate `booking_legs` table if the system needs to support 3+ legs per booking.

## Migration Notes

The schema migration `003_return_trips_schema.sql`:
- Backfills `pickup_date/pickup_time/dropoff_date/dropoff_time` from existing `trip_start_date/trip_end_date`
- Marks old columns as deprecated (kept for backward compatibility)
- Adds indexes for query performance
- Enforces constraints at database level

All code using the old columns should be updated to use the new fields.

## Testing

### Return Trip Booking
```bash
curl -X POST http://localhost:3000/api/bookings/create \
  -H "Content-Type: application/json" \
  -d '{
    "guestFirstName": "Jane",
    "guestSurname": "Smith",
    "contactNumber": "+27987654321",
    "address": "456 Oak St",
    "tripStartDate": "2025-09-10",
    "tripStartTime": "08:00",
    "tripEndDate": "2025-09-10",
    "tripEndTime": "18:00",
    "isReturnTrip": true,
    "returnDate": "2025-09-12",
    "returnTime": "14:00",
    "passengerCount": 2
  }'
```

### Verify in Database
```sql
SELECT
  booking_number,
  pickup_date, pickup_time,
  dropoff_date, dropoff_time,
  is_return_trip,
  return_date, return_time,
  total_fare
FROM bookings
WHERE is_return_trip = TRUE
ORDER BY created_at DESC
LIMIT 1;
```

## Summary

✅ **Single-row return trip model** provides simplicity, consistency, and alignment with form UX. All pricing, notifications, and audit trails are handled at the booking level without special-case logic.
