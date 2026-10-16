import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const role = request.cookies.get('role')?.value;

  const { pathname } = request.nextUrl;

  // Public routes
  const publicRoutes = ['/login', '/register'];

  // If not logged in → redirect to login
  if (!token && !publicRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If logged in and trying to access login/register
  if (token && publicRoutes.includes(pathname)) {
    if (role === 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url));
    } else if (role === 'hod') {
      return NextResponse.redirect(new URL('/user/reports', request.url));
    } else {
      return NextResponse.redirect(new URL('/user', request.url));
    }
  }

  // Protect admin routes
  if (pathname.startsWith('/admin') && role !== 'admin') {
    if (role === 'hod') {
      return NextResponse.redirect(new URL('/user/reports', request.url));
    }

    return NextResponse.redirect(new URL('/user', request.url));
  }

  // HOD restrictions
  if (role === 'hod') {
    // HOD can access ONLY /user/reports
    if (
      pathname.startsWith('/user') &&
      !pathname.startsWith('/user/reports')
    ) {
      return NextResponse.redirect(
        new URL('/user/reports', request.url)
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg|.*\\.gif|.*\\.webp).*)',
  ],
};