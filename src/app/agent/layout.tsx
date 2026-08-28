import AgentSidebar from '@/components/agent/AgentSidebar';

// Every page under /agent is a per-user, auth-gated dashboard — never
// statically prerender it. Also sidesteps build-time execution of
// client-only code (Supabase browser client, etc.) pulled in by this tree.
export const dynamic = 'force-dynamic';

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-50">
      <AgentSidebar />
      <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-10 py-6 lg:py-10">{children}</main>
    </div>
  );
}
