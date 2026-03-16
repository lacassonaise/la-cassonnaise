import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://*.hcaptcha.com https://newassets.hcaptcha.com https://pay.google.com https://www.gstatic.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://js.stripe.com https://pay.google.com https://www.gstatic.com https://*.hcaptcha.com",
      "img-src 'self' blob: data: https://*.stripecdn.com https://lacassonaise.fr https://pay.google.com https://www.gstatic.com https://*.stripe.com",
      "font-src 'self' https://fonts.gstatic.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "frame-src https://js.stripe.com https://hooks.stripe.com https://*.hcaptcha.com https://newassets.hcaptcha.com https://pay.google.com",
      "connect-src 'self' https://api.stripe.com https://checkout.stripe.com https://r.stripe.com https://*.stripe.com https://qaqldauybcgimdoldviy.supabase.co wss://qaqldauybcgimdoldviy.supabase.co https://pay.google.com https://www.gstatic.com https://*.hcaptcha.com",
      "manifest-src 'self' https://pay.google.com",
      "upgrade-insecure-requests",
    ].join('; '),
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), window-management=()',
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin',
  }
];

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
