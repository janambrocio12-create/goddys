'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const redirectTo = searchParams.get('redirect') || '/';

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (signUpError) {
      setError(signUpError.message);
      setIsSubmitting(false);
      return;
    }

    // If the Supabase project requires email confirmation, signUp
    // succeeds but returns no active session yet.
    if (!data.session) {
      setNeedsEmailConfirmation(true);
      setIsSubmitting(false);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  if (needsEmailConfirmation) {
    return (
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl tracking-tightest">Check your email</h1>
        <p className="mt-4 text-sm text-concrete">
          We sent a confirmation link to {email}. Click it, then come back and sign in.
        </p>
        <Link
          href={`/account/login?redirect=${encodeURIComponent(redirectTo)}`}
          className="mt-6 inline-block font-mono text-xs uppercase tracking-widest text-bone underline underline-offset-4"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="font-display text-3xl tracking-tightest">Create an account</h1>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-xs uppercase tracking-wide text-concrete">
            Full name
          </span>
          <input
            required
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className="border border-concrete/40 bg-panel px-3 py-2 text-sm text-bone outline-none focus-visible:border-hazard"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-xs uppercase tracking-wide text-concrete">Email</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="border border-concrete/40 bg-panel px-3 py-2 text-sm text-bone outline-none focus-visible:border-hazard"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-xs uppercase tracking-wide text-concrete">
            Password
          </span>
          <input
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="border border-concrete/40 bg-panel px-3 py-2 text-sm text-bone outline-none focus-visible:border-hazard"
          />
        </label>

        {error && (
          <p role="alert" className="font-mono text-xs text-danger">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 bg-bone py-2.5 font-mono text-xs uppercase tracking-widest text-ink transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-sm text-concrete">
        Already have an account?{' '}
        <Link
          href={`/account/login?redirect=${encodeURIComponent(redirectTo)}`}
          className="text-bone underline underline-offset-4"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}

export default function CustomerSignupPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6">
      <Suspense fallback={null}>
        <SignupForm />
      </Suspense>
    </div>
  );
}
