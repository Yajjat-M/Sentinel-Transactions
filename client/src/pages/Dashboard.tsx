import { useStats, useAgentStatus } from "@/hooks/use-dashboard";
import { Sidebar } from "@/components/Sidebar";
import { StatCard } from "@/components/StatCard";
import { AgentTerminal } from "@/components/AgentTerminal";
import { ShieldCheck, AlertTriangle, Activity, Lock, TrendingUp, Sparkles } from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { useState, useEffect } from "react";
import HeroSection from "@/components/ui/glassmorphism-trust-hero";
import { Link } from "wouter";

// Mock data for charts since the backend only provides summary stats
const CHART_DATA = [
  { time: '09:00', risk: 20, volume: 150 },
  { time: '10:00', risk: 35, volume: 220 },
  { time: '11:00', risk: 15, volume: 180 },
  { time: '12:00', risk: 45, volume: 300 },
  { time: '13:00', risk: 80, volume: 250 }, // Spike
  { time: '14:00', risk: 50, volume: 210 },
  { time: '15:00', risk: 30, volume: 190 },
];

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useStats();
  const { data: agentStatus, isLoading: agentLoading } = useAgentStatus();
  const [showHero, setShowHero] = useState(false);

  useEffect(() => {
    const hasSeenHero = localStorage.getItem("sentinel_nux_complete");
    if (!hasSeenHero) {
      setShowHero(true);
    }
  }, []);

  const handleDismissHero = () => {
    localStorage.setItem("sentinel_nux_complete", "true");
    setShowHero(false);
  };

  if (statsLoading || agentLoading || !stats || !agentStatus) {
    return (
      <div className="flex h-screen bg-background items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        {showHero && (
          <div className="relative group mb-8">
            <button 
              onClick={handleDismissHero}
              className="absolute top-4 right-4 z-20 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-xs font-medium backdrop-blur-md transition-colors border border-white/10"
            >
              Skip Intro
            </button>
            <HeroSection />
          </div>
        )}

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">Live Monitoring</h1>
            <p className="text-muted-foreground mt-1 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              Real-time fraud detection overview
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-sm font-medium border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              System Operational
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link href="/transactions" className="block hover-elevate no-underline">
            <StatCard 
              title="Total Transactions" 
              value={stats.totalTransactions.toLocaleString()} 
              icon={Activity}
              description="Last 24 hours"
            />
          </Link>
          <StatCard 
            title="Failure Rate" 
            value={`${(stats.failureRate).toFixed(1)}%`}
            icon={AlertTriangle}
            trend={stats.failureRate > 5 ? "High" : "Normal"}
            trendUp={stats.failureRate <= 5}
            className={stats.failureRate > 5 ? "border-red-500/50" : ""}
          />
          <Link href="/blocked" className="block hover-elevate no-underline">
            <StatCard 
              title="Blocked Threats" 
              value={stats.blockedCount}
              icon={Lock}
              description="Prevented fraud attempts"
            />
          </Link>
          <StatCard 
            title="Avg Risk Score" 
            value={stats.avgRiskScore.toFixed(0)}
            icon={ShieldCheck}
            trend={stats.fraudSpikeDetected ? "Spike Detected" : "Stable"}
            trendUp={!stats.fraudSpikeDetected}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Main Chart */}
          <div className="lg:col-span-2 glass-card p-6 rounded-2xl">
            <h3 className="font-display font-semibold mb-6 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Transaction Volume vs Risk
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={CHART_DATA}>
                  <defs>
                    <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                    itemStyle={{ color: '#e2e8f0' }}
                  />
                  <Area type="monotone" dataKey="volume" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorVolume)" />
                  <Area type="monotone" dataKey="risk" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorRisk)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Side Info / Quick Actions */}
          <div className="glass-card p-6 rounded-2xl flex flex-col justify-between">
            <div>
              <h3 className="font-display font-semibold mb-4">System Health</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">API Latency</span>
                  <span className="text-sm font-mono text-green-400">45ms</span>
                </div>
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                  <div className="bg-green-500 h-full w-[20%]"></div>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm text-muted-foreground">Database Load</span>
                  <span className="text-sm font-mono text-yellow-400">62%</span>
                </div>
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                  <div className="bg-yellow-500 h-full w-[62%]"></div>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm text-muted-foreground">Fraud Engine Confidence</span>
                  <span className="text-sm font-mono text-primary">98.5%</span>
                </div>
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                  <div className="bg-primary h-full w-[98%]"></div>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-primary/10 rounded-xl border border-primary/20">
              <h4 className="text-primary font-medium text-sm mb-2">Insight</h4>
              <p className="text-xs text-muted-foreground">
                Transaction volume is trending normal, but a small spike in high-risk scores was detected at 13:00. The AI agent has increased monitoring sensitivity.
              </p>
            </div>
          </div>
        </div>

        {/* Live Agent Terminal */}
        <AgentTerminal 
          logs={agentStatus.logs} 
          currentPhase={agentStatus.currentPhase}
          isRunning={agentStatus.isRunning}
        />
      </main>
    </div>
  );
}
