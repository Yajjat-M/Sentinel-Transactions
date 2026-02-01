import { pgTable, text, serial, integer, boolean, timestamp, numeric, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Note: We are using in-memory storage, but defining Drizzle schemas 
// helps with type inference and Zod validation.

export const transactions = pgTable("transactions", {
  id: text("id").primaryKey(), // transaction_id from CSV
  timestamp: text("timestamp").notNull(),
  merchant: text("merchant").notNull(),
  amount: doublePrecision("amount").notNull(),
  bank: text("bank").notNull(),
  paymentMethod: text("payment_method").notNull(),
  riskScore: integer("risk_score").notNull(),
  fraudProbability: doublePrecision("fraud_probability").notNull(),
  status: text("status").notNull(), // 'Processed' | 'Failed' | 'Blocked' | 'Under Investigation'
  retryCount: integer("retry_count").notNull(),
  latencyMs: integer("latency_ms").notNull(),
  errorCode: text("error_code"),
  fraudReason: text("fraud_reason"),
});

export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  severity: text("severity").notNull(), // 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
  message: text("message").notNull(),
  timestamp: text("timestamp").notNull(),
  isRead: boolean("is_read").default(false),
});

export const investigations = pgTable("investigations", {
  id: serial("id").primaryKey(),
  transactionId: text("transaction_id").notNull(),
  reason: text("reason").notNull(),
  startTime: text("start_time").notNull(),
  status: text("status").notNull(), // 'OPEN', 'RESOLVED', 'BLOCKED'
  outcome: text("outcome"),
});

export const agentLogs = pgTable("agent_logs", {
  id: serial("id").primaryKey(),
  timestamp: text("timestamp").notNull(),
  phase: text("phase").notNull(), // 'OBSERVE', 'REASON', 'DECIDE', 'ACT', 'LEARN'
  message: text("message").notNull(),
  details: text("details"),
});

// Zod Schemas
export const insertTransactionSchema = createInsertSchema(transactions);
export const insertAlertSchema = createInsertSchema(alerts).omit({ id: true });
export const insertInvestigationSchema = createInsertSchema(investigations).omit({ id: true });
export const insertAgentLogSchema = createInsertSchema(agentLogs).omit({ id: true });

// Types
export type Transaction = typeof transactions.$inferSelect;
export type Alert = typeof alerts.$inferSelect;
export type Investigation = typeof investigations.$inferSelect;
export type AgentLog = typeof agentLogs.$inferSelect;

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type InsertInvestigation = z.infer<typeof insertInvestigationSchema>;

// API Request/Response Types
export interface StatsResponse {
  totalTransactions: number;
  failureRate: number;
  avgRiskScore: number;
  activeInvestigations: number;
  blockedCount: number;
  fraudSpikeDetected: boolean;
}

export interface AgentStatusResponse {
  currentPhase: string;
  lastRun: string;
  isRunning: boolean;
  logs: AgentLog[];
}
