import { useGetEpisodes, useGetEvents } from '@workspace/api-client-react';
import { Server, Activity } from 'lucide-react';
import { format } from 'date-fns';

export default function EpisodesEvents() {
  const { data: episodes, isLoading: epLoading } = useGetEpisodes();
  const { data: events, isLoading: evLoading } = useGetEvents();

  return (
    <div className="flex flex-col h-full w-full max-w-6xl mx-auto min-h-0 bg-[#0B0B0F]">
      <div className="h-[38px] shrink-0 flex items-center gap-3 px-4 border-b border-white/[0.06] bg-[#151318]/50 backdrop-blur mb-4 rounded-t-[12px]">
        <div className="flex items-center gap-2 mono text-[11px] text-zinc-400">
          <span className="h-2 w-2 rounded-full bg-[#C2185B]" />
          <span className="tracking-[0.08em] uppercase">SYSTEM</span>
          <span className="text-zinc-600">/</span>
          <span className="text-zinc-300">EPISODES & EVENTS</span>
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Episodes */}
        <div className="flex flex-col rounded-[12px] bg-[#151318] border border-white/[0.06] shadow-[0_24px_64px_rgba(0,0,0,0.6)] overflow-hidden">
          <div className="h-10 px-4 flex items-center justify-between border-b border-white/[0.06] shrink-0">
            <span className="mono text-[11px] tracking-[0.08em] uppercase text-zinc-400 flex items-center gap-2">
              <Server className="h-3.5 w-3.5" /> Episodes
            </span>
            <span className="mono text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-zinc-400">
              {episodes?.length || 0} total
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {epLoading ? (
              <div className="space-y-2">
                <div className="h-12 w-full bg-white/[0.02] rounded-md animate-pulse" />
                <div className="h-12 w-full bg-white/[0.02] rounded-md animate-pulse" />
              </div>
            ) : episodes?.length === 0 ? (
              <div className="text-center py-8 mono text-[11px] text-zinc-600">No episodes found.</div>
            ) : (
              episodes?.map(ep => (
                <div key={ep.id} className="rounded-[10px] bg-[#0B0B0F] border border-white/[0.04] p-3">
                  <div className="flex items-center justify-between">
                    <span className="mono text-[12px] text-zinc-200 font-medium break-all">{ep.id}</span>
                    <span className="mono text-[10px] text-zinc-500 whitespace-nowrap ml-2">
                      {format(new Date(ep.createdAt), "MMM d, HH:mm:ss")}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <span className="mono text-[10px] px-1.5 py-0.5 rounded-full bg-[#1A2238] border border-white/[0.06] text-zinc-400">
                      kind: {ep.kind}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Events */}
        <div className="flex flex-col rounded-[12px] bg-[#151318] border border-white/[0.06] shadow-[0_24px_64px_rgba(0,0,0,0.6)] overflow-hidden">
          <div className="h-10 px-4 flex items-center justify-between border-b border-white/[0.06] shrink-0">
            <span className="mono text-[11px] tracking-[0.08em] uppercase text-zinc-400 flex items-center gap-2">
              <Activity className="h-3.5 w-3.5" /> Receipt Events
            </span>
            <span className="mono text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-zinc-400">
              {events?.length || 0} total
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {evLoading ? (
              <div className="space-y-2">
                <div className="h-12 w-full bg-white/[0.02] rounded-md animate-pulse" />
                <div className="h-12 w-full bg-white/[0.02] rounded-md animate-pulse" />
              </div>
            ) : events?.length === 0 ? (
              <div className="text-center py-8 mono text-[11px] text-zinc-600">No events found.</div>
            ) : (
              events?.map(ev => (
                <div key={ev.id} className="rounded-[10px] bg-[#0B0B0F] border border-white/[0.04] p-3">
                  <div className="flex items-center justify-between">
                    <span className="mono text-[12px] text-zinc-200 font-medium break-all">{ev.id}</span>
                    <span className="mono text-[10px] text-zinc-500 whitespace-nowrap ml-2">
                      {format(new Date(ev.createdAt), "MMM d, HH:mm:ss")}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <span className="mono text-[10px] px-1.5 py-0.5 rounded-full bg-[#C2185B]/10 border border-[#C2185B]/20 text-[#ff8ab8]">
                      {ev.type}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
