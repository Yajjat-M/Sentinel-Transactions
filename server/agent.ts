import { storage } from "./storage";
import { type Transaction } from "@shared/schema";

// Agent Configuration
const AGENT_CONFIG = {
  highRiskThreshold: 20,
  fraudProbThreshold: 0.8,
  retryCountThreshold: 3,
  latencyThreshold: 500,
  loopIntervalMs: 3000, // 3 seconds per loop
};

export class SentinelAgent {
  private isRunning: boolean = false;
  private currentPhase: string = 'IDLE';
  private lastRun: string = new Date().toISOString();
  private intervalId: NodeJS.Timeout | null = null;

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log("Sentinel AI Agent started.");
    
    // Initial Load
    this.runLoop();

    this.intervalId = setInterval(() => {
      this.runLoop();
    }, AGENT_CONFIG.loopIntervalMs);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      currentPhase: this.currentPhase,
      lastRun: this.lastRun,
    };
  }

  private async runLoop() {
    try {
      this.lastRun = new Date().toISOString();
      
      // === OBSERVE ===
      await this.setPhase('OBSERVE', 'Monitoring transactions for anomalies...');
      const transactions = await storage.getTransactions({ limit: 100 });
      
      // === REASON ===
      await this.setPhase('REASON', 'Analyzing patterns and risk scores...');
      const highRiskTx = transactions.filter(t => t.riskScore > AGENT_CONFIG.highRiskThreshold && t.status === 'Processed');
      const fraudSpikes = transactions.filter(t => t.fraudProbability > AGENT_CONFIG.fraudProbThreshold && t.status !== 'Blocked');
      
      const hypotheses = [];
      if (highRiskTx.length > 0) {
        hypotheses.push({ type: 'HIGH_RISK', count: highRiskTx.length, transactions: highRiskTx });
      }
      if (fraudSpikes.length > 0) {
        hypotheses.push({ type: 'FRAUD_SPIKE', count: fraudSpikes.length, transactions: fraudSpikes });
      }

      // === DECIDE ===
      await this.setPhase('DECIDE', `Evaluating ${hypotheses.length} hypotheses...`);
      const decisions = [];
      
      for (const h of hypotheses) {
        if (h.type === 'HIGH_RISK') {
          for (const tx of h.transactions) {
            // Check if already investigated or blocked to avoid duplicate actions
            const existingInv = await storage.getInvestigationByTransactionId(tx.id);
            if (!existingInv && tx.status !== 'Blocked' && tx.status !== 'Under Investigation') {
              decisions.push({ type: 'INVESTIGATE', tx, reason: `High risk score: ${tx.riskScore}` });
            }
          }
        }
        if (h.type === 'FRAUD_SPIKE') {
          for (const tx of h.transactions) {
            if (tx.status !== 'Blocked') {
              decisions.push({ type: 'BLOCK', tx, reason: `Extreme fraud probability: ${tx.fraudProbability}` });
            }
          }
        }
      }

      // === ACT ===
      if (decisions.length > 0) {
        await this.setPhase('ACT', `Executing ${decisions.length} actions...`);
        
        for (const d of decisions) {
          if (d.type === 'INVESTIGATE') {
            await storage.createInvestigation({
              transactionId: d.tx.id,
              reason: d.reason,
              startTime: new Date().toISOString(),
              status: 'OPEN',
              outcome: null
            });
            await storage.updateTransactionStatus(d.tx.id, 'Under Investigation');
            await storage.createAlert({
              severity: 'MEDIUM',
              message: `Investigation started for ${d.tx.id}: ${d.reason}`,
              timestamp: new Date().toISOString(),
              isRead: false
            });
            await this.log('ACT', `Started investigation for ${d.tx.id}`);
          } else if (d.type === 'BLOCK') {
            await storage.updateTransactionStatus(d.tx.id, 'Blocked');
            await storage.createAlert({
              severity: 'CRITICAL',
              message: `Transaction ${d.tx.id} BLOCKED. ${d.reason}`,
              timestamp: new Date().toISOString(),
              isRead: false
            });
            await this.log('ACT', `BLOCKED transaction ${d.tx.id}`);
          }
        }
      } else {
        await this.setPhase('ACT', 'No actions required.');
      }

      // === LEARN ===
      await this.setPhase('LEARN', 'Updating risk thresholds based on recent outcomes...');
      
      // Feedback Loop Implementation
      const investigations = await storage.getInvestigations();
      const recentInvestigations = investigations.slice(0, 20); // Check last 20
      
      let falsePositives = 0;
      let truePositives = 0;
      
      for (const inv of recentInvestigations) {
        if (inv.status === 'RESOLVED') falsePositives++; // Was investigated but cleared
        if (inv.status === 'BLOCKED') truePositives++;   // Was investigated and confirmed fraud
      }
      
      if (falsePositives > truePositives + 2) {
        // Too many false alarms, relax threshold slightly
        AGENT_CONFIG.fraudProbThreshold = Math.min(0.95, AGENT_CONFIG.fraudProbThreshold + 0.01);
        await this.log('LEARN', `Relaxing fraud threshold to ${AGENT_CONFIG.fraudProbThreshold.toFixed(2)} due to false positives.`);
      } else if (truePositives > falsePositives + 2) {
        // High success rate, can afford to be stricter (or keep as is)
        AGENT_CONFIG.fraudProbThreshold = Math.max(0.6, AGENT_CONFIG.fraudProbThreshold - 0.01);
        await this.log('LEARN', `Tightening fraud threshold to ${AGENT_CONFIG.fraudProbThreshold.toFixed(2)} due to confirmed threats.`);
      } else {
         await this.log('LEARN', `Threshold stable at ${AGENT_CONFIG.fraudProbThreshold.toFixed(2)}.`);
      }
      
    } catch (error) {
      console.error("Agent Loop Error:", error);
      await this.log('ERROR', 'Agent loop failed: ' + String(error));
    }
  }

  private async setPhase(phase: string, message: string) {
    this.currentPhase = phase;
    await this.log(phase, message);
    // Add small delay to make the phase visible in UI for demo purposes
    await new Promise(resolve => setTimeout(resolve, 500)); 
  }

  private async log(phase: string, message: string) {
    await storage.createAgentLog({
      timestamp: new Date().toLocaleTimeString(),
      phase,
      message,
      details: null
    });
  }
}

export const agent = new SentinelAgent();
