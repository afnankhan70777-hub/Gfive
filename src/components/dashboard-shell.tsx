'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { ChatPanel } from '@/components/chat-panel';
import { ChatSubscriber } from '@/components/chat-subscriber';
import { useSupabaseSync } from '@/lib/use-supabase-sync';
import { useAuthStore } from '@/lib/store';

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const currentUser = useAuthStore((state) => state.currentUser);

  useEffect(() => {
    // Small delay to ensure Zustand store is hydrated from localStorage
    const timer = setTimeout(() => {
      setAuthChecked(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Only redirect after auth check is complete
    if (authChecked && (!isAuthenticated || !currentUser)) {
      router.replace('/login');
    }
  }, [authChecked, isAuthenticated, currentUser, router]);

  // CRITICAL: Always render loading spinner during SSR and initial client render.
  // This ensures the static HTML export contains ONLY the spinner, not the actual
  // dashboard content. Once React hydrates on the client, auth state is checked
  // and either the real content is shown or the user is redirected to login.
  // This prevents unauthenticated users from seeing pre-rendered dashboard data.
  const showContent = authChecked && isAuthenticated && currentUser;

  // Call hook BEFORE any conditional return to obey Rules of Hooks
  useSupabaseSync();

  if (!showContent) {
    return (
      <div className="flex h-screen w-screen bg-[#0a0e1a] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#c9a84c] border-t-transparent" />
          <span className="text-sm text-[#94a3b8]">Verifying session... </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-[#0a0e1a] overflow-hidden relative">
      {/* Ambient background effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Top-right ambient glow */}
        <div 
          className="absolute -top-40 -right-40 w-96 h-96 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(201, 168, 76, 0.06) 0%, transparent 70%)',
          }}
        />
        {/* Bottom-left ambient glow */}
        <div 
          className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.05) 0%, transparent 70%)',
          }}
        />
        {/* Center subtle glow */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.03) 0%, transparent 70%)',
          }}
        />
        {/* Grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(201, 168, 76, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(201, 168, 76, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
      </div>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative z-10">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
      <ChatPanel />
      <ChatSubscriber />
    </div>
  );
}
