export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center">
            <span className="text-2xl font-bold" style={{ color: '#003b70' }}>
              🚗 Londile Shuttle
            </span>
          </div>

          {/* Login Button */}
          <a
            href="/auth/login"
            className="px-6 py-2 rounded-lg font-medium transition-colors"
            style={{ backgroundColor: '#0068da', color: 'white' }}
          >
            Login
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Left: Content */}
            <div className="space-y-8">
              <div>
                <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-4" style={{ color: '#003b70' }}>
                  Book Your Shuttle Today
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  Fast, reliable, and affordable shuttle services across South Africa. Get to your destination on time, every time.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="/book"
                  className="px-8 py-4 rounded-lg font-semibold text-white text-center transition-all hover:shadow-lg"
                  style={{ backgroundColor: '#0068da' }}
                >
                  Book Now
                </a>
                <a
                  href="/lookup"
                  className="px-8 py-4 rounded-lg font-semibold text-center transition-all border-2"
                  style={{ borderColor: '#003b70', color: '#003b70' }}
                >
                  Check Booking
                </a>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 pt-8">
                <div>
                  <div className="text-3xl font-bold" style={{ color: '#0068da' }}>5,000+</div>
                  <div className="text-sm text-gray-600">Happy Customers</div>
                </div>
                <div>
                  <div className="text-3xl font-bold" style={{ color: '#0068da' }}>50+</div>
                  <div className="text-sm text-gray-600">Routes</div>
                </div>
                <div>
                  <div className="text-3xl font-bold" style={{ color: '#0068da' }}>24/7</div>
                  <div className="text-sm text-gray-600">Support</div>
                </div>
              </div>
            </div>

            {/* Right: Image Placeholder */}
            <div className="bg-gradient-to-br rounded-2xl p-8" style={{ backgroundColor: '#f0f4f8' }}>
              <div className="aspect-square rounded-xl flex items-center justify-center text-6xl bg-white shadow-lg">
                🚘
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#f9fafb' }}>
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4" style={{ color: '#003b70' }}>
            Why Choose Londile?
          </h2>
          <p className="text-center text-gray-600 mb-16 text-lg">
            Experience premium shuttle services with modern fleet and professional drivers
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-bold mb-3" style={{ color: '#003b70' }}>
                Fast & Reliable
              </h3>
              <p className="text-gray-600">
                On-time pickups and dropoffs guaranteed. Real-time tracking so you always know where your shuttle is.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-xl font-bold mb-3" style={{ color: '#003b70' }}>
                Affordable Pricing
              </h3>
              <p className="text-gray-600">
                Transparent pricing with no hidden fees. Get instant quotes and book with confidence.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="text-4xl mb-4">🛡️</div>
              <h3 className="text-xl font-bold mb-3" style={{ color: '#003b70' }}>
                Safe & Secure
              </h3>
              <p className="text-gray-600">
                Professional drivers, well-maintained vehicles, and comprehensive insurance coverage.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Fleet Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16" style={{ color: '#003b70' }}>
            Our Fleet
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Vehicle 1 */}
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="bg-gray-100 h-40 flex items-center justify-center text-5xl">
                🚗
              </div>
              <div className="p-6">
                <h3 className="font-bold text-lg mb-2">Comfort Sedan</h3>
                <p className="text-sm text-gray-600 mb-4">4 passengers • R730</p>
                <p className="text-xs text-gray-500">Perfect for small groups and business travel</p>
              </div>
            </div>

            {/* Vehicle 2 */}
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="bg-gray-100 h-40 flex items-center justify-center text-5xl">
                💎
              </div>
              <div className="p-6">
                <h3 className="font-bold text-lg mb-2">Premium Sedan</h3>
                <p className="text-sm text-gray-600 mb-4">4 passengers • R950</p>
                <p className="text-xs text-gray-500">Luxury experience with premium amenities</p>
              </div>
            </div>

            {/* Vehicle 3 */}
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="bg-gray-100 h-40 flex items-center justify-center text-5xl">
                🚐
              </div>
              <div className="p-6">
                <h3 className="font-bold text-lg mb-2">Family Minivan</h3>
                <p className="text-sm text-gray-600 mb-4">6 passengers • R1,200</p>
                <p className="text-xs text-gray-500">Spacious and comfortable for families</p>
              </div>
            </div>

            {/* Vehicle 4 */}
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="bg-gray-100 h-40 flex items-center justify-center text-5xl">
                🚌
              </div>
              <div className="p-6">
                <h3 className="font-bold text-lg mb-2">Minibus</h3>
                <p className="text-sm text-gray-600 mb-4">8 passengers • R1,500</p>
                <p className="text-xs text-gray-500">Ideal for large groups and tours</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#003b70' }}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4 text-white">
            Ready to Book Your Shuttle?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Get an instant quote and book your ride in minutes
          </p>
          <a
            href="/book"
            className="inline-block px-8 py-4 rounded-lg font-semibold text-lg transition-all hover:shadow-lg"
            style={{ backgroundColor: '#fcc614', color: '#003b70' }}
          >
            Book Your Shuttle Now
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div>
            <h3 className="text-white font-bold mb-4">Londile Shuttle</h3>
            <p className="text-sm text-gray-400">
              Your trusted shuttle service across South Africa
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-bold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/book" className="hover:text-white transition">Book Shuttle</a></li>
              <li><a href="/lookup" className="hover:text-white transition">Check Booking</a></li>
              <li><a href="/auth/login" className="hover:text-white transition">Login</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-bold mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/policies/privacy" className="hover:text-white transition">Privacy Policy</a></li>
              <li><a href="/policies/terms" className="hover:text-white transition">Terms & Conditions</a></li>
              <li><a href="tel:+27123456789" className="hover:text-white transition">+27 (0) 12 345 6789</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-bold mb-4">Contact</h4>
            <p className="text-sm mb-2">Email: info@londileshuttle.co.za</p>
            <p className="text-sm">Available 24/7</p>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-8 text-center text-sm text-gray-400">
          <p>&copy; 2026 Londile Shuttle. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
