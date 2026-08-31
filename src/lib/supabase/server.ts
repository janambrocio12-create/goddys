import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/types/database.types';

/**
 * Server-side Supabase client, still scoped to the anon key + the current
 * user's session (read from cookies). This is what Server Components,
 * Route Handlers, and Server Actions should use for anything done "as
 * the logged-in user" — RLS still applies.
 *
 * For privileged operations that must bypass RLS (e.g. an admin action,
 * or writing an order transactionally at checkout), use ./admin.ts
 * instead, and only from server-only code.
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Called from a Server Component with no writable response —
            // safe to ignore as long as middleware.ts is also refreshing
            // the session (it is, see /middleware.ts).
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch {
            // See note above.
          }
        },
      },
    },
  );
}
