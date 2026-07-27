import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // 1. Handle Legacy `/admin` URL redirects to `/control-center`
  if (pathname.startsWith('/admin')) {
    const newPathname = pathname.replace(/^\/admin/, '/control-center');
    const targetUrl = new URL(newPathname, request.url);
    return NextResponse.redirect(targetUrl);
  }

  const isControlCenterProtected = pathname.startsWith('/control-center') && !pathname.startsWith('/control-center/login') && !pathname.startsWith('/control-center/signup');
  const isControlCenterAuth = pathname === '/control-center/login' || pathname === '/control-center/signup';

  const isUserProtected =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/speech-studio') ||
    pathname.startsWith('/ai-scene-generator') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/history');

  const isUserAuth =
    pathname === '/login' ||
    pathname === '/signup';

  const isHomepage = pathname === '/';

  // 2. Unauthenticated user accessing protected route -> Redirect to appropriate login
  if (isControlCenterProtected && !token) {
    const loginUrl = new URL('/control-center/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isUserProtected && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Authenticated user accessing auth routes or homepage -> Redirect to dashboard
  if ((isUserAuth || isHomepage) && token) {
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  if (isControlCenterAuth && token) {
    const adminDashboardUrl = new URL('/control-center/dashboard', request.url);
    return NextResponse.redirect(adminDashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/signup',
    '/dashboard/:path*',
    '/speech-studio/:path*',
    '/ai-scene-generator/:path*',
    '/profile',
    '/settings',
    '/history',
    '/admin/:path*',
    '/control-center/:path*'
  ],
};
