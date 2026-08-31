import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CheckoutForm } from '@/components/storefront/checkout-form';

export default async function CheckoutPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/account/login?redirect=/checkout');
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 md:px-10">
      <h1 className="font-display text-2xl tracking-tightest">Checkout</h1>
      <CheckoutForm />
    </div>
  );
}
