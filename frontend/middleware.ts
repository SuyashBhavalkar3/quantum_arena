import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const role = request.cookies.get('user_role')?.value;
 
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/register'];
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith('/api'));

  // If not authenticated and trying to access protected route
  if (!token && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If authenticated, check role-based access
  if (token && role) {
    // HR trying to access candidate routes
    if (role === 'hr' && pathname.startsWith('/candidate')) {
      return NextResponse.redirect(new URL('/hr', request.url));
    }

    // Candidate trying to access HR routes
    if (role === 'candidate' && pathname.startsWith('/hr')) {
      return NextResponse.redirect(new URL('/candidate', request.url));
    }

    // Redirect authenticated users from login/register to their dashboard
    if (pathname === '/login' || pathname === '/register') {
      const dashboardUrl = role === 'hr' ? '/hr' : '/candidate';
      return NextResponse.redirect(new URL(dashboardUrl, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
