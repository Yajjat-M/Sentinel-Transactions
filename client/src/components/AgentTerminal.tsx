import { useEffect, useRef } from "react";
import { Terminal, Activity, BrainCircuit, Eye, Database, ShieldAlert, RefreshCw, Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";
import { type AgentLog } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface AgentTerminalProps {
  logs: AgentLog[];
  currentPhase: string;
  isRunning: boolean;
}

const PhaseIcon = ({ phase, isActive }: { phase: string; isActive: boolean }) => {
  const icons: Record<string, any> = {
    OBSERVE: Eye,
    REASON: BrainCircuit,
    DECIDE: Activity,
    ACT: ShieldAlert,
    LEARN: Database,
  };
  const Icon = icons[phase] || Activity;
  
  return (
    <div className={cn(
      "flex flex-col items-center gap-2 transition-all duration-300",
      isActive ? "scale-110 opacity-100" : "opacity-40 scale-90 grayscale"
    )}>
      <div className={cn(
        "h-12 w-12 rounded-full flex items-center justify-center border-2 transition-all",
        isActive 
          ? "bg-primary/20 border-primary text-primary shadow-[0_0_15px_rgba(59,130,246,0.5)]" 
          : "bg-secondary border-border text-muted-foreground"
      )}>
        <Icon className="h-6 w-6" />
      </div>
      <span className={cn("text-xs font-mono font-bold tracking-wider", isActive ? "text-primary" : "text-muted-foreground")}>
        {phase}
      </span>
    </div>
  );
};

export function AgentTerminal({ logs, currentPhase, isRunning }: AgentTerminalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const handleReset = async () => {
    try {
      await fetch('/api/reset', { method: 'POST' });
      toast({ title: "System Reset", description: "Database and Agent have been reset." });
      queryClient.invalidateQueries({ queryKey: ['/api/agent/status'] });
    } catch (error) {
      toast({ title: "Error", description: "Failed to reset system", variant: "destructive" });
    }
  };

  const handleToggle = async () => {
    try {
      const endpoint = isRunning ? '/api/agent/stop' : '/api/agent/start';
      await fetch(endpoint, { method: 'POST' });
      toast({ title: isRunning ? "Agent Stopped" : "Agent Started", description: `System is now ${isRunning ? 'offline' : 'online'}.` });
      queryClient.invalidateQueries({ queryKey: ['/api/agent/status'] });
    } catch (error) {
      toast({ title: "Error", description: "Failed to toggle agent", variant: "destructive" });
    }
  };

  const phases = ["OBSERVE", "REASON", "DECIDE", "ACT", "LEARN"];

  return (
    <div className="glass-card rounded-2xl overflow-hidden flex flex-col h-[500px]">
      <div className="bg-card border-b border-border/50 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="h-5 w-5 text-primary" />
          <h3 className="font-display font-semibold">Live Agent Log</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleToggle} className="h-8 gap-2">
            {isRunning ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            {isRunning ? "Pause" : "Start"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleReset} className="h-8 gap-2">
            <RefreshCw className="h-3 w-3" />
            Reset
          </Button>
          <div className="w-px h-4 bg-border mx-2" />
          <span className={cn(
            "h-2 w-2 rounded-full", 
            isRunning ? "bg-green-500 animate-pulse" : "bg-red-500"
          )} />
          <span className="text-xs font-mono text-muted-foreground">
            {isRunning ? "ONLINE" : "OFFLINE"}
          </span>
        </div>
      </div>

      <div className="p-6 border-b border-border/50 bg-background/50">
        <div className="flex justify-between items-center max-w-2xl mx-auto">
          {phases.map((phase, idx) => (
            <div key={phase} className="flex items-center">
              <PhaseIcon phase={phase} isActive={currentPhase === phase} />
              {idx < phases.length - 1 && (
                <div className="w-12 h-0.5 bg-border mx-2" />
              )}
            </div>
          ))}
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 font-mono text-sm space-y-2 bg-black/40"
      >
        {logs.map((log) => (
          <div key={log.id} className="flex gap-4 animate-in fade-in slide-in-from-left-2 duration-300">
            <span className="text-muted-foreground shrink-0 w-24">{log.timestamp}</span>
            <span className={cn(
              "font-bold shrink-0 w-20",
              log.phase === "ACT" ? "text-red-400" :
              log.phase === "DECIDE" ? "text-yellow-400" :
              log.phase === "REASON" ? "text-blue-400" :
              "text-green-400"
            )}>[{log.phase}]</span>
            <span className="text-foreground/90">{log.message}</span>
            {log.details && <span className="text-muted-foreground italic truncate">({log.details})</span>}
          </div>
        ))}
        {logs.length === 0 && (
          <div className="text-muted-foreground text-center py-10 italic">
            Waiting for agent logs...
          </div>
        )}
      </div>
    </div>
  );
}
