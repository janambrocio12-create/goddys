const SIZE_ROWS = [
  { size: 'S', chest: '48–50', length: '68', sleeve: '21' },
  { size: 'M', chest: '51–53', length: '70', sleeve: '22' },
  { size: 'L', chest: '54–56', length: '72', sleeve: '23' },
  { size: 'XL', chest: '57–59', length: '74', sleeve: '24' },
];

export default function SizeGuidePage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16 md:px-10">
      <p className="font-mono text-xs uppercase tracking-widest text-hazard">Fit</p>
      <h1 className="mt-2 font-display text-3xl tracking-tightest md:text-4xl">Size guide</h1>

      <p className="mt-6 text-sm text-concrete">
        Measurements in centimeters, taken flat. Most GODDYS pieces run
        oversized by design - that is the fit, not a mistake. Between sizes?
        Size down for something closer.
      </p>

      <div className="mt-8 overflow-x-auto border border-concrete/20">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-concrete/20 bg-panel font-mono text-[10px] uppercase tracking-widest text-concrete">
              <th className="px-4 py-3">Size</th>
              <th className="px-4 py-3">Chest (cm)</th>
              <th className="px-4 py-3">Length (cm)</th>
              <th className="px-4 py-3">Sleeve (cm)</th>
            </tr>
          </thead>
          <tbody>
            {SIZE_ROWS.map((row) => (
              <tr key={row.size} className="border-b border-concrete/10 last:border-0">
                <td className="px-4 py-3 font-mono">{row.size}</td>
                <td className="px-4 py-3">{row.chest}</td>
                <td className="px-4 py-3">{row.length}</td>
                <td className="px-4 py-3">{row.sleeve}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-6 font-mono text-xs text-concrete">
        Still not sure? Reach out on the Contact page before you order.
      </p>
    </div>
  );
}
