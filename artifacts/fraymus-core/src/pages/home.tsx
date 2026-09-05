import { InfoCard } from "@/components/info-card";
import { Cpu, TerminalSquare, MonitorPlay, ShieldCheck, History, Activity } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen w-full blueprint-grid relative">
      {/* Top Navigation / Header */}
      <header className="sticky top-0 z-10 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-sm bg-primary flex items-center justify-center">
              <div className="w-2 h-2 bg-background" />
            </div>
            <div className="font-bold tracking-widest text-lg">
              FRAYMUS<span className="text-muted-foreground font-light ml-1">CORE</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-sm bg-card border shadow-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-slow" />
            <span className="text-xs font-mono font-medium text-foreground tracking-tight">ENGINE PRESERVED</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-16 lg:py-24">
        {/* Hero Section */}
        <section className="max-w-3xl mb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-secondary/50 border border-secondary text-xs font-mono mb-6">
            <Activity className="w-3.5 h-3.5 text-primary" />
            <span>WORKSPACE ENTRY POINT</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1] mb-6">
            Deterministic <span className="text-primary">Java 17</span><br />
            Simulation Engine.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed font-light max-w-2xl">
            A headless Java simulation core with episode data structures and a Java2D renderer adapter. This workspace preserves the original engine, tests, and historical reference source.
          </p>
        </section>

        {/* System Architecture Grid */}
        <section>
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-sm font-mono tracking-widest text-muted-foreground uppercase">System Architecture</h2>
            <div className="h-px bg-border flex-1" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <InfoCard 
              title="Headless Engine"
              description="The original executable runs the simulation without opening a graphics window. Its verified sample run advances 120 fixed ticks over two simulated seconds."
              icon={Cpu}
              delay={100}
              tags={["core-executable", "java-17", "headless-first"]}
            />
            
            <InfoCard 
              title="Desktop Renderer"
              description="The preserved desktop adapter renders the existing world through Java2D. Renderer tests run headlessly as part of the Maven verification suite."
              icon={MonitorPlay}
              delay={200}
              tags={["java2d", "desktop", "adapter"]}
            />

            <InfoCard 
              title="Deterministic Tests"
              description="The Maven suite covers deterministic simulation, the fixed-step clock, world and entity-component behavior, and Java2D rendering."
              icon={ShieldCheck}
              delay={300}
              tags={["junit", "maven-verify", "28-tests"]}
            />

            <InfoCard 
              title="Episode Recording"
              description="The core includes episode, observation, action-record, and recorder types for capturing accountable simulation runs."
              icon={TerminalSquare}
              delay={400}
              tags={["episodes", "observations", "actions"]}
            />

            <InfoCard 
              title="Reference Source"
              description="The legacy historical codebase is retained unchanged so its original algorithms and structural decisions remain available for reference."
              icon={History}
              delay={500}
              tags={["legacy", "read-only", "historical"]}
            />
          </div>
        </section>
      </main>
      
      {/* Footer Details */}
      <footer className="mt-auto border-t bg-card/50">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground font-mono">
            // SOURCE-PRESERVING PORT // NO LIVE TELEMETRY
          </p>
          <div className="text-xs text-muted-foreground font-mono">
            0.1.0-SNAPSHOT
          </div>
        </div>
      </footer>
    </div>
  );
}
