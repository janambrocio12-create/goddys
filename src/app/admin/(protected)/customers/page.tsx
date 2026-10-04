import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { AdminPagination } from '@/components/admin/admin-pagination';

const PAGE_SIZE = 20;

export default async function CustomersListPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const supabase = createClient();
  const page = Math.max(1, Number(searchParams.page) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data: customers, error, count } = await supabase
    .from('customers')
    .select('id, full_name, email, phone, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  return (
    <div>
      <h1 className="font-display text-2xl tracking-tightest">Customers</h1>
      <p className="mt-1 text-sm text-concrete">
        {count ?? 0} customer{count === 1 ? '' : 's'}.
      </p>

      {error && (
        <p className="mt-6 border border-danger px-4 py-3 font-mono text-xs text-danger">
          Could not load customers: {error.message}
        </p>
      )}

      {!error && (customers?.length ?? 0) === 0 && (
        <div className="mt-10 border border-dashed border-concrete/40 p-10 text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-concrete">
            No customers yet
          </p>
        </div>
      )}

      {!error && (customers?.length ?? 0) > 0 && (
        <div className="mt-8 overflow-x-auto border border-concrete/20">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-concrete/20 bg-panel font-mono text-[10px] uppercase tracking-widest text-concrete">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {customers!.map((customer) => (
                <tr key={customer.id} className="border-b border-concrete/10 last:border-0">
                  <td className="px-4 py-3">{customer.full_name ?? '-'}</td>
                  <td className="px-4 py-3 font-mono text-xs text-concrete">
                    {customer.email ?? '-'}
                  </td>
                  <td className="px-4 py-3 text-concrete">{customer.phone ?? '-'}</td>
                  <td className="px-4 py-3 text-concrete">
                    {new Date(customer.created_at).toLocaleDateString('en-PH', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/customers/${customer.id}`}
                      className="font-mono text-xs uppercase tracking-wide underline underline-offset-4 hover:text-hazard"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AdminPagination
        page={page}
        pageSize={PAGE_SIZE}
        totalCount={count ?? 0}
        basePath="/admin/customers"
      />
    </div>
  );
}
