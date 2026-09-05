import { useState, useRef, useEffect } from 'react';
import { useExecuteTerminalOperation } from '@workspace/api-client-react';
import { TerminalSquare, Play, RefreshCw, Box, Layers, Activity } from 'lucide-react';
import { format } from 'date-fns';

type TerminalEntry = {
  id: string;
  type: 'command' | 'output' | 'error';
  content: string;
  timestamp: string;
};

type Operation = 'status' | 'list-files' | 'maven-version' | 'java-version';

export default function Terminal() {
  const executeOp = useExecuteTerminalOperation();
  const [entries, setEntries] = useState<TerminalEntry[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries]);

  const handleExecute = (operation: Operation) => {
    const ts = format(new Date(), 'HH:mm:ss.SSS');
    
    setEntries(prev => [...prev, {
      id: Date.now().toString() + '-cmd',
      type: 'command',
      content: operation,
      timestamp: ts
    }]);

    executeOp.mutate(
      { data: { operation } },
      {
        onSuccess: (res) => {
          setEntries(prev => [...prev, {
            id: Date.now().toString() + '-out',
            type: res.status === 'ok' ? 'output' : 'error',
            content: res.output,
            timestamp: format(new Date(), 'HH:mm:ss.SSS')
          }]);
        },
        onError: (err) => {
          setEntries(prev => [...prev, {
            id: Date.now().toString() + '-err',
            type: 'error',
            content: err.message,
            timestamp: format(new Date(), 'HH:mm:ss.SSS')
          }]);
        }
      }
    );
  };

  const clearTerminal = () => setEntries([]);

  return (
    <div className="flex flex-col h-full w-full max-w-5xl mx-auto min-h-0 bg-[#0B0B0F]">
      <div className="rounded-[12px] bg-[#151318] border border-white/[0.06] shadow-[0_24px_64px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col h-full">
        {/* Header */}
        <div className="h-10 flex items-center justify-between px-4 border-b border-white/[0.06] bg-[#151318] shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-[#3B0A14] border border-white/10" />
              <div className="h-3 w-3 rounded-full bg-[#1A2238] border border-white/10" />
              <div className="h-3 w-3 rounded-full bg-[#C2185B] shadow-[0_0_10px_rgba(194,24,91,0.5)]" />
            </div>
            <span className="mono text-[11px] tracking-[0.08em] uppercase text-zinc-400 flex items-center gap-1.5 ml-2">
              <TerminalSquare className="h-3.5 w-3.5" /> Direct Node PTY
            </span>
          </div>
          <button 
            onClick={clearTerminal}
            className="mono text-[10px] text-zinc-500 hover:text-zinc-300 transition uppercase tracking-widest"
          >
            Clear
          </button>
        </div>

        {/* Output Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 bg-[#0B0B0F] mono text-[13px] leading-[1.6]">
          {entries.length === 0 ? (
            <div className="text-zinc-600">
              Welcome to the FRAYMUS read-only terminal.<br/>
              Select an operation below to execute.
            </div>
          ) : (
            <div className="space-y-2">
              {entries.map(entry => (
                <div key={entry.id} className="flex gap-3 break-words">
                  <span className="text-zinc-600 shrink-0 w-24">{entry.timestamp}</span>
                  <div className="flex-1 min-w-0">
                    {entry.type === 'command' && (
                      <span className="text-[#C2185B]">$ {entry.content}</span>
                    )}
                    {entry.type === 'output' && (
                      <pre className="text-zinc-300 whitespace-pre-wrap font-inherit">{entry.content}</pre>
                    )}
                    {entry.type === 'error' && (
                      <pre className="text-red-400 whitespace-pre-wrap font-inherit">{entry.content}</pre>
                    )}
                  </div>
                </div>
              ))}
              {executeOp.isPending && (
                <div className="flex gap-3">
                  <span className="text-zinc-600 shrink-0 w-24">...</span>
                  <span className="text-zinc-500 animate-pulse">executing...</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Bar */}
        <div className="p-3 border-t border-white/[0.06] bg-[#151318] grid grid-cols-2 md:grid-cols-4 gap-2 shrink-0">
          <button
            onClick={() => handleExecute('status')}
            disabled={executeOp.isPending}
            className="h-10 rounded-[8px] bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.1] text-zinc-300 mono text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 transition disabled:opacity-50"
            data-testid="btn-term-status"
          >
            <Activity className="h-3.5 w-3.5 text-zinc-500" /> Status
          </button>
          
          <button
            onClick={() => handleExecute('list-files')}
            disabled={executeOp.isPending}
            className="h-10 rounded-[8px] bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.1] text-zinc-300 mono text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 transition disabled:opacity-50"
            data-testid="btn-term-list-files"
          >
            <Layers className="h-3.5 w-3.5 text-zinc-500" /> List Files
          </button>
          
          <button
            onClick={() => handleExecute('maven-version')}
            disabled={executeOp.isPending}
            className="h-10 rounded-[8px] bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.1] text-zinc-300 mono text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 transition disabled:opacity-50"
            data-testid="btn-term-maven"
          >
            <Box className="h-3.5 w-3.5 text-zinc-500" /> Maven Ver
          </button>
          
          <button
            onClick={() => handleExecute('java-version')}
            disabled={executeOp.isPending}
            className="h-10 rounded-[8px] bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.1] text-zinc-300 mono text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 transition disabled:opacity-50"
            data-testid="btn-term-java"
          >
            <Box className="h-3.5 w-3.5 text-zinc-500" /> Java Ver
          </button>
        </div>
      </div>
    </div>
  );
}
