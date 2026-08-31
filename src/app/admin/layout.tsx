export const metadata = {
  title: {
    default: 'Admin',
    template: '%s — GODDYS Admin',
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-ink font-body text-bone">{children}</div>;
}
