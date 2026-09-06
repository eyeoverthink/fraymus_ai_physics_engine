import { 
  useHealthCheck, 
  useGetSession, 
  useGetSystemStatus,
  useGetModels
} from '@workspace/api-client-react';
import { Activity, Server, Database, ShieldCheck, Box } from 'lucide-react';

export default function Overview() {
  const { data: health, isLoading: healthLoading } = useHealthCheck();
  const { data: session, isLoading: sessionLoading } = useGetSession();
  const { data: sys, isLoading: sysLoading } = useGetSystemStatus();
  const { data: models, isLoading: modelsLoading } = useGetModels();

  return (
    <div className="space-y-4 max-w-6xl mx-auto w-full">
      <div className="h-[38px] flex items-center gap-3 px-4 rounded-[12px] border border-white/[0.06] bg-[#151318]/50 backdrop-blur">
        <div className="flex items-center gap-2 mono text-[11px] text-zinc-400">
          <span className="h-2 w-2 rounded-full bg-[#C2185B] shadow-[0_0_8px_rgba(194,24,91,0.6)] animate-pulseGlow" />
          <span className="tracking-[0.08em] uppercase">SYSTEM</span>
          <span className="text-zinc-600">/</span>
          <span className="text-zinc-300">OVERVIEW</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* API Health */}
        <div className="rounded-[12px] bg-[#151318] border border-white/[0.06] p-4 shadow-[0_24px_64px_rgba(0,0,0,0.6)] flex flex-col justify-between min-h-[140px]">
          <div className="flex items-center justify-between">
            <span className="mono text-[10px] tracking-[0.12em] uppercase text-zinc-500">API Health</span>
            <Activity className="h-4 w-4 text-zinc-600" />
          </div>
          <div className="mt-4">
            {healthLoading ? (
              <div className="h-8 w-1/2 bg-white/[0.04] rounded animate-pulse" />
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-2xl text-zinc-200 font-medium">
                  {health?.status === 'ok' ? 'ONLINE' : 'DEGRADED'}
                </span>
                {health?.status === 'ok' && (
                  <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Database Status */}
        <div className="rounded-[12px] bg-[#151318] border border-white/[0.06] p-4 shadow-[0_24px_64px_rgba(0,0,0,0.6)] flex flex-col justify-between min-h-[140px]">
          <div className="flex items-center justify-between">
            <span className="mono text-[10px] tracking-[0.12em] uppercase text-zinc-500">Database</span>
            <Database className="h-4 w-4 text-zinc-600" />
          </div>
          <div className="mt-4">
            {sysLoading ? (
              <div className="h-8 w-1/2 bg-white/[0.04] rounded animate-pulse" />
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-2xl text-zinc-200 font-medium capitalize">
                  {sys?.database || 'Unknown'}
                </span>
                {sys?.database === 'connected' && (
                  <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Current Session */}
        <div className="rounded-[12px] bg-[#1A2238]/60 border border-white/[0.06] p-4 flex flex-col justify-between min-h-[140px]">
          <div className="flex items-center justify-between">
            <span className="mono text-[10px] tracking-[0.12em] uppercase text-zinc-400">Control Session</span>
            <ShieldCheck className="h-4 w-4 text-zinc-500" />
          </div>
          <div className="mt-4">
            {sessionLoading ? (
              <div className="h-8 w-3/4 bg-white/[0.04] rounded animate-pulse" />
            ) : (
              <div>
                <div className="mono text-[12px] text-zinc-300 truncate" title={session?.userId}>
                  {session?.userId}
                </div>
                <div className="mono text-[10px] text-emerald-400 mt-1">
                  {session?.authenticated ? 'Authenticated' : 'Unauthenticated'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Models Available */}
        <div className="rounded-[12px] bg-[#151318] border border-white/[0.06] p-4 flex flex-col justify-between min-h-[140px]">
          <div className="flex items-center justify-between">
            <span className="mono text-[10px] tracking-[0.12em] uppercase text-zinc-500">AI Providers</span>
            <Box className="h-4 w-4 text-zinc-600" />
          </div>
          <div className="mt-4">
            {modelsLoading ? (
              <div className="h-8 w-1/4 bg-white/[0.04] rounded animate-pulse" />
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-2xl text-zinc-200 font-medium">
                  {models?.length || 0}
                </span>
                <span className="mono text-[10px] text-zinc-500">Live</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
