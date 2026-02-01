import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { agent } from "./agent";
import path from "path";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Initialize Agent and Load Data
  const csvPath = path.join(process.cwd(), "attached_assets", "fraud_data.csv");
  await storage.importFromCSV(csvPath);
  agent.start();

  // Transactions
  app.get('/api/transactions', async (req, res) => {
    const status = req.query.status as string | undefined;
    const minRisk = req.query.minRisk ? parseInt(req.query.minRisk as string) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;

    const transactions = await storage.getTransactions({ status, minRisk, limit });
    res.json(transactions);
  });

  app.get('/api/transactions/:id', async (req, res) => {
    const t = await storage.getTransaction(req.params.id);
    if (!t) return res.status(404).json({ message: "Transaction not found" });
    res.json(t);
  });

  // Stats for Dashboard
  app.get('/api/stats', async (req, res) => {
    const transactions = await storage.getTransactions();
    const totalTransactions = transactions.length;
    const failed = transactions.filter(t => t.status === 'Failed').length;
    const blocked = transactions.filter(t => t.status === 'Blocked').length;
    const activeInvestigations = (await storage.getInvestigations()).filter(i => i.status === 'OPEN').length;

    const avgRiskScore = transactions.length > 0
      ? transactions.reduce((sum, t) => sum + t.riskScore, 0) / transactions.length
      : 0;

    // Fix: correct percentage calculation
    const failureRate = totalTransactions > 0 ? (failed / totalTransactions) * 100 : 0;

    // Simple spike detection logic
    const highFraudCount = transactions.filter(t => t.fraudProbability > 0.8).length;
    const fraudSpikeDetected = highFraudCount > 5;

    res.json({
      totalTransactions,
      failureRate: parseFloat(failureRate.toFixed(2)),
      avgRiskScore: parseFloat(avgRiskScore.toFixed(2)),
      activeInvestigations,
      blockedCount: blocked,
      fraudSpikeDetected
    });
  });

  // Alerts
  app.get('/api/alerts', async (req, res) => {
    const alerts = await storage.getAlerts();
    res.json(alerts);
  });

  // Investigations
  app.get('/api/investigations', async (req, res) => {
    const investigations = await storage.getInvestigations();
    res.json(investigations);
  });

  app.post('/api/investigations', async (req, res) => {
    const { transactionId, reason } = req.body;
    if (!transactionId || !reason) return res.status(400).json({ message: "Missing fields" });

    const existingInv = await storage.getInvestigationByTransactionId(transactionId);
    if (existingInv) return res.status(400).json({ message: "Investigation already exists" });

    const inv = await storage.createInvestigation({
      transactionId,
      reason,
      startTime: new Date().toISOString(),
      status: 'OPEN',
      outcome: null
    });

    await storage.updateTransactionStatus(transactionId, 'Under Investigation');

    // Log explicit user action to agent log
    await storage.createAgentLog({
      timestamp: new Date().toLocaleTimeString(),
      phase: 'USER_ACTION',
      message: `User manually started investigation for ${transactionId}`,
      details: null
    });

    res.status(201).json(inv);
  });

  app.patch('/api/investigations/:id', async (req, res) => {
    const { status, outcome } = req.body;
    const id = parseInt(req.params.id);

    const updated = await storage.updateInvestigation(id, status, outcome);
    if (!updated) return res.status(404).json({ message: "Investigation not found" });

    if (status === 'RESOLVED') {
      await storage.updateTransactionStatus(updated.transactionId, 'Processed');
    } else if (status === 'BLOCKED') {
      await storage.updateTransactionStatus(updated.transactionId, 'Blocked');
    }

    res.json(updated);
  });

  // Blocked
  app.get('/api/blocked', async (req, res) => {
    const transactions = await storage.getTransactions({ status: 'Blocked' });
    res.json(transactions);
  });

  // Agent Status
  app.get('/api/agent/status', async (req, res) => {
    const status = agent.getStatus();
    const logs = await storage.getAgentLogs();
    res.json({ ...status, logs });
  });

  app.post('/api/agent/start', (req, res) => {
    agent.start();
    res.json({ message: "Agent started" });
  });

  app.post('/api/agent/stop', (req, res) => {
    agent.stop();
    res.json({ message: "Agent stopped" });
  });

  app.post('/api/reset', async (req, res) => {
    agent.stop();
    await storage.reset();
    const csvPath = path.join(process.cwd(), "attached_assets", "fraud_data.csv");
    await storage.importFromCSV(csvPath);
    
    const newCsvPath = path.join(process.cwd(), "..", "datasettt", "fraud_data_20251225_004640.csv");
    if (fs.existsSync(newCsvPath)) {
      await storage.importFromCSV(newCsvPath);
    }
    
    agent.start();
    res.json({ message: "Database reset successfully" });
  });

  app.post('/api/simulate', async (req, res) => {
    const { scenario } = req.body;
    if (scenario === 'fraud_attack') {
      const merchants = ["Amazon", "Walmart", "Apple"];
      for (let i = 0; i < 10; i++) {
        const id = `F${Date.now()}${i}`;
        await storage.createTransaction({
          id,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
          merchant: merchants[i % 3],
          amount: 999.99,
          bank: "Unknown",
          paymentMethod: "Card",
          riskScore: 90,
          fraudProbability: 0.99,
          status: "Processed",
          retryCount: 0,
          latencyMs: 100,
        });
      }
    } else if (scenario === 'bank_outage') {
      for (let i = 0; i < 10; i++) {
        const id = `B${Date.now()}${i}`;
        await storage.createTransaction({
          id,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
          merchant: "Multiple",
          amount: 50.00,
          bank: "HDFC",
          paymentMethod: "UPI",
          riskScore: 10,
          fraudProbability: 0.1,
          status: "Failed",
          retryCount: 3,
          latencyMs: 1000,
        });
      }
    }
    res.json({ message: `Simulation ${scenario} triggered` });
  });

  return httpServer;
}
