'use client';

import { IconGlobe } from './icons';

export default function InternationalNotice() {
  return (
    <div className="text-center py-8 space-y-3">
      <IconGlobe className="w-10 h-10 mx-auto text-gray-300" />
      <h3 className="font-semibold text-gray-900">Cross-Border &amp; International Transfers</h3>
      <p className="text-sm text-gray-500 max-w-sm mx-auto">
        Travelling beyond South Africa? Our team arranges cross-border and international shuttle transfers on request.
      </p>
      <a
        href="mailto:info@londileshuttle.co.za"
        className="inline-block mt-2 px-6 py-2.5 rounded-lg font-medium text-white text-sm"
        style={{ backgroundColor: '#0068da' }}
      >
        Contact Us
      </a>
    </div>
  );
}
