import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Pure JS JWT payload decoder for Next.js Edge Middleware
const decodeJwt = (token: string) => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(payload);
  } catch (err) {
    return null;
  }
};

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  const isAdminProtected = pathname.startsWith('/admin') && !pathname.startsWith('/admin/login') && !pathname.startsWith('/admin/signup');
  const isAdminAuth = pathname === '/admin/login' || pathname === '/admin/signup';

  const isUserProtected =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/settings');

  const isUserAuth =
    pathname === '/login' ||
    pathname === '/signup';

  const isHomepage = pathname === '/';

  // 1. Unauthenticated user accessing protected route -> Redirect to appropriate login
  if (isAdminProtected && !token) {
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isUserProtected && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Decode JWT and run role-based check
  let role = 'user';
  if (token) {
    const decoded = decodeJwt(token);
    if (decoded && decoded.role) {
      role = decoded.role;
    }
  }

  // 3. Admin authorization checks
  if (isAdminProtected && role !== 'admin') {
    return new NextResponse(
      JSON.stringify({ 
        success: false, 
        message: 'You do not have permission to access this page.' 
      }),
      { 
        status: 403, 
        headers: { 'content-type': 'application/json' } 
      }
    );
  }

  // 4. Authenticated user accessing auth routes or homepage -> Redirect to dashboard
  if ((isUserAuth || isHomepage) && token) {
    const dashboardUrl = new URL(role === 'admin' ? '/admin/dashboard' : '/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  if (isAdminAuth && token) {
    const adminDashboardUrl = new URL('/admin/dashboard', request.url);
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
    '/profile',
    '/settings',
    '/admin/:path*'
  ],
};
