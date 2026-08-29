import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  headers: async () => {
    return [
      {
        source: "/(.*)",
        headers: [
          // ============================================================================
          // HTTPS & TRANSPORT SECURITY
          // ============================================================================
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },

          // ============================================================================
          // CONTENT SECURITY POLICY (CSP)
          // Prevents XSS, clickjacking, and other injection attacks
          // ============================================================================
          {
            key: "Content-Security-Policy",
            value: [
              // Default: restrict to same origin
              "default-src 'self'",
              // Scripts: allow self, inline for Next.js, Cloudflare Turnstile, and Google Maps
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://maps.googleapis.com https://maps.gstatic.com",
              // Styles: allow self and inline
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              // Images: allow self, data URIs, and common CDNs
              "img-src 'self' data: https:",
              // Fonts: allow self, Google Fonts, and Google Maps
              "font-src 'self' data: https://fonts.gstatic.com https://maps.gstatic.com",
              // Connect: allow API calls, Cloudflare, Google Maps Places Autocomplete,
              // and Supabase (auth/REST calls go directly from the browser, not
              // through our own API routes, so this was missing entirely before —
              // every client-side signIn/signUp/session call was being CSP-blocked).
              `connect-src 'self' https://upstash.io https://challenges.cloudflare.com https://vercel.live https://maps.googleapis.com ${process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://*.supabase.co"}`,
              // Frames: allow Cloudflare Turnstile
              "frame-src 'self' https://challenges.cloudflare.com",
              // Media: allow self
              "media-src 'self'",
              // Frame ancestors: prevent clickjacking
              "frame-ancestors 'none'",
              // Base URI: restrict to self
              "base-uri 'self'",
              // Form action: restrict to self
              "form-action 'self'",
              // Upgrade insecure requests
              "upgrade-insecure-requests",
            ].join("; "),
          },

          // ============================================================================
          // CLICKJACKING PROTECTION
          // ============================================================================
          {
            key: "X-Frame-Options",
            value: "DENY",
          },

          // ============================================================================
          // MIME TYPE SNIFFING PROTECTION
          // ============================================================================
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },

          // ============================================================================
          // XSS PROTECTION
          // ============================================================================
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },

          // ============================================================================
          // REFERRER POLICY
          // Don't leak referrer to external sites
          // ============================================================================
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },

          // ============================================================================
          // PERMISSIONS POLICY (formerly Feature-Policy)
          // Restrict access to browser features
          // ============================================================================
          {
            key: "Permissions-Policy",
            value: [
              "accelerometer=()",
              "ambient-light-sensor=()",
              "autoplay=()",
              "battery=()",
              "camera=()",
              "document-domain=()",
              "encrypted-media=()",
              "fullscreen=()",
              "geolocation=()",
              "gyroscope=()",
              "magnetometer=()",
              "microphone=()",
              "midi=()",
              "payment=()",
              "usb=()",
            ].join(", "),
          },

          // ============================================================================
          // ADDITIONAL SECURITY HEADERS
          // ============================================================================
          {
            key: "X-Permitted-Cross-Domain-Policies",
            value: "none",
          },
          {
            // "credentialless" instead of "require-corp": still isolates the page,
            // but doesn't require third parties (e.g. Google Maps) to send a
            // Cross-Origin-Resource-Policy header we don't control.
            key: "Cross-Origin-Embedder-Policy",
            value: "credentialless",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Cross-Origin-Resource-Policy",
            value: "same-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
