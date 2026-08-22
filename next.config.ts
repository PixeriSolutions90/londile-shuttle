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
              // Scripts: allow self and inline for Next.js
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com",
              // Styles: allow self and inline
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              // Images: allow self, data URIs, and common CDNs
              "img-src 'self' data: https:",
              // Fonts: allow self and Google Fonts
              "font-src 'self' data: https://fonts.gstatic.com",
              // Connect: allow API calls and Cloudflare
              "connect-src 'self' https://upstash.io https://challenges.cloudflare.com https://vercel.live",
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
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp",
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
