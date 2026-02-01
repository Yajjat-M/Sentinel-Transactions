import { Sidebar } from "@/components/Sidebar";
import { useInvestigations, useUpdateInvestigation } from "@/hooks/use-dashboard";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { CheckCircle, Ban, Clock } from "lucide-react";
import { type Investigation } from "@shared/schema";
import { format } from "date-fns";

export default function InvestigationsPage() {
  const { data: investigations, isLoading } = useInvestigations();
  const updateMutation = useUpdateInvestigation();

  const handleResolve = (id: number) => {
    updateMutation.mutate({ id, status: "RESOLVED", outcome: "Cleared after review" });
  };

  const handleBlock = (id: number) => {
    updateMutation.mutate({ id, status: "BLOCKED", outcome: "Confirmed fraudulent activity" });
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold">Investigations</h1>
          <p className="text-muted-foreground mt-1">Manage active cases and review outcomes</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {isLoading ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">Loading investigations...</div>
          ) : (
            investigations?.map((inv: Investigation) => (
              <Card key={inv.id} className="glass-card border-border/50 bg-card/40">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="font-display text-xl">Case #{inv.id}</CardTitle>
                      <CardDescription className="font-mono mt-1">
                        Transaction: {inv.transactionId}
                      </CardDescription>
                    </div>
                    <StatusBadge status={inv.status} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Reason</span>
                    <p className="mt-1 text-sm">{inv.reason}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Opened</span>
                      <p className="mt-1 text-sm font-mono text-muted-foreground">
                        {format(new Date(inv.startTime), 'MMM dd, HH:mm')}
                      </p>
                    </div>
                    {inv.outcome && (
                      <div>
                        <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Outcome</span>
                        <p className="mt-1 text-sm">{inv.outcome}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
                
                {inv.status === "OPEN" && (
                  <CardFooter className="flex gap-3 justify-end border-t border-border/30 pt-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-green-500/20 text-green-500 hover:bg-green-500/10 hover:text-green-400"
                      onClick={() => handleResolve(inv.id)}
                      disabled={updateMutation.isPending}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Resolve (Safe)
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      className="bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20"
                      onClick={() => handleBlock(inv.id)}
                      disabled={updateMutation.isPending}
                    >
                      <Ban className="mr-2 h-4 w-4" />
                      Block (Fraud)
                    </Button>
                  </CardFooter>
                )}
              </Card>
            ))
          )}
          
          {investigations?.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center p-12 glass-card rounded-xl border-dashed">
              <Clock className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
              <h3 className="text-lg font-medium">No active investigations</h3>
              <p className="text-muted-foreground">You're all caught up!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
