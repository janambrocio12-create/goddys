import 'server-only';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/database.types';

/**
 * Service-role Supabase client. This BYPASSES Row Level Security
 * entirely, so it is deliberately kept out of every path that a browser
 * can reach:
 *
 *  - `import 'server-only'` makes the build fail if any Client Component
 *    or client bundle ever imports this file.
 *  - SUPABASE_SERVICE_ROLE_KEY has no NEXT_PUBLIC_ prefix, so Next.js
 *    never inlines it into client JavaScript.
 *
 * Reach for this only for operations that a normal user's RLS-scoped
 * session cannot or should not perform, e.g.:
 *  - Creating an admin_profiles row for a new staff member
 *  - A checkout Server Action that validates stock + price server-side
 *    and writes the order + order_items + inventory_movements together
 *  - Scheduled/background jobs (stock sync, report generation)
 *
 * Never call this from a Client Component, never pass its result to the
 * client, and never construct it with anything other than
 * process.env.SUPABASE_SERVICE_ROLE_KEY read at call time.
 */
export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not set. This client must only run on the server.',
    );
  }

  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
