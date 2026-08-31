'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/lib/types/database.types';

/**
 * Browser-side Supabase client. Uses the public anon key only, which is
 * safe to ship to the client — every table it can touch is protected by
 * the RLS policies in supabase/migrations/0002_rls_policies.sql.
 *
 * Use this in Client Components. Server Components / Route Handlers /
 * Server Actions should use ./server.ts instead so the session cookie is
 * read correctly.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
