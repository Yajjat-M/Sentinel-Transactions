import { Sidebar } from "@/components/Sidebar";
import { useBlockedTransactions } from "@/hooks/use-dashboard";
import { StatusBadge } from "@/components/StatusBadge";
import { ShieldBan } from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { type Transaction } from "@shared/schema";

export default function BlockedPage() {
  const { data: transactions, isLoading } = useBlockedTransactions();

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        <div className="mb-8 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20">
            <ShieldBan className="h-8 w-8 text-destructive" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold">Blocked Transactions</h1>
            <p className="text-muted-foreground mt-1">History of transactions blocked by AI or analysts</p>
          </div>
        </div>

        <div className="glass-card rounded-2xl overflow-hidden border-destructive/20">
          {isLoading ? (
             <div className="p-12 text-center text-muted-foreground">Loading blocked items...</div>
          ) : (
            <Table>
              <TableHeader className="bg-destructive/5">
                <TableRow className="hover:bg-transparent border-border">
                  <TableHead className="text-muted-foreground">ID</TableHead>
                  <TableHead className="text-muted-foreground">Date</TableHead>
                  <TableHead className="text-muted-foreground">Merchant</TableHead>
                  <TableHead className="text-muted-foreground">Amount</TableHead>
                  <TableHead className="text-muted-foreground">Risk Score</TableHead>
                  <TableHead className="text-muted-foreground">Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions?.map((tx: Transaction) => (
                  <TableRow key={tx.id} className="border-border hover:bg-white/5">
                    <TableCell className="font-mono text-xs text-muted-foreground">{tx.id}</TableCell>
                    <TableCell className="text-sm">{new Date(tx.timestamp).toLocaleString()}</TableCell>
                    <TableCell className="font-medium">{tx.merchant}</TableCell>
                    <TableCell className="font-mono font-bold">${tx.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <span className="text-red-400 font-bold">{tx.riskScore}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-destructive italic">Fraud Probability: {(tx.fraudProbability * 100).toFixed(1)}%</span>
                    </TableCell>
                  </TableRow>
                ))}
                {transactions?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-32 text-muted-foreground">
                      No blocked transactions found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </main>
    </div>
  );
}
