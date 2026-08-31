import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/types/database.types';

type AdminProfile = Database['public']['Tables']['admin_profiles']['Row'];

/**
 * Loads the signed-in admin's profile for use in (admin) route Server
 * Components. Redirects to /admin/login if there's no session, or if the
 * session belongs to a customer with no admin_profiles row / a
 * deactivated one — a valid customer session is never enough on its own.
 */
export async function requireAdmin(): Promise<AdminProfile> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/admin/login');
  }

  const { data: profile } = await supabase
    .from('admin_profiles')
    .select('*')
    .eq('id', user.id)
    .eq('is_active', true)
    .maybeSingle();

  if (!profile) {
    redirect('/admin/login');
  }

  return profile;
}
