import { 
  type Transaction, type Alert, type Investigation, type AgentLog,
  type InsertTransaction, type InsertAlert, type InsertInvestigation, type InsertAgentLog
} from "@shared/schema";
import fs from 'fs';
import path from 'path';

export interface IStorage {
  // Transactions
  getTransactions(filter?: { status?: string, minRisk?: number, limit?: number }): Promise<Transaction[]>;
  getTransaction(id: string): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransactionStatus(id: string, status: string): Promise<Transaction | undefined>;

  // Alerts
  getAlerts(): Promise<Alert[]>;
  createAlert(alert: InsertAlert): Promise<Alert>;

  // Investigations
  getInvestigations(): Promise<Investigation[]>;
  getInvestigationByTransactionId(transactionId: string): Promise<Investigation | undefined>;
  createInvestigation(investigation: InsertInvestigation): Promise<Investigation>;
  updateInvestigation(id: number, status: string, outcome?: string): Promise<Investigation | undefined>;

  // Agent Logs
  getAgentLogs(): Promise<AgentLog[]>;
  createAgentLog(log: InsertAgentLog): Promise<AgentLog>;
  
  // Seed
  importFromCSV(filePath: string): Promise<void>;
  reset(): Promise<void>;
}

export class MemStorage implements IStorage {
  private transactions: Map<string, Transaction>;
  private alerts: Alert[];
  private investigations: Investigation[];
  private agentLogs: AgentLog[];
  private alertIdCounter = 1;
  private investigationIdCounter = 1;
  private logIdCounter = 1;

  constructor() {
    this.transactions = new Map();
    this.alerts = [];
    this.investigations = [];
    this.agentLogs = [];
  }

  async getTransactions(filter?: { status?: string, minRisk?: number, limit?: number }): Promise<Transaction[]> {
    let results = Array.from(this.transactions.values());
    
    // Sort by timestamp descending (newest first)
    results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (filter) {
      if (filter.status) {
        results = results.filter(t => t.status === filter.status);
      }
      if (filter.minRisk) {
        results = results.filter(t => t.riskScore >= filter.minRisk);
      }
      if (filter.limit) {
        results = results.slice(0, filter.limit);
      }
    }
    return results;
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const transaction: Transaction = { ...insertTransaction };
    this.transactions.set(transaction.id, transaction);
    return transaction;
  }

  async updateTransactionStatus(id: string, status: string): Promise<Transaction | undefined> {
    const transaction = this.transactions.get(id);
    if (!transaction) return undefined;
    
    const updated = { ...transaction, status };
    this.transactions.set(id, updated);
    return updated;
  }

