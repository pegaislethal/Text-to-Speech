import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  const isProtectedPath =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/history') ||
    pathname.startsWith('/admin');

  const isAuthPath =
    pathname === '/login' ||
    pathname === '/signup';

  const isHomepage = pathname === '/';

  // 1. Unauthenticated user attempting to access protected route -> Redirect to /login
  if (isProtectedPath && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Authenticated user attempting to visit /login, /signup, or homepage -> Redirect to /dashboard
  if ((isAuthPath || isHomepage) && token) {
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/signup',
    '/dashboard/:path*',
    '/profile',
    '/settings',
    '/history',
    '/admin/:path*'
  ],
};
