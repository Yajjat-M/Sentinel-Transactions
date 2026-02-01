import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  ArrowRightLeft, 
  Bell, 
  Search, 
  ShieldBan, 
  Bot,
  PieChart
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Live Monitoring", icon: LayoutDashboard, href: "/" },
  { label: "Transactions", icon: ArrowRightLeft, href: "/transactions" },
  { label: "Alerts", icon: Bell, href: "/alerts" },
  { label: "Investigations", icon: Search, href: "/investigations" },
  { label: "Blocked", icon: ShieldBan, href: "/blocked" },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-card border-r border-border/50 flex flex-col z-50">
      <div className="h-16 flex items-center px-6 border-b border-border/50">
        <div className="flex items-center gap-2 text-primary">
          <Bot className="h-6 w-6" />
          <span className="text-lg font-bold font-display tracking-tight text-foreground">
            Sentinel<span className="text-primary">AI</span>
          </span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href} className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group hover-elevate active-elevate-2",
              isActive 
                ? "bg-zinc-800 text-white font-medium shadow-[0_0_20px_rgba(255,255,255,0.05)] border border-white/10" 
                : "text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
            )}>
              <item.icon className={cn(
                "h-5 w-5 transition-colors",
                isActive ? "text-white" : "text-zinc-500 group-hover:text-zinc-300"
              )} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border/50 bg-secondary/10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-primary/25">
            JS
          </div>
          <div>
            <p className="text-sm font-semibold">John Smith</p>
            <p className="text-xs text-muted-foreground">Lead Analyst</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
