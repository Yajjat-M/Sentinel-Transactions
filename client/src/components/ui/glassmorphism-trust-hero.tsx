import React from "react";
import { 
  ArrowRight, 
  Play, 
  Target, 
  Crown, 
  Star,
  Hexagon,
  Triangle,
  Command,
  Ghost,
  Gem,
  Cpu
} from "lucide-react";
import heroFintech from "@/assets/images/hero-fintech.png";

// --- MOCK BRANDS ---
const CLIENTS = [
  { name: "Acme Corp", icon: Hexagon },
  { name: "Quantum", icon: Triangle },
  { name: "Command+Z", icon: Command },
  { name: "Phantom", icon: Ghost },
  { name: "Ruby", icon: Gem },
  { name: "Chipset", icon: Cpu },
];

// --- SUB-COMPONENTS ---
const StatItem = ({ value, label }: { value: string; label: string }) => (
  <div className="flex flex-col items-center justify-center transition-transform hover:-translate-y-1 cursor-default">
    <span className="text-xl font-bold text-white sm:text-2xl">{value}</span>
    <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium sm:text-xs">{label}</span>
  </div>
);

// --- MAIN COMPONENT ---
export default function HeroSection() {
  return (
    <div className="relative w-full bg-zinc-950 text-white overflow-hidden font-sans rounded-xl mb-8">
      {/* 
        SCOPED ANIMATIONS 
      */}
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .animate-fade-in {
          animation: fadeSlideIn 0.8s ease-out forwards;
          opacity: 0;
        }
        .animate-marquee {
          animation: marquee 40s linear infinite;
        }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        .delay-400 { animation-delay: 0.4s; }
        .delay-500 { animation-delay: 0.5s; }
      `}</style>

      {/* Background Image with Gradient Mask */}
      <div 
        className="absolute inset-0 z-0 opacity-40"
        style={{
          backgroundImage: `url(${heroFintech})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          maskImage: "linear-gradient(180deg, transparent, black 0%, black 70%, transparent)",
          WebkitMaskImage: "linear-gradient(180deg, transparent, black 0%, black 70%, transparent)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-12 pb-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8 items-start">
          
          {/* --- LEFT COLUMN --- */}
          <div className="lg:col-span-7 flex flex-col justify-center space-y-8 pt-8">
            
            {/* Badge */}
            <div className="animate-fade-in delay-100">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 backdrop-blur-md transition-colors hover:bg-white/10">
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                  Autonomous AI Operations
                  <Cpu className="w-3.5 h-3.5 text-blue-400 fill-blue-400/20" />
                </span>
              </div>
            </div>

            {/* Title */}
            <div className="space-y-4 animate-fade-in delay-200">
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
                The Sentinel <br />
                <span className="bg-gradient-to-r from-white via-zinc-400 to-zinc-600 bg-clip-text text-transparent">
                  AI Dashboard
                </span>
              </h1>
              <p className="max-w-xl text-lg text-zinc-400 leading-relaxed">
                Sentinel AI monitors, investigates, and blocks risky payments in real time. 
                Harnessing the power of agentic AI to protect your fintech ecosystem.
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-4 animate-fade-in delay-300">
              <button className="group flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition-all hover:bg-zinc-200 active:scale-95">
                Start Monitoring
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
              <button className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold backdrop-blur-md transition-all hover:bg-white/10 active:scale-95">
                <Play className="w-4 h-4 fill-white" />
                Watch Demo
              </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-8 pt-4 border-t border-white/5 animate-fade-in delay-400">
              <StatItem value="100ms" label="Response" />
              <StatItem value="99.9%" label="Accuracy" />
              <StatItem value="24/7" label="Uptime" />
            </div>
          </div>

          {/* --- RIGHT COLUMN: FLOATING CARD --- */}
          <div className="hidden lg:col-span-5 lg:flex flex-col items-center justify-center animate-fade-in delay-500">
            <div className="relative group">
              {/* Outer Glow */}
              <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-tr from-white/20 to-transparent opacity-50 blur-xl transition-opacity group-hover:opacity-75" />
              
              {/* Glass Card */}
              <div className="relative rounded-2xl border border-white/10 bg-zinc-900/50 p-6 backdrop-blur-xl transition-transform group-hover:-translate-y-2">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-black">
                      <Target className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">Security Score</h3>
                      <p className="text-xs text-zinc-500">Real-time analysis</p>
                    </div>
                  </div>
                  <Crown className="w-5 h-5 text-zinc-500" />
                </div>

                <div className="space-y-4">
                  <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
                    <div className="h-full w-[85%] bg-white rounded-full" />
                  </div>
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-zinc-500">Threat Detected</span>
                    <span className="text-white">Low Risk</span>
                  </div>
                </div>

                {/* Micro-feed placeholder */}
                <div className="mt-8 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 rounded-lg bg-white/5 p-2 border border-white/5">
                      <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                      <div className="h-2 w-24 rounded bg-zinc-700" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* --- LOGO MARQUEE --- */}
        <div className="mt-20 border-t border-white/5 pt-12 animate-fade-in delay-500">
          <p className="text-center text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-semibold mb-8">
            Trusted by the next generation of fintech
          </p>
          <div className="relative flex overflow-hidden group">
            <div className="flex animate-marquee gap-12 items-center whitespace-nowrap py-4">
              {[...CLIENTS, ...CLIENTS].map((client, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center gap-3 text-zinc-400 transition-colors hover:text-white"
                >
                  <client.icon className="w-5 h-5" />
                  <span className="text-sm font-medium tracking-tight uppercase">{client.name}</span>
                </div>
              ))}
            </div>
            {/* Gradient Fades for Marquee */}
            <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-zinc-950 to-transparent z-10" />
            <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-zinc-950 to-transparent z-10" />
          </div>
        </div>
      </div>
    </div>
  );
}
