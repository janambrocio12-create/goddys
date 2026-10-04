import Link from 'next/link';

/** Prev/Next pager for the admin list pages. Keeps whatever filter
 * params are already on the URL (e.g. orders' ?status=) and only adds
 * ?page= when it's not page 1, so existing links/bookmarks still work. */
export function AdminPagination({
  page,
  pageSize,
  totalCount,
  basePath,
  searchParams,
}: {
  page: number;
  pageSize: number;
  totalCount: number;
  basePath: string;
  searchParams?: Record<string, string | undefined>;
}) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  if (totalPages <= 1) return null;

  function hrefFor(targetPage: number) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams ?? {})) {
      if (key !== 'page' && value) params.set(key, value);
    }
    if (targetPage > 1) params.set('page', String(targetPage));
    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
  }

  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <div className="mt-6 flex items-center justify-between font-mono text-xs uppercase tracking-wide text-concrete">
      <p>
        Page {page} of {totalPages}
      </p>
      <div className="flex gap-2">
        {hasPrev ? (
          <Link
            href={hrefFor(page - 1)}
            className="border border-concrete/40 px-3 py-1.5 hover:border-bone hover:text-bone"
          >
            Prev
          </Link>
        ) : (
          <span className="border border-concrete/20 px-3 py-1.5 text-concrete/40">Prev</span>
        )}
        {hasNext ? (
          <Link
            href={hrefFor(page + 1)}
            className="border border-concrete/40 px-3 py-1.5 hover:border-bone hover:text-bone"
          >
            Next
          </Link>
        ) : (
          <span className="border border-concrete/20 px-3 py-1.5 text-concrete/40">Next</span>
        )}
      </div>
    </div>
  );
}
