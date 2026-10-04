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
          Email:{' '}
          <a href="mailto:goddysclothing@gmail.com" className="text-bone hover:text-hazard">
            goddysclothing@gmail.com
          </a>
        </p>
        <p className="text-concrete">
          Phone:{' '}
          <a href="tel:+639955286273" className="text-bone hover:text-hazard">
            0995 528 6273
          </a>
        </p>
        <p className="text-concrete">
          Facebook:{' '}
          <a
            href="https://www.facebook.com/share/1BwY264zJN/?mibextid=wwXIfr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-bone hover:text-hazard"
          >
            GODDYS on Facebook
          </a>
        </p>
        <p className="text-concrete">
          Instagram:{' '}
          <a
            href="https://www.instagram.com/goddysph?stkn=MXZoNDdwODZ4OWM3Yw%3D%3D&utm_source=qr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-bone hover:text-hazard"
          >
            @goddysph
          </a>
        </p>
        <p className="text-concrete">
          TikTok:{' '}
          <a
            href="https://www.tiktok.com/@goddys_apparel?_r=1&_t=ZS-9AHD41NUxYD"
            target="_blank"
            rel="noopener noreferrer"
            className="text-bone hover:text-hazard"
          >
            @goddys_apparel
          </a>
        </p>
      </div>
    </div>
  );
}
