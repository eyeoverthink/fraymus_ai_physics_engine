import { Link } from 'wouter';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-[#0B0B0F] p-4 text-center">
      <div className="text-[64px] font-mono font-medium text-[#C2185B] mb-2 leading-none">404</div>
      <h1 className="text-xl text-zinc-200 mb-6 font-mono tracking-wide">SYSTEM_FAULT: ROUTE_NOT_FOUND</h1>
      <p className="text-zinc-500 font-mono text-[12px] mb-8 max-w-md">
        The control plane module you are attempting to access does not exist or has been disabled.
      </p>
      <Link 
        href="/" 
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#1A2238] border border-white/[0.08] text-zinc-300 hover:bg-[#1A2238]/80 hover:text-white transition mono text-[12px] uppercase tracking-widest"
      >
        <Home className="h-4 w-4" />
        Return to Overview
      </Link>
    </div>
  );
}
