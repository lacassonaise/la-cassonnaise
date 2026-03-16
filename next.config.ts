import type { NextConfig } from "next";

const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://newassets.hcaptcha.com https://pay.google.com https://www.gstatic.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://js.stripe.com https://pay.google.com https://www.gstatic.com;
    img-src 'self' blob: data: https://*.stripecdn.com https://lacassonaise.fr https://pay.google.com https://www.gstatic.com;
    font-src 'self' https://fonts.gstatic.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    frame-src https://js.stripe.com https://hooks.stripe.com https://newassets.hcaptcha.com https://pay.google.com;
    connect-src 'self' https://api.stripe.com https://checkout.stripe.com https://qaqldauybcgimdoldviy.supabase.co wss://qaqldauybcgimdoldviy.supabase.co https://pay.google.com https://www.gstatic.com;
    manifest-src 'self' https://pay.google.com;
    upgrade-insecure-requests;
`.replace(/\s{2,}/g, ' ').trim();

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspHeader,
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
