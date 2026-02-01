import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useTransactions } from "@/hooks/use-dashboard";
import { StatusBadge } from "@/components/StatusBadge";
import { CreateInvestigationDialog } from "@/components/CreateInvestigationDialog";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Search, Filter, AlertOctagon } from "lucide-react";
import { type Transaction } from "@shared/schema";

export default function TransactionsPage() {
  const [filterRisk, setFilterRisk] = useState("");
  const { data: transactions, isLoading } = useTransactions({ limit: 100 });

  const filteredTransactions = transactions?.filter((t: Transaction) => {
    if (!filterRisk) return true;
    return t.riskScore >= parseInt(filterRisk);
  });

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">Transactions</h1>
            <p className="text-muted-foreground mt-1">Review and manage transaction history</p>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search transactions..." 
                className="pl-9 bg-card border-border w-[250px]"
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          </div>
        </div>

        <div className="glass-card rounded-2xl overflow-hidden">
          {isLoading ? (
             <div className="p-12 text-center text-muted-foreground">Loading transactions...</div>
          ) : (
            <Table>
              <TableHeader className="bg-secondary/30">
                <TableRow className="hover:bg-transparent border-border">
                  <TableHead className="text-muted-foreground">ID</TableHead>
                  <TableHead className="text-muted-foreground">Timestamp</TableHead>
                  <TableHead className="text-muted-foreground">Merchant</TableHead>
                  <TableHead className="text-muted-foreground">Amount</TableHead>
                  <TableHead className="text-muted-foreground">Risk Score</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground">Error Code</TableHead>
                  <TableHead className="text-right text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions?.map((tx: Transaction) => (
                  <TableRow key={tx.id} className="border-border hover:bg-white/5">
                    <TableCell className="font-mono text-xs text-muted-foreground">{tx.id.substring(0, 8)}...</TableCell>
                    <TableCell className="text-sm">{new Date(tx.timestamp).toLocaleString()}</TableCell>
                    <TableCell className="font-medium">{tx.merchant}</TableCell>
                    <TableCell className="font-mono">${tx.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${
                              tx.riskScore > 80 ? "bg-red-500" : 
                              tx.riskScore > 50 ? "bg-amber-500" : "bg-green-500"
                            }`} 
                            style={{ width: `${tx.riskScore}%` }} 
                          />
                        </div>
                        <span className="text-xs font-mono">{tx.riskScore}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={tx.status} />
                    </TableCell>
                    <TableCell className="text-xs font-mono text-red-400">
                      {tx.errorCode || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {tx.riskScore > 50 && (
                        <CreateInvestigationDialog 
                          transactionId={tx.id} 
                          trigger={
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                              <AlertOctagon className="h-4 w-4 mr-1" />
                              Investigate
                            </Button>
                          }
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </main>
    </div>
  );
}
