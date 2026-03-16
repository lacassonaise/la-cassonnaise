import type { NextConfig } from "next";

const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://newassets.hcaptcha.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' blob: data: https://*.stripecdn.com https://lacassonaise.fr;
    font-src 'self' https://fonts.gstatic.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    frame-src https://js.stripe.com https://hooks.stripe.com https://newassets.hcaptcha.com;
    connect-src 'self' https://api.stripe.com https://checkout.stripe.com https://qaqldauybcgimdoldviy.supabase.co wss://qaqldauybcgimdoldviy.supabase.co;
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
            value: 'camera=(), microphone=(), geolocation=(), window-management=(self)',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
