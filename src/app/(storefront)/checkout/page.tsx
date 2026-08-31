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

  const { data: customer } = await supabase
    .from('customers')
    .select('full_name, phone')
    .eq('id', user.id)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 md:px-10">
      <h1 className="font-display text-2xl tracking-tightest">Checkout</h1>
      <CheckoutForm
        initialFullName={customer?.full_name ?? undefined}
        initialPhone={customer?.phone ?? undefined}
      />
    </div>
  );
}
