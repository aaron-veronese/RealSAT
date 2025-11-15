import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define user roles
type UserRole = 'STUDENT' | 'TEACHER' | 'ADMIN' | 'OWNER';

// Role-based access control configuration
const roleAccessMap: Record<string, UserRole[]> = {
  '/student': ['STUDENT'],
  '/teacher': ['TEACHER', 'ADMIN', 'OWNER'],
  '/school': ['ADMIN', 'OWNER'],
  '/admin': ['OWNER'],
};

export function middleware(request: NextRequest) {
  // TODO: Replace this with actual auth logic
  // For now, we'll use a cookie or header to simulate user role
  // In production, this should verify session tokens with Supabase Auth
  
  const userRole = request.cookies.get('user-role')?.value as UserRole | undefined;
  const pathname = request.nextUrl.pathname;

  // Skip middleware for public routes
  if (
    pathname === '/' ||
    pathname.startsWith('/page1') ||
    pathname.startsWith('/page2') ||
    pathname.startsWith('/page3') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/images') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Skip middleware for test-taking routes (preserve existing behavior)
  if (pathname.startsWith('/test/')) {
    return NextResponse.next();
  }

  // Check role-based access for protected routes
  for (const [route, allowedRoles] of Object.entries(roleAccessMap)) {
    if (pathname.startsWith(route)) {
      if (!userRole) {
        // No role found - redirect to home
        return NextResponse.redirect(new URL('/', request.url));
      }

      if (!allowedRoles.includes(userRole)) {
        // User doesn't have access to this route
        // Redirect to their appropriate dashboard
        switch (userRole) {
          case 'STUDENT':
            return NextResponse.redirect(new URL('/student', request.url));
          case 'TEACHER':
            return NextResponse.redirect(new URL('/teacher', request.url));
          case 'ADMIN':
            return NextResponse.redirect(new URL('/school', request.url));
          case 'OWNER':
            return NextResponse.redirect(new URL('/admin', request.url));
          default:
            return NextResponse.redirect(new URL('/', request.url));
        }
      }

      // User has access - continue
      return NextResponse.next();
    }
  }

  // For any other protected routes, allow access (backward compatibility)
  return NextResponse.next();
}

// Configure which routes this middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
