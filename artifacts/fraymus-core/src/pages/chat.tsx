import { useState, useRef, useEffect } from 'react';
import { useCreateChat, useGetModels } from '@workspace/api-client-react';
import { Send, Terminal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type Message = {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: string;
};

export default function Chat() {
  const { data: models } = useGetModels();
  const createChat = useCreateChat();
  const { toast } = useToast();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (models && models.length > 0 && !selectedModel) {
      setSelectedModel(models[0].id);
    }
  }, [models, selectedModel]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || createChat.isPending) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    createChat.mutate(
      { data: { message: userMsg.content, model: selectedModel } },
      {
        onSuccess: (res) => {
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'agent',
            content: res.message,
            timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
          }]);
        },
        onError: (err) => {
          toast({
            title: 'Request Failed',
            description: err.message,
            variant: 'destructive',
          });
        }
      }
    );
  };

  return (
    <div className="flex flex-col h-full w-full max-w-5xl mx-auto min-h-0 bg-[#0B0B0F] relative">
      <div className="h-[38px] shrink-0 flex items-center justify-between gap-3 px-4 border-b border-white/[0.06] bg-[#151318]/50 backdrop-blur">
        <div className="flex items-center gap-2 mono text-[11px] text-zinc-400">
          <span className="h-2 w-2 rounded-full bg-[#C2185B] shadow-[0_0_8px_rgba(194,24,91,0.6)] animate-pulseGlow" />
          <span className="tracking-[0.08em] uppercase">AGENT</span>
          <span className="text-zinc-600">/</span>
          <span className="text-zinc-300">CHAT</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="mono text-[10px] tracking-widest uppercase text-zinc-500 hidden md:inline">Model</span>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="appearance-none bg-[#0B0B0F] border border-white/[0.08] rounded-full px-3 py-0.5 pr-7 mono text-[10px] text-emerald-300 focus:outline-none focus:border-[#C2185B]/50 uppercase tracking-widest"
            data-testid="select-model"
          >
            {models?.map(m => (
              <option key={m.id} value={m.id}>{m.id}</option>
            ))}
            {!models?.length && <option value="">offline</option>}
          </select>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
            <Terminal className="h-12 w-12 text-zinc-600 mb-4" />
            <p className="mono text-[12px] text-zinc-400">AWAITING INSTRUCTIONS</p>
          </div>
        ) : (
          messages.map(msg => (
            <div 
              key={msg.id} 
              className={`rounded-[10px] border px-4 py-3 flex gap-3 ${
                msg.role === 'agent' 
                  ? "bg-[#1C1B20] border-[#C2185B]/30 shadow-[0_0_20px_rgba(194,24,91,0.15)]"
                  : "bg-[#151318] border-white/[0.06]"
              }`}
            >
              <div className="shrink-0 pt-1">
                {msg.role === 'agent' ? (
                  <div className="h-2 w-2 rounded-full bg-[#C2185B] shadow-[0_0_8px_rgba(194,24,91,0.8)] animate-pulseGlow" />
                ) : (
                  <span className="mono text-[11px] text-[#C2185B]">$</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <pre className="mono text-[13px] leading-[1.6] text-zinc-200 whitespace-pre-wrap break-words font-sans">
                  {msg.content}
                </pre>
                <div className="flex items-center gap-2 mt-2">
                  <span className="mono text-[10px] text-zinc-500 tracking-widest">{msg.timestamp}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <form 
        onSubmit={handleSubmit} 
        className="mt-2 shrink-0 flex items-center gap-2 rounded-[10px] bg-[#151318] border border-white/[0.08] px-3 py-2 focus-within:border-[#C2185B]/40 transition"
      >
        <span className="mono text-[12px] text-[#C2185B]">$</span>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="send instruction to agent..."
          className="flex-1 bg-transparent outline-none mono text-[13px] text-zinc-100 placeholder:text-zinc-600"
          disabled={createChat.isPending}
          data-testid="input-chat"
        />
        <button 
          type="submit" 
          disabled={!input.trim() || createChat.isPending}
          className="h-7 w-7 flex items-center justify-center rounded bg-[#1A2238] border border-white/[0.08] text-zinc-300 disabled:opacity-50 hover:bg-[#1A2238]/80 transition"
          data-testid="button-chat-submit"
        >
          {createChat.isPending ? (
            <div className="h-3 w-3 border-2 border-zinc-500 border-t-[#C2185B] rounded-full animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
        </button>
      </form>
    </div>
  );
}
