'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const supabase = createClient();

  function handleClick() {
    startTransition(async () => {
      await supabase.auth.signOut();
      router.push('/');
      router.refresh();
    });
  }

  return (
    <button type="button" onClick={handleClick} disabled={isPending} className={className}>
      {isPending ? 'Signing out…' : 'Log out'}
    </button>
  );
}
