import random
import time
import os
import csv
from datetime import datetime
from src.models import Transaction, log_event, get_config, set_config, init_db

AGENT_CONFIG = {
    "highRiskThreshold": 20,
    "retryCountThreshold": 3,
}

class SentinelAgent:
    def __init__(self):
        init_db()
        self.stats = {
            "processed": 0,
            "blocked": 0,
            "investigated": 0
        }
    
    @property
    def fraud_threshold(self):
        return float(get_config("fraud_threshold", 0.8))

    @fraud_threshold.setter
    def fraud_threshold(self, value):
        set_config("fraud_threshold", value)

    def load_historical_data(self):
        paths = [
            os.path.join("attached_assets", "fraud_data.csv"),
            os.path.join("..", "datasettt", "fraud_data_20251225_004640.csv")
        ]
        
        count = 0
        for path in paths:
            if os.path.exists(path):
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        reader = csv.reader(f)
                        header = next(reader, None)
                        if not header: continue
                        for row in reader:
                            if len(row) < 14: continue
                            try:
                                status = row[9]
                                if status.lower() == 'success': status = 'Processed'
                                elif status.lower() == 'failed': status = 'Failed'
                                
                                tx = Transaction({
                                    "id": row[1],
                                    "timestamp": row[2],
                                    "amount": row[4],
                                    "merchant": row[7],
                                    "bank": row[8],
                                    "status": status,
                                    "error_code": row[10] if row[10] else None,
                                    "risk_score": row[13] if row[13] else 0,
                                    "fraud_probability": (float(row[13] or 0) / 100),
                                    "retry_count": row[20] if row[20] else 0
                                })
                                tx.save()
                                count += 1
                            except: continue
                except: pass
        
        log_event("SYSTEM", f"Dataset loaded: {count} historical records.")

    def generate_synthetic_stream(self, n=1):
        merchants = ["Amazon", "Walmart", "Apple", "Netflix", "Uber", "Airbnb"]
        banks = ["HDFC", "SBI", "Axis", "ICICI", "Chase"]
        error_codes = ["UPI_AUTHENTICATION_FAILED", "INSUFFICIENT_FUNDS", "BANK_SERVER_ERROR", "RISK_CHECK_FAILED"]
        
        batch = []
        for i in range(n):
            is_spam = random.random() < 0.25
            is_fraud = random.random() < 0.15
            
            tx = Transaction({
                "id": f"TX_{int(time.time())}_{random.randint(1000,9999)}",
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "merchant": random.choice(merchants),
                "amount": round(random.uniform(10, 5000), 2),
                "bank": random.choice(banks),
                "status": "Failed" if is_spam else "Processed",
                "error_code": random.choice(error_codes) if is_spam else None,
                "risk_score": random.randint(80, 100) if is_fraud else random.randint(0, 30),
                "fraud_probability": round(random.uniform(0.8, 0.99) if is_fraud else random.uniform(0.01, 0.2), 2),
                "retry_count": random.randint(4, 10) if is_spam else 0
            })
            tx.save()
            batch.append(tx)
        return batch

    def run_step(self):
        # 1. OBSERVE
        current_batch = self.generate_synthetic_stream(random.randint(2, 5))
        self.stats["processed"] += len(current_batch)
        log_event("OBSERVE", f"Ingested {len(current_batch)} new transactions.")

        # 2. REASON
        high_risk = [t for t in current_batch if t.risk_score > AGENT_CONFIG["highRiskThreshold"] and t.status == 'Processed']
        fraud_spikes = [t for t in current_batch if t.fraud_probability > self.fraud_threshold]
        banking_spam = [t for t in current_batch if t.status == 'Failed' and t.error_code and (t.retry_count > AGENT_CONFIG["retryCountThreshold"] or "AUTHENTICATION_FAILED" in t.error_code)]

        # 3. DECIDE & ACT
        actions = []
        if high_risk:
            for t in high_risk:
                actions.append(f"INVESTIGATE: High Risk {t.id}")
                self.stats["investigated"] += 1
        
        if fraud_spikes:
            for t in fraud_spikes:
                actions.append(f"BLOCK: Fraud Spike {t.id} ({t.fraud_probability})")
                self.stats["blocked"] += 1
                
        if banking_spam:
            for t in banking_spam:
                actions.append(f"ALERT: Banking Spam {t.bank} ({t.error_code})")
                self.stats["investigated"] += 1

        if actions:
            if len(actions) > 3:
                log_event("ACT", f"Executed {len(actions)} defensive actions.")
            else:
                for a in actions:
                    log_event("ACT", a)
        
        # 4. LEARN (Feedback Loop)
        if random.random() < 0.2:
            direction = random.choice([-0.01, 0.01])
            current_thresh = self.fraud_threshold
            new_thresh = max(0.5, min(0.99, current_thresh + direction))
            if new_thresh != current_thresh:
                self.fraud_threshold = new_thresh
                log_event("LEARN", f"Adjusted fraud threshold to {new_thresh:.2f} based on patterns.")
