type SizeChart = {
  title: string;
  columns: string[];
  rows: string[][];
};

// From GODDYS' official size charts. Measurements in inches.
const SIZE_CHARTS: SizeChart[] = [
  {
    title: 'T-shirt',
    columns: ['Size', 'Length', 'Width'],
    rows: [
      ['S', '27', '19'],
      ['M', '28', '20'],
      ['L', '29', '22'],
      ['XL', '30', '23'],
    ],
  },
  {
    title: 'Longsleeve',
    columns: ['Size', 'Length', 'Width', 'Sleeves'],
    rows: [
      ['S', '27', '19', '21'],
      ['M', '28', '20', '21.5'],
      ['L', '29', '21', '22'],
      ['XL', '30', '23', '22.5'],
      ['2XL', '31', '24', '23'],
    ],
  },
];

export default function SizeGuidePage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16 md:px-10">
      <p className="font-mono text-xs uppercase tracking-widest text-hazard">Fit</p>
      <h1 className="mt-2 font-display text-3xl tracking-tightest md:text-4xl">Size guide</h1>

      <p className="mt-6 text-sm text-concrete">
        Measurements in inches, taken flat. Most GODDYS pieces run oversized
        by design - that is the fit, not a mistake. Between sizes? Size down
        for something closer.
      </p>

      {SIZE_CHARTS.map((chart) => (
        <section key={chart.title} className="mt-10">
          <h2 className="font-display text-xl tracking-tightest">{chart.title}</h2>
          <div className="mt-4 overflow-x-auto border border-concrete/20">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-concrete/20 bg-panel font-mono text-[10px] uppercase tracking-widest text-concrete">
                  {chart.columns.map((column, index) => (
                    <th key={column} className="px-4 py-3">
                      {index === 0 ? column : `${column} (in)`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {chart.rows.map(([size, ...values]) => (
                  <tr key={size} className="border-b border-concrete/10 last:border-0">
                    <td className="px-4 py-3 font-mono">{size}</td>
                    {values.map((value, index) => (
                      <td key={chart.columns[index + 1]} className="px-4 py-3">
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      <p className="mt-8 font-mono text-xs text-concrete">
        Still not sure? Reach out on the Contact page before you order.
      </p>
    </div>
  );
}