  async getAlerts(): Promise<Alert[]> {
    return [...this.alerts].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async createAlert(insertAlert: InsertAlert): Promise<Alert> {
    const alert: Alert = { ...insertAlert, id: this.alertIdCounter++, isRead: false };
    this.alerts.push(alert);
    return alert;
  }

  async getInvestigations(): Promise<Investigation[]> {
    return [...this.investigations].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }

  async getInvestigationByTransactionId(transactionId: string): Promise<Investigation | undefined> {
    return this.investigations.find(inv => inv.transactionId === transactionId);
  }

  async createInvestigation(insertInvestigation: InsertInvestigation): Promise<Investigation> {
    const investigation: Investigation = { 
      ...insertInvestigation, 
      id: this.investigationIdCounter++, 
      status: 'OPEN', 
      outcome: null 
    };
    this.investigations.push(investigation);
    return investigation;
  }

  async updateInvestigation(id: number, status: string, outcome?: string): Promise<Investigation | undefined> {
    const index = this.investigations.findIndex(i => i.id === id);
    if (index === -1) return undefined;

    const updated = { ...this.investigations[index], status, outcome: outcome || this.investigations[index].outcome };
    this.investigations[index] = updated;
    return updated;
  }

  async getAgentLogs(): Promise<AgentLog[]> {
    return [...this.agentLogs].sort((a, b) => b.id - a.id).slice(0, 50); // Return last 50 logs
  }

  async createAgentLog(insertLog: InsertAgentLog): Promise<AgentLog> {
    const log: AgentLog = { ...insertLog, id: this.logIdCounter++ };
    this.agentLogs.push(log);
    // Keep logs manageable
    if (this.agentLogs.length > 200) {
      this.agentLogs.shift();
    }
    return log;
  }

  async reset(): Promise<void> {
    this.transactions.clear();
    this.alerts = [];
    this.investigations = [];
    this.agentLogs = [];
    this.alertIdCounter = 1;
    this.investigationIdCounter = 1;
    this.logIdCounter = 1;
  }

  async importFromCSV(filePath: string): Promise<void> {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.trim().split('\n');

      // Helper to parse CSV lines with quoted fields
      const parseCSVLine = (line: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuote = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            if (i + 1 < line.length && line[i + 1] === '"') {
               // Handle escaped quotes if any (though usually "" in CSV)
               current += '"';
               i++;
            } else {
               inQuote = !inQuote;
            }
          } else if (char === ',' && !inQuote) {
            result.push(current);
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current);
        return result.map(s => s.trim());
      };
      
      // Skip header (i=1)
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = parseCSVLine(line);
        // Schema mapping:
        // 0: id
        // 1: razorpay_payment_id -> id
        // 2: timestamp -> timestamp
        // 4: amount -> amount
        // 6: payment_method -> paymentMethod
        // 7: upi_app -> merchant
        // 8: bank -> bank
        // 9: status -> status
        // 13: fraud_score -> riskScore (approx 0-100)
        // 20: attempt_count -> retryCount

        if (values.length < 14) continue; // Basic validation check

        const rawStatus = values[9] || "";
        // Normalize status to match generic "Processed" / "Failed" if possible, 
        // or just keep as is but capitalized often looks better or is expected by frontend.
        // The new CSV has "success", "failed".
        const status = rawStatus.toLowerCase() === 'success' ? 'Processed' : 
                       rawStatus.toLowerCase() === 'failed' ? 'Failed' : rawStatus;

        const transaction: Transaction = {
          id: values[1], // razorpay_payment_id
          timestamp: values[2].replace('T', ' ').substring(0, 16),
          merchant: values[7] || "Unknown",
          amount: parseFloat(values[4]) || 0,
          bank: values[8] || "Unknown",
          paymentMethod: values[6] || "Unknown",
          riskScore: parseInt(values[13]) || 0,
          fraudProbability: (parseFloat(values[13]) || 0) / 100, // Normalized to 0-1
          status: status,
          retryCount: parseInt(values[20]) || 0,
          latencyMs: Math.floor(Math.random() * 400 + 100), // Synthetic
          errorCode: values[10] || null,
          fraudReason: values[15] || null,
        };

        this.transactions.set(transaction.id, transaction);
      }

      // Generate more data to "increase the database"
      const lastIdNum = 20;
      const merchants = ["Amazon", "Walmart", "Apple", "Starbucks", "Netflix", "Flipkart", "Swiggy", "Uber", "Target", "Best Buy"];
      const banks = ["HDFC", "ICICI", "SBI", "Axis", "Citi"];
      const methods = ["Card", "UPI", "NetBanking"];

      // Increased to 1000 as requested
      for (let i = 1; i <= 1000; i++) {
        const idNum = lastIdNum + i;
        const id = `T${Date.now().toString().slice(-6)}${idNum.toString().padStart(4, '0')}`;
        const merchant = merchants[Math.floor(Math.random() * merchants.length)];
        const bank = banks[Math.floor(Math.random() * banks.length)];
        const method = methods[Math.floor(Math.random() * methods.length)];
        const amount = parseFloat((Math.random() * 500 + 10).toFixed(2));
        const riskScore = Math.floor(Math.random() * 40);
        const fraudProb = parseFloat((riskScore / 100).toFixed(2));
        const status = Math.random() > 0.8 ? "Failed" : "Processed";
        const retryCount = status === "Failed" ? Math.floor(Math.random() * 5) : 0;
        const latency = Math.floor(Math.random() * 400 + 100);
        
        const transaction: Transaction = {
          id,
          timestamp: new Date(Date.now() - i * 600000).toISOString().replace('T', ' ').substring(0, 16),
          merchant,
          amount,
          bank,
          paymentMethod: method,
          riskScore,
          fraudProbability: fraudProb,
          status,
          retryCount,
          latencyMs: latency,
        };
        this.transactions.set(id, transaction);
      }

      console.log(`Imported and generated ${this.transactions.size} transactions.`);
    } catch (err) {
      console.error("Failed to import CSV:", err);
    }
  }
}

export const storage = new MemStorage();
