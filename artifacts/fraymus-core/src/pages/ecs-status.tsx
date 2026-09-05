import { useGetEcsStatus, getGetEcsStatusQueryKey } from '@workspace/api-client-react';
import { Cpu, Box, Activity, Layers, RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export default function EcsStatusPage() {
  const queryClient = useQueryClient();
  const { data: ecsStatus, isLoading, isFetching } = useGetEcsStatus({
    query: { 
      refetchInterval: 5000,
      queryKey: getGetEcsStatusQueryKey()
    }
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: getGetEcsStatusQueryKey() });
  };

  return (
    <div className="flex flex-col h-full w-full max-w-5xl mx-auto min-h-0 bg-[#0B0B0F]">
      <div className="h-[38px] shrink-0 flex items-center justify-between px-4 border-b border-white/[0.06] bg-[#151318]/50 backdrop-blur mb-4 rounded-t-[12px]">
        <div className="flex items-center gap-2 mono text-[11px] text-zinc-400">
          <span className="h-2 w-2 rounded-full bg-[#C2185B]" />
          <span className="tracking-[0.08em] uppercase">SYSTEM</span>
          <span className="text-zinc-600">/</span>
          <span className="text-zinc-300">ECS STATUS</span>
        </div>
        
        <button 
          onClick={handleRefresh}
          className="flex items-center gap-1.5 mono text-[10px] text-zinc-400 hover:text-zinc-200 uppercase tracking-widest transition"
          data-testid="button-refresh-ecs"
        >
          <RefreshCw className={`h-3 w-3 ${isFetching ? 'animate-spin text-[#C2185B]' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Overall ECS Status */}
        <div className="rounded-[12px] bg-[#151318] border border-white/[0.06] p-4 flex flex-col min-h-[140px] relative overflow-hidden group">
          <div className="flex items-center justify-between relative z-10">
            <span className="mono text-[10px] tracking-[0.12em] uppercase text-zinc-500">ECS Engine</span>
            <Cpu className="h-4 w-4 text-zinc-600" />
          </div>
          <div className="mt-auto relative z-10">
            {isLoading ? (
              <div className="h-8 w-1/2 bg-white/[0.04] rounded animate-pulse" />
            ) : (
              <div className="flex items-center gap-3">
                <span className={`text-2xl font-medium uppercase tracking-wide ${ecsStatus?.status === 'available' ? 'text-zinc-200' : 'text-zinc-500'}`}>
                  {ecsStatus?.status || 'Unknown'}
                </span>
                {ecsStatus?.status === 'available' && (
                  <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulseGlow" />
                )}
              </div>
            )}
          </div>
          
          {/* Decorative background glow */}
          {ecsStatus?.status === 'available' && (
            <div className="absolute -bottom-4 -right-4 h-24 w-24 bg-emerald-500/10 blur-xl rounded-full group-hover:bg-emerald-500/20 transition-all" />
          )}
        </div>

        {/* Maven Project */}
        <div className="rounded-[12px] bg-[#151318] border border-white/[0.06] p-4 flex flex-col min-h-[140px] relative overflow-hidden group">
          <div className="flex items-center justify-between relative z-10">
            <span className="mono text-[10px] tracking-[0.12em] uppercase text-zinc-500">Maven Project</span>
            <Box className="h-4 w-4 text-zinc-600" />
          </div>
          <div className="mt-auto relative z-10">
            {isLoading ? (
              <div className="h-8 w-1/2 bg-white/[0.04] rounded animate-pulse" />
            ) : (
              <div className="flex items-center gap-3">
                <span className={`text-2xl font-medium uppercase tracking-wide ${ecsStatus?.mavenProject === 'available' ? 'text-zinc-200' : 'text-zinc-500'}`}>
                  {ecsStatus?.mavenProject || 'Unknown'}
                </span>
                {ecsStatus?.mavenProject === 'available' && (
                  <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                )}
              </div>
            )}
          </div>
          
          {ecsStatus?.mavenProject === 'available' && (
            <div className="absolute -bottom-4 -right-4 h-24 w-24 bg-emerald-500/10 blur-xl rounded-full group-hover:bg-emerald-500/20 transition-all" />
          )}
        </div>

        {/* Process Status */}
        <div className="rounded-[12px] bg-[#151318] border border-white/[0.06] p-4 flex flex-col min-h-[140px] relative overflow-hidden group">
          <div className="flex items-center justify-between relative z-10">
            <span className="mono text-[10px] tracking-[0.12em] uppercase text-zinc-500">Process Daemon</span>
            <Activity className="h-4 w-4 text-zinc-600" />
          </div>
          <div className="mt-auto relative z-10">
            {isLoading ? (
              <div className="h-8 w-1/2 bg-white/[0.04] rounded animate-pulse" />
            ) : (
              <div className="flex items-center gap-3">
                <span className={`text-2xl font-medium uppercase tracking-wide ${ecsStatus?.process === 'available' ? 'text-zinc-200' : 'text-zinc-500'}`}>
                  {ecsStatus?.process || 'Unknown'}
                </span>
                {ecsStatus?.process === 'available' && (
                  <div className="h-2 w-2 rounded-full bg-[#C2185B] shadow-[0_0_8px_rgba(194,24,91,0.6)] animate-pulseGlow" />
                )}
              </div>
            )}
          </div>
          
          {ecsStatus?.process === 'available' && (
            <div className="absolute -bottom-4 -right-4 h-24 w-24 bg-[#C2185B]/10 blur-xl rounded-full group-hover:bg-[#C2185B]/20 transition-all" />
          )}
        </div>
      </div>
      
      {/* Simulation/ECS State preview (mock representation based on HTML) */}
      <div className="mt-4 rounded-[12px] bg-[#151318] border border-white/[0.06] shadow-[0_24px_64px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col flex-1 min-h-0">
        <div className="h-10 px-4 flex items-center justify-between border-b border-white/[0.06] shrink-0">
          <span className="mono text-[11px] tracking-[0.08em] uppercase text-zinc-400 flex items-center gap-2">
            <Layers className="h-3.5 w-3.5" /> Component State Buffer
          </span>
          <span className="mono text-[10px] px-2 py-0.5 rounded-full bg-[#C2185B]/10 border border-[#C2185B]/20 text-[#ff8ab8]">
            D=16384 anchored array
          </span>
        </div>
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="text-center max-w-sm">
            <div className="h-12 w-12 rounded-full bg-white/[0.02] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
              <Layers className="h-5 w-5 text-zinc-500" />
            </div>
            <p className="mono text-[12px] text-zinc-400 mb-2">
              Entity Component System state is monitored via FRAYMUS coherence watch. 
            </p>
            <p className="mono text-[10px] text-zinc-600 leading-[1.6]">
              Real-time component visualization is handled through the dedicated WebGL renderer in the desktop client.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
