export interface VehicleQuote {
  vehicleId: string;
  vehicleName: string;
  vehicleClass: string;
  maxPassengers: number;
  maxBags: number;
  imageUrl: string | null;
  baseFee: number;
  perKmCharge: number;
  subtotal: number;
  returnMultiplier: number;
  totalFare: number;
}

export interface QuoteResponse {
  zone: { id: string; name: string };
  isReturnTrip: boolean;
  estimatedKm: number;
  passengerCount: number;
  quotes: VehicleQuote[];
}

export const QUOTE_SESSION_KEY = "londile_quote";
