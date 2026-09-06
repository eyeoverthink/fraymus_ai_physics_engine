import { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { 
  TerminalSquare, 
  Activity, 
  Cpu, 
  MessageSquare, 
  FolderTree, 
  Server,
  LogOut
} from 'lucide-react';
import { useClerk } from '@clerk/clerk-react';
import { useGetSystemStatus, getGetSystemStatusQueryKey } from '@workspace/api-client-react';

const navItems = [
  { href: '/', label: 'Overview', icon: Activity, id: 'overview' },
  { href: '/chat', label: 'Chat & Models', icon: MessageSquare, id: 'chat' },
  { href: '/episodes', label: 'Episodes & Events', icon: Server, id: 'episodes' },
  { href: '/workspace', label: 'Workspace IO', icon: FolderTree, id: 'workspace' },
  { href: '/terminal', label: 'Terminal', icon: TerminalSquare, id: 'terminal' },
  { href: '/ecs', label: 'ECS Status', icon: Cpu, id: 'ecs' },
];

export default function Shell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { signOut } = useClerk();
  
  const { data: sysStatus } = useGetSystemStatus({
    query: {
      refetchInterval: 10000,
      queryKey: getGetSystemStatusQueryKey(),
    }
  });

  return (
    <div className="flex flex-col h-[100dvh] bg-[#0B0B0F] text-zinc-300 font-sans overflow-hidden">
      {/* Global Top Bar */}
      <div className="relative z-10 border-b border-white/[0.06] bg-[#0B0B0F] shrink-0">
        <div className="px-4 md:px-6 py-3 flex items-center gap-3 overflow-x-auto">
          <div className="flex items-center gap-2 shrink-0">
            <div className="h-6 w-6 rounded-[6px] bg-[#C2185B] flex items-center justify-center shadow-[0_0_12px_rgba(194,24,91,0.4)]">
              <TerminalSquare className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="mono text-[11px] tracking-[0.14em] uppercase text-zinc-400">
              FRAYMUS SFA Dashboard
            </span>
            <span className="mono text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.06] text-zinc-400 ml-2">
              SECURE PLANE
            </span>
          </div>

          <div className="h-px w-8 bg-white/10 hidden md:block shrink-0" />

          <div className="flex items-center gap-2 mono text-[11px] text-zinc-500 shrink-0">
            <span className="flex items-center gap-1.5 text-zinc-300">
              <span className={`h-2 w-2 rounded-full shadow-[0_0_8px_rgba(194,24,91,0.6)] ${sysStatus?.status === 'ok' ? 'bg-emerald-500' : 'bg-[#C2185B]'}`} />
              API Server
            </span>
            <div className="h-3 w-3 opacity-40" />
            <span className="flex items-center gap-1">
              DB: {sysStatus?.database || 'unknown'}
            </span>
          </div>

          <div className="ml-auto flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#151318] border border-white/[0.06]">
              <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
              <span className="mono text-[10px] tracking-widest uppercase text-zinc-300">Connected</span>
            </div>
            <button 
              onClick={() => signOut()}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition"
              data-testid="button-sign-out"
            >
              <LogOut className="h-3 w-3 text-zinc-400" />
              <span className="mono text-[10px] tracking-widest uppercase text-zinc-400">Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative noise">
        {/* Left Sidebar */}
        <div className="hidden lg:flex w-[240px] shrink-0 flex-col border-r border-white/[0.06] bg-[#0B0B0F] relative z-10">
          <div className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="mono text-[11px] tracking-[0.12em] uppercase text-zinc-500">Modules</span>
            </div>
          </div>
          <div className="flex-1 px-3 pb-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const active = location === item.href;
              const Icon = item.icon;
              return (
                <Link key={item.id} href={item.href} className={`w-full text-left rounded-[12px] border px-3 py-2.5 transition-all flex items-start gap-2.5 group ${active ? "bg-[#151318] border-white/[0.08] shadow-[0_8px_24px_rgba(0,0,0,0.5)]" : "bg-transparent border-transparent hover:bg-white/[0.03] hover:border-white/[0.04]"}`}>
                  <div className="relative mt-1">
                    <div className="h-2 w-2 rounded-full" style={{ background: active ? '#C2185B' : '#71717a', boxShadow: active ? '0 0 8px #C2185B' : undefined }} />
                    {active && <div className="absolute -inset-1 rounded-full animate-quietPulse" style={{ background: '#C2185B', opacity: 0.2 }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[13px] font-medium leading-none tracking-tight ${active ? 'text-zinc-200' : 'text-zinc-400'}`}>
                        {item.label}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 relative z-10 bg-[#0B0B0F]">
          <div className="flex-1 flex flex-col min-h-0 overflow-y-auto p-3 md:p-4">
            {children}
          </div>
        </div>
      </div>
      
      {/* Mobile nav */}
      <div className="lg:hidden border-t border-white/[0.06] bg-[#0B0B0F] p-2 flex gap-2 overflow-x-auto relative z-10">
        {navItems.map((item) => {
          const active = location === item.href;
          return (
            <Link key={item.id} href={item.href} className={`shrink-0 px-3 py-1.5 rounded-full border mono text-[11px] tracking-wide ${active ? "bg-[#151318] border-[#C2185B]/30 text-zinc-200" : "bg-white/[0.03] border-white/[0.06] text-zinc-500"}`}>
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
