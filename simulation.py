import time
import csv
import os
import random
from datetime import datetime, timedelta

# Configuration
AGENT_CONFIG = {
    "highRiskThreshold": 20,
    "fraudProbThreshold": 0.8,
    "retryCountThreshold": 3,
    "latencyThreshold": 500,
    "loopIntervalSec": 2,
}

class Transaction:
    def __init__(self, data):
        self.id = data.get("id")
        self.timestamp = data.get("timestamp")
        self.merchant = data.get("merchant")
        self.amount = float(data.get("amount", 0))
        self.bank = data.get("bank")
        self.payment_method = data.get("payment_method")
        self.risk_score = int(float(data.get("risk_score", 0)))
        self.fraud_probability = float(data.get("fraud_probability", 0))
        self.status = data.get("status")
        self.retry_count = int(float(data.get("retry_count", 0)))
        self.error_code = data.get("error_code")
        self.fraud_reason = data.get("fraud_reason")

class SentinelAgent:
    def __init__(self):
        self.transactions = []
        self.investigations = []
        self.is_running = False
        self.fraud_threshold = AGENT_CONFIG["fraudProbThreshold"]

    def load_data(self):
        paths = [
            os.path.join("attached_assets", "fraud_data.csv"),
            os.path.join("..", "datasettt", "fraud_data_20251225_004640.csv")
        ]
        
        print("\n[SYSTEM] Loading datasets...")
        count = 0
        for path in paths:
            if os.path.exists(path):
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        reader = csv.reader(f)
                        header = next(reader, None) # Skip header
                        if not header: continue
                        
                        for row in reader:
                            if len(row) < 14: continue
                            
                            # Parse based on known CSV structure
                            # 1: razorpay_payment_id -> id
                            # 2: timestamp
                            # 4: amount
                            # 7: upi_app -> merchant
                            # 8: bank
                            # 9: status
                            # 10: error_code
                            # 13: fraud_score
                            # 15: fraud_reasons
                            # 20: attempt_count
                            
                            try:
                                status = row[9]
                                if status.lower() == 'success': status = 'Processed'
                                elif status.lower() == 'failed': status = 'Failed'
                                
                                tx_data = {
                                    "id": row[1],
                                    "timestamp": row[2],
                                    "amount": row[4],
                                    "merchant": row[7],
                                    "bank": row[8],
                                    "status": status,
                                    "error_code": row[10] if row[10] else None,
                                    "risk_score": row[13] if row[13] else 0,
                                    "fraud_probability": (float(row[13] or 0) / 100),
                                    "fraud_reason": row[15] if row[15] else None,
                                    "retry_count": row[20] if row[20] else 0
                                }
                                self.transactions.append(Transaction(tx_data))
                                count += 1
                            except Exception as e:
                                continue
                    print(f"[SYSTEM] Loaded {count} transactions from {path}")
                except Exception as e:
                    print(f"[ERROR] Failed to load {path}: {e}")
            else:
                print(f"[WARNING] Dataset not found: {path}")
        
        # Generate some synthetic live data for the loop
        self.generate_synthetic_stream()

    def generate_synthetic_stream(self):
        # Add some "future" transactions to simulate a live stream
        merchants = ["Amazon", "Walmart", "Apple", "Netflix"]
        banks = ["HDFC", "SBI", "Axis"]
        error_codes = ["UPI_AUTHENTICATION_FAILED", "INSUFFICIENT_FUNDS", "BANK_SERVER_ERROR"]
        
        for i in range(50):
            is_spam = random.random() < 0.2
            is_fraud = random.random() < 0.1
            
            tx = Transaction({
                "id": f"LIVE_TX_{int(time.time())}_{i}",
                "timestamp": datetime.now().isoformat(),
                "merchant": random.choice(merchants),
                "amount": random.uniform(10, 5000),
                "bank": random.choice(banks),
                "status": "Failed" if is_spam else "Processed",
                "error_code": random.choice(error_codes) if is_spam else None,
                "risk_score": random.randint(80, 100) if is_fraud else random.randint(0, 20),
                "fraud_probability": 0.9 if is_fraud else 0.1,
                "retry_count": random.randint(4, 10) if is_spam else 0
            })
            self.transactions.append(tx)

    def start(self):
        self.is_running = True
        self.load_data()
        print("\n" + "="*50)
        print("SENTINEL AI AGENT - AUTONOMOUS MODE STARTING")
        print("="*50 + "\n")
        
        try:
            while self.is_running:
                self.run_loop()
                time.sleep(AGENT_CONFIG["loopIntervalSec"])
        except KeyboardInterrupt:
            print("\n[SYSTEM] Agent stopped by user.")

    def run_loop(self):
        # 1. OBSERVE
        print(f"[{datetime.now().strftime('%H:%M:%S')}] [OBSERVE] Monitoring transaction stream...")
        # Simulate getting recent transactions (random sample for demo)
        batch_size = 10
        current_batch = random.sample(self.transactions, batch_size)
        
        # 2. REASON
        print(f"[{datetime.now().strftime('%H:%M:%S')}] [REASON]  Analyzing {len(current_batch)} transactions...")
        
        high_risk = [t for t in current_batch if t.risk_score > AGENT_CONFIG["highRiskThreshold"] and t.status == 'Processed']
        fraud_spikes = [t for t in current_batch if t.fraud_probability > self.fraud_threshold]
        
        # Banking Spam Logic
        banking_spam = [t for t in current_batch if 
                        t.status == 'Failed' and 
                        t.error_code and 
                        (t.retry_count > AGENT_CONFIG["retryCountThreshold"] or "AUTHENTICATION_FAILED" in t.error_code)]

        # 3. DECIDE
        decisions = []
        if high_risk:
            print(f"    -> Detected {len(high_risk)} High Risk transactions")
            for t in high_risk:
                decisions.append(("INVESTIGATE", t, f"High Risk Score: {t.risk_score}"))
                
        if fraud_spikes:
            print(f"    -> Detected {len(fraud_spikes)} Fraud Spikes")
            for t in fraud_spikes:
                decisions.append(("BLOCK", t, f"Fraud Probability > {self.fraud_threshold}"))
                
        if banking_spam:
            print(f"    -> Detected {len(banking_spam)} Banking Spam/Error patterns")
            for t in banking_spam:
                decisions.append(("INVESTIGATE", t, f"Banking Spam: {t.error_code}"))

        # 4. ACT
        if decisions:
            print(f"[{datetime.now().strftime('%H:%M:%S')}] [ACT]     Executing {len(decisions)} actions...")
            for action, tx, reason in decisions:
                if action == "BLOCK":
                    print(f"    >>> BLOCKED Transaction {tx.id} ({reason})")
                    self.investigations.append({"status": "BLOCKED", "reason": reason})
                elif action == "INVESTIGATE":
                    print(f"    >>> OPENED CASE for {tx.id} ({reason})")
                    # Simulate outcome for learning
                    outcome = "RESOLVED" if random.random() > 0.3 else "BLOCKED"
                    self.investigations.append({"status": outcome, "reason": reason})
        else:
            print(f"[{datetime.now().strftime('%H:%M:%S')}] [ACT]     No immediate actions required.")

        # 5. LEARN
        print(f"[{datetime.now().strftime('%H:%M:%S')}] [LEARN]   Updating thresholds based on recent outcomes...")
        self.learn_from_history()
        print("-" * 50)

    def learn_from_history(self):
        # Feedback Loop
        recent = self.investigations[-20:]
        if not recent: return
        
        false_positives = len([i for i in recent if i["status"] == "RESOLVED"])
        true_positives = len([i for i in recent if i["status"] == "BLOCKED"])
        
        old_threshold = self.fraud_threshold
        if false_positives > true_positives + 2:
            self.fraud_threshold = min(0.95, self.fraud_threshold + 0.01)
            print(f"    [FEEDBACK] Too many false alarms. Relaxing threshold: {old_threshold:.2f} -> {self.fraud_threshold:.2f}")
        elif true_positives > false_positives + 2:
            self.fraud_threshold = max(0.60, self.fraud_threshold - 0.01)
            print(f"    [FEEDBACK] Threat level high. Tightening threshold: {old_threshold:.2f} -> {self.fraud_threshold:.2f}")
        else:
            print(f"    [FEEDBACK] Threshold stable at {self.fraud_threshold:.2f}")

if __name__ == "__main__":
    agent = SentinelAgent()
    agent.start()
