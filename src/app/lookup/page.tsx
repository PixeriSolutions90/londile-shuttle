import { BookingLookupForm } from "@/components/BookingLookupForm";

export const metadata = {
  title: "Find Your Booking | Londile Shuttle",
  description: "Look up your shuttle booking details",
};

export default function LookupPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
        <BookingLookupForm />
      </div>
      <div className="mt-8 text-center text-sm text-gray-600">
        <p>This site is protected by Cloudflare Turnstile and is subject to the</p>
        <a href="https://www.cloudflare.com/privacypolicy/" className="text-brand-primary hover:underline">
          Cloudflare Privacy Policy
        </a>
        {" and "}
        <a href="https://www.cloudflare.com/website-terms/" className="text-brand-primary hover:underline">
          Terms of Service
        </a>
        .
      </div>
    </div>
  );
}
