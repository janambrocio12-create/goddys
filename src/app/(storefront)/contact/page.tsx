export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16 md:px-10">
      <p className="font-mono text-xs uppercase tracking-widest text-hazard">Contact</p>
      <h1 className="mt-2 font-display text-3xl tracking-tightest md:text-4xl">Get in touch</h1>

      <p className="mt-6 text-sm text-concrete">
        Questions about an order, sizing, or a wholesale inquiry - hit us up
        and we will get back to you.
      </p>

      <div className="mt-8 flex flex-col gap-3 font-mono text-sm">
        <p className="text-concrete">
          Email: <span className="text-bone">hello@goddys.example</span>
        </p>
        <p className="text-concrete">
          Instagram: <span className="text-bone">@goddys.ph</span>
        </p>
      </div>
    </div>
  );
}
