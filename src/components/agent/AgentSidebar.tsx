'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { IconInbox, IconCheck, IconPlus, IconLogOut, IconCar } from '@/components/icons';
import { getSupabaseBrowserClient, signOutUser } from '@/lib/auth';

const NAV_ITEMS = [
  { href: '/agent', label: 'Pending Orders', icon: IconInbox },
  { href: '/agent/approved', label: 'Approved Orders', icon: IconCheck },
  { href: '/agent/new-booking', label: 'Make a Booking', icon: IconPlus },
];

export default function AgentSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [agentLabel, setAgentLabel] = useState<{ name: string; email: string } | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    async function loadAgent() {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        // Dev-preview mode (middleware bypass) has no real session.
        setAgentLabel({ name: 'Preview Agent', email: 'dev-preview mode' });
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, surname')
        .eq('id', data.user.id)
        .single();

      const name = [profile?.first_name, profile?.surname].filter(Boolean).join(' ');
      setAgentLabel({ name: name || 'Agent', email: data.user.email ?? '' });
    }

    loadAgent();
  }, []);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOutUser();
    } catch (error) {
      console.error('Sign out failed:', error);
    } finally {
      router.push('/auth/login');
      router.refresh();
    }
  };

  return (
    <aside className="w-full lg:w-64 shrink-0 bg-white border-r border-gray-100 flex lg:flex-col">
      {/* Brand */}
      <div className="hidden lg:flex items-center gap-2.5 px-6 py-5 border-b border-gray-100">
        <span className="flex items-center justify-center w-9 h-9 rounded-lg text-white" style={{ backgroundColor: '#003b70' }}>
          <IconCar className="w-5 h-5" />
        </span>
        <div>
          <p className="text-sm font-bold" style={{ color: '#003b70' }}>Londile Shuttle</p>
          <p className="text-xs text-gray-400">Agent Portal</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex lg:flex-col flex-1 px-2 lg:px-3 py-2 lg:py-4 gap-1 overflow-x-auto lg:overflow-visible">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                isActive ? 'text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
              style={isActive ? { backgroundColor: '#003b70' } : undefined}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Agent info / logout */}
      <div className="hidden lg:block px-4 py-4 border-t border-gray-100">
        <p className="text-sm font-medium text-gray-800">{agentLabel?.name ?? '…'}</p>
        <p className="text-xs text-gray-400 mb-3 truncate">{agentLabel?.email}</p>
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
        >
          <IconLogOut className="w-4 h-4" />
          {signingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    </aside>
  );
}
