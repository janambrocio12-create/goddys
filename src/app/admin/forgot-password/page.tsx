'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function AdminForgotPasswordPage() {
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/admin/reset-password`,
    });

    setIsSubmitting(false);

    if (resetError) {
      setError('Something went wrong sending the link. Try again in a bit.');
      return;
    }

    // Same email either way, whether or not it matches an account —
    // same reasoning as the login form's vague error.
    setSent(true);
  }

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <p className="font-mono text-xs uppercase tracking-widest text-concrete">GODDYS</p>
          <h1 className="mt-2 font-display text-3xl tracking-tightest">Check your email</h1>
          <p className="mt-4 text-sm text-concrete">
            If {email} is an admin account, a password reset link is on its way. Open it to set a
            new password.
          </p>
          <Link
            href="/admin/login"
            className="mt-6 inline-block font-mono text-xs uppercase tracking-widest text-bone underline underline-offset-4"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <p className="font-mono text-xs uppercase tracking-widest text-concrete">GODDYS</p>
        <h1 className="mt-2 font-display text-3xl tracking-tightest">Reset password</h1>
        <p className="mt-4 text-sm text-concrete">
          Enter your admin email and we will send you a link to set a new password.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
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
            {isSubmitting ? 'Sending…' : 'Send reset link'}
          </button>
        </form>

        <p className="mt-6 text-sm text-concrete">
          <Link href="/admin/login" className="text-bone underline underline-offset-4">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
