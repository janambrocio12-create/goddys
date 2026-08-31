export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16 md:px-10">
      <p className="font-mono text-xs uppercase tracking-widest text-hazard">About</p>
      <h1 className="mt-2 font-display text-3xl tracking-tightest md:text-4xl">
        Built underground, worn everywhere.
      </h1>

      <div className="mt-8 flex flex-col gap-4 text-sm text-concrete">
        <p>
          GODDYS started as a small cut-and-sew run out of Bataan — pieces
          made for late nights, long shifts, and everything in between. No
          seasons, no filler drops. Just heavyweight fabric, honest
          construction, and a wordmark you will recognize from across the
          room.
        </p>
        <p>
          Every piece is designed first, priced second. We keep runs small on
          purpose — once a size or colorway sells out, it is gone until the
          next cut.
        </p>
      </div>
    </div>
  );
}
