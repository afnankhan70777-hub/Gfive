import { type NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  // Static export fallback: middleware only runs in dev/server mode.
  // In static export, RouteGuard handles client-side auth checks.
  const token = request.cookies.get('mobiis-auth')?.value;
  const isAuthPage = request.nextUrl.pathname === '/login';
  const isProtected = !isAuthPage && !request.nextUrl.pathname.startsWith('/_next') && request.nextUrl.pathname !== '/favicon.ico';

  if (!token && isProtected) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
