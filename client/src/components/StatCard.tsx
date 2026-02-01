import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  className?: string;
  description?: string;
}

export function StatCard({ title, value, icon: Icon, trend, trendUp, className, description }: StatCardProps) {
  return (
    <div className={cn(
      "glass-card p-6 rounded-2xl relative overflow-hidden group hover:bg-card/80 transition-all duration-300 border border-white/5 hover:border-white/10 hover-elevate active-elevate-2",
      className
    )}>
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500 pointer-events-none">
        <Icon className="h-24 w-24" />
      </div>
      
      <div className="flex items-center justify-between mb-4">
        <div className="p-2.5 bg-zinc-800/50 border border-white/5 rounded-xl text-zinc-400 group-hover:text-white transition-colors">
          <Icon className="h-5 w-5" />
        </div>
        {trend && (
          <span className={cn(
            "text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full border flex items-center gap-1.5 shadow-sm",
            trendUp 
              ? "bg-green-500/5 text-green-400 border-green-500/10 shadow-green-500/5" 
              : "bg-red-500/5 text-red-400 border-red-500/10 shadow-red-500/5"
          )}>
            <div className={cn(
              "w-1 h-1 rounded-full",
              trendUp ? "bg-green-500 animate-pulse" : "bg-red-500 animate-pulse"
            )} />
            {trend}
          </span>
        )}
      </div>
      
      <div className="relative z-10">
        <h4 className="text-zinc-500 font-medium text-xs uppercase tracking-widest">{title}</h4>
        <div className="text-3xl font-display font-bold mt-1 text-white tracking-tight group-hover:translate-x-0.5 transition-transform duration-300">
          {value}
        </div>
        {description && (
          <p className="text-xs text-zinc-500 mt-2 font-medium">{description}</p>
        )}
      </div>
    </div>
  );
}
