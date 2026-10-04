import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Runs on every request. Two jobs:
 *  1. Refresh the Supabase auth cookie so server components always see a
 *     current session (standard @supabase/ssr pattern).
 *  2. Gate everything under /admin (except the public auth pages below)
 *     behind an active admin_profiles row — a signed-in *customer* is
 *     not enough.
 *
 * This is the outer perimeter, not the only check: pages under
 * (admin)/ also call requireAdmin() (see src/lib/auth/get-admin.ts) so
 * a Server Component never trusts middleware alone.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Reset/forgot-password pages must stay reachable with no admin
  // session yet (that's the whole point of them) — a recovery link's
  // token lives in the URL hash, which this server-side check never
  // sees, so gating these the same as the rest of /admin would bounce
  // a legitimate reset straight back to /admin/login before the page's
  // client JS even runs.
  const PUBLIC_ADMIN_ROUTES = ['/admin/login', '/admin/forgot-password', '/admin/reset-password'];

  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
  const isPublicAdminRoute = PUBLIC_ADMIN_ROUTES.includes(request.nextUrl.pathname);

  if (isAdminRoute && !isPublicAdminRoute) {
    if (!user) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    const { data: adminProfile } = await supabase
      .from('admin_profiles')
      .select('id')
      .eq('id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    if (!adminProfile) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Run on everything except static assets, so the session cookie
     * stays fresh app-wide, while keeping the admin check scoped to
     * /admin above.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
