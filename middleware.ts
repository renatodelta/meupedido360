import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js App Router Middleware for Dynamic Subdomains
 * 
 * - Root Domain (meupedido360.com, www.meupedido360.com, localhost) 
 *   => Rewritten internally to `app/(public)/*`
 * - Tenant Subdomains (*.meupedido360.com, *.localhost) 
 *   => Rewritten internally to `app/(store)/[subdomain]/*`
 */
export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const pathname = url.pathname;
  const hostname = request.headers.get('host') || '';

  // 1. Skip rewrites for Next.js internal folders, APIs, and static asset queries
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 2. Normalize host (extract domain, ignore port numbers, and force lowercase)
  const host = hostname.split(':')[0].toLowerCase();

  // 3. Determine if request is hitting the main root domain
  const isRootDomain = 
    host === 'meupedido360.com' || 
    host === 'www.meupedido360.com' || 
    host === 'localhost' ||
    host === '127.0.0.1';

  if (isRootDomain) {
    // Let Next.js naturally resolve /(public) group
    return NextResponse.next();
  }

  // 4. Extract subdomain slug
  let subdomain = '';

  if (host.endsWith('.meupedido360.com')) {
    subdomain = host.replace('.meupedido360.com', '');
  } else if (host.endsWith('.localhost')) {
    subdomain = host.replace('.localhost', '');
  } else {
    // Fallback for custom domains or multi-level domains
    const parts = host.split('.');
    if (parts.length > 1) {
      subdomain = parts[0];
    } else {
      subdomain = host;
    }
  }

  // Sanitize extraction
  subdomain = subdomain.trim();

  // 5. If extracted subdomain is empty or "www", fallback to public root routing
  if (!subdomain || subdomain === 'www') {
    return NextResponse.next();
  }

  // 6. Rewrite path to the tenant dynamic directory (store) omitting route group
  // E.g. padaria.meupedido360.com/admin => app/(store)/[subdomain]/admin
  url.pathname = `/${subdomain}${pathname}`;
  return NextResponse.rewrite(url);
}

// Match all requests except API routes and static asset paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (static files)
     */
    '/((?!api/|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};
