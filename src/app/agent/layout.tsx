import AgentSidebar from '@/components/agent/AgentSidebar';

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-50">
      <AgentSidebar />
      <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-10 py-6 lg:py-10">{children}</main>
    </div>
  );
}
