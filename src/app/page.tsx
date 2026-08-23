import HomeBookingWidget from '@/components/HomeBookingWidget';
import {
  IconPhone,
  IconMail,
  IconUser,
  IconShield,
  IconBolt,
  IconWallet,
  IconUsers,
  IconBag,
  IconChevronRight,
  IconCar,
} from '@/components/icons';

const FLEET = [
  { name: 'Comfort Sedan', passengers: 4, bags: 2, price: 'R730', blurb: 'Small groups and business travel' },
  { name: 'Premium Sedan', passengers: 4, bags: 3, price: 'R950', blurb: 'A more refined ride, extra legroom' },
  { name: 'Family Minivan', passengers: 6, bags: 5, price: 'R1,200', blurb: 'Room for the whole family and luggage' },
  { name: 'Minibus', passengers: 8, bags: 8, price: 'R1,500', blurb: 'Large groups, tours and events' },
];

const FEATURES = [
  {
    icon: IconBolt,
    title: 'On-Time, Every Time',
    body: 'Live driver tracking and punctual pickups mean you never miss a flight or a meeting.',
  },
  {
    icon: IconWallet,
    title: 'Transparent Pricing',
    body: 'Upfront, fixed-fare quotes with no hidden charges — know your cost before you book.',
  },
  {
    icon: IconShield,
    title: 'Vetted & Insured',
    body: 'Professional, background-checked drivers and a fully insured, well-maintained fleet.',
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Utility Top Bar */}
      <div className="text-white text-xs" style={{ background: 'linear-gradient(90deg, #003b70, #0068da)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <a href="tel:+27123456789" className="flex items-center gap-1.5 hover:opacity-80 transition">
              <IconPhone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">+27 (0) 12 345 6789</span>
            </a>
            <a href="mailto:info@londileshuttle.co.za" className="flex items-center gap-1.5 hover:opacity-80 transition">
              <IconMail className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">info@londileshuttle.co.za</span>
            </a>
          </div>
          <a href="/auth/login" className="flex items-center gap-1.5 hover:opacity-80 transition">
            <IconUser className="w-3.5 h-3.5" />
            Client Login
          </a>
        </div>
      </div>

      {/* Header / Nav */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <span
              className="flex items-center justify-center w-9 h-9 rounded-lg text-white"
              style={{ backgroundColor: '#003b70' }}
            >
              <IconCar className="w-5 h-5" />
            </span>
            <span className="text-xl font-bold tracking-tight" style={{ color: '#003b70' }}>
              Londile Shuttle
            </span>
          </a>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="/book" className="hover:text-gray-900 transition">Make a Booking</a>
            <a href="#fleet" className="hover:text-gray-900 transition">Our Fleet</a>
            <a href="#about" className="hover:text-gray-900 transition">About</a>
            <a href="#contact" className="hover:text-gray-900 transition">Contact</a>
          </nav>

          <a
            href="/auth/login"
            className="px-5 py-2 rounded-lg font-medium text-sm text-white transition-colors"
            style={{ backgroundColor: '#0068da' }}
          >
            Login
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #003b70 0%, #00539f 55%, #0068da 100%)' }}>
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 60% 70%, white 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
            {/* Booking Widget */}
            <div className="order-2 lg:order-1 flex justify-center lg:justify-start">
              <HomeBookingWidget />
            </div>

            {/* Tagline */}
            <div className="order-1 lg:order-2 text-white space-y-5 sm:space-y-6">
              <span
                className="inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase"
                style={{ backgroundColor: 'rgba(252,198,20,0.15)', color: '#fcc614' }}
              >
                Trusted Shuttle Service
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
                Reliable shuttle transfers, wherever the road takes you
              </h1>
              <p className="text-base sm:text-lg text-blue-100 max-w-lg">
                From airport runs to cross-country transfers, Londile Shuttle connects South Africa with
                fixed-fare pricing, vetted drivers, and a fleet built for comfort.
              </p>

              <div className="flex items-center gap-4 sm:gap-8 pt-4">
                <div>
                  <div className="text-2xl sm:text-3xl font-bold" style={{ color: '#fcc614' }}>5,000+</div>
                  <div className="text-xs sm:text-sm text-blue-200">Trips completed</div>
                </div>
                <div className="w-px h-10 bg-white/20" />
                <div>
                  <div className="text-2xl sm:text-3xl font-bold" style={{ color: '#fcc614' }}>50+</div>
                  <div className="text-xs sm:text-sm text-blue-200">Routes covered</div>
                </div>
                <div className="w-px h-10 bg-white/20" />
                <div>
                  <div className="text-2xl sm:text-3xl font-bold" style={{ color: '#fcc614' }}>24/7</div>
                  <div className="text-xs sm:text-sm text-blue-200">Support desk</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8" id="about">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl mb-10 sm:mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3" style={{ color: '#003b70' }}>
              Why travellers choose Londile
            </h2>
            <p className="text-gray-600 text-base sm:text-lg">
              A professional shuttle operation built around reliability, transparency and safety.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {FEATURES.map((f) => (
              <div key={f.title} className="p-8 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition">
                <div
                  className="w-11 h-11 rounded-lg flex items-center justify-center mb-5"
                  style={{ backgroundColor: '#e8f1fb', color: '#0068da' }}
                >
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-900">{f.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fleet */}
      <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8" id="fleet" style={{ backgroundColor: '#f8fafc' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-10 sm:mb-14 flex-wrap gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-3" style={{ color: '#003b70' }}>
                Our Fleet
              </h2>
              <p className="text-gray-600 text-base sm:text-lg">Choose the right vehicle for your trip.</p>
            </div>
            <a
              href="/book"
              className="inline-flex items-center gap-1 font-medium text-sm"
              style={{ color: '#0068da' }}
            >
              View all vehicles <IconChevronRight className="w-4 h-4" />
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FLEET.map((v) => (
              <div key={v.name} className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                <div
                  className="h-32 flex items-center justify-center"
                  style={{ backgroundColor: '#eef4fb' }}
                >
                  <IconCar className="w-12 h-12 text-[#0068da]" />
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{v.name}</h3>
                    <span className="font-bold text-sm" style={{ color: '#003b70' }}>{v.price}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                    <span className="flex items-center gap-1">
                      <IconUsers className="w-3.5 h-3.5" /> {v.passengers}
                    </span>
                    <span className="flex items-center gap-1">
                      <IconBag className="w-3.5 h-3.5" /> {v.bags}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{v.blurb}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#003b70' }} id="contact">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 text-white">
            Ready to book your next trip?
          </h2>
          <p className="text-base sm:text-lg text-blue-100 mb-8">
            Get an instant, fixed-fare quote and confirm your shuttle in minutes.
          </p>
          <a
            href="/book"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg font-semibold transition-transform hover:-translate-y-0.5"
            style={{ backgroundColor: '#fcc614', color: '#003b70' }}
          >
            Book Your Shuttle <IconChevronRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg text-white" style={{ backgroundColor: '#0068da' }}>
                <IconCar className="w-4 h-4" />
              </span>
              <span className="text-white font-bold">Londile Shuttle</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Professional shuttle transfers across South Africa.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Quick Links</h4>
            <ul className="space-y-2.5 text-sm">
              <li><a href="/book" className="hover:text-white transition">Book a Shuttle</a></li>
              <li><a href="/lookup" className="hover:text-white transition">Manage Booking</a></li>
              <li><a href="/auth/login" className="hover:text-white transition">Client Login</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Legal</h4>
            <ul className="space-y-2.5 text-sm">
              <li><a href="/policies/privacy" className="hover:text-white transition">Privacy Policy</a></li>
              <li><a href="/policies/terms" className="hover:text-white transition">Terms &amp; Conditions</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Contact</h4>
            <ul className="space-y-2.5 text-sm text-gray-400">
              <li className="flex items-center gap-2"><IconMail className="w-4 h-4" /> info@londileshuttle.co.za</li>
              <li className="flex items-center gap-2"><IconPhone className="w-4 h-4" /> +27 (0) 12 345 6789</li>
              <li>Available 24/7</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
          &copy; 2026 Londile Shuttle. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
