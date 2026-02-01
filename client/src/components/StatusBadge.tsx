import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalizeStatus = status.toLowerCase();

  let variantClass = "bg-secondary text-secondary-foreground border-border"; // default

  if (["processed", "resolved", "low", "safe"].includes(normalizeStatus)) {
    variantClass = "bg-green-500/10 text-green-500 border-green-500/20";
  } else if (["failed", "high", "critical", "blocked"].includes(normalizeStatus)) {
    variantClass = "bg-red-500/10 text-red-500 border-red-500/20";
  } else if (["under investigation", "medium", "warning"].includes(normalizeStatus)) {
    variantClass = "bg-amber-500/10 text-amber-500 border-amber-500/20";
  } else if (normalizeStatus === "open") {
    variantClass = "bg-blue-500/10 text-blue-500 border-blue-500/20";
  }

  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
      variantClass,
      className
    )}>
      {status}
    </span>
  );
}
