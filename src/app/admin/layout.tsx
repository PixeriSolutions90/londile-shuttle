import AdminSidebar from '@/components/admin/AdminSidebar';

// Every page under /admin is a per-user, auth-gated dashboard — never
// statically prerender it (also avoids build-time execution of client-only
// code pulled in by this tree, e.g. the Supabase browser client).
export const dynamic = 'force-dynamic';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-10 py-6 lg:py-10">{children}</main>
    </div>
  );
}
