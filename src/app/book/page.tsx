import { BookingForm } from "@/components/BookingForm";

export const metadata = {
  title: "Book Your Shuttle | Londile Shuttle",
  description: "Book your shuttle trip with Londile Shuttle",
};

export default function BookingPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <BookingForm />
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
