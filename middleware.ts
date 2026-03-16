import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  // We can't easily see the headers being added by Next.js configuration here
  // because they are added late in the response cycle.
  // But we can check if anything else is adding them.
  console.log('--- Request Headers ---');
  request.headers.forEach((v, k) => console.log(`${k}: ${v}`));
  return response;
}

export const config = {
  matcher: '/(.*)',
};
