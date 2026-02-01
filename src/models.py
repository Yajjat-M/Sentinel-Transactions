import sqlite3
import json
from datetime import datetime

DB_PATH = "sentinel.db"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Transactions Table
    c.execute('''CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        timestamp TEXT,
        merchant TEXT,
        amount REAL,
        bank TEXT,
        status TEXT,
        risk_score INTEGER,
        fraud_probability REAL,
        error_code TEXT,
        retry_count INTEGER
    )''')
    
    # System Logs Table
    c.execute('''CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT,
        phase TEXT,
        message TEXT
    )''')
    
    # Config/State Table
    c.execute('''CREATE TABLE IF NOT EXISTS config (
        key TEXT PRIMARY KEY,
        value TEXT
    )''')
    
    # Initialize default config if not exists
    c.execute("INSERT OR IGNORE INTO config (key, value) VALUES ('fraud_threshold', '0.8')")
    
    conn.commit()
    conn.close()

class Transaction:
    def __init__(self, data):
        self.id = data.get("id")
        self.timestamp = data.get("timestamp")
        self.merchant = data.get("merchant")
        self.amount = float(data.get("amount", 0))
        self.bank = data.get("bank")
        self.status = data.get("status")
        self.risk_score = int(float(data.get("risk_score", 0)))
        self.fraud_probability = float(data.get("fraud_probability", 0))
        self.error_code = data.get("error_code")
        self.retry_count = int(float(data.get("retry_count", 0)))

    def save(self):
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('''INSERT OR REPLACE INTO transactions VALUES (?,?,?,?,?,?,?,?,?,?)''',
                  (self.id, self.timestamp, self.merchant, self.amount, self.bank, 
                   self.status, self.risk_score, self.fraud_probability, self.error_code, self.retry_count))
        conn.commit()
        conn.close()

def get_recent_transactions(limit=100):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT * FROM transactions ORDER BY timestamp DESC LIMIT ?", (limit,))
    rows = c.fetchall()
    conn.close()
    
    txs = []
    for r in rows:
        txs.append(Transaction({
            "id": r[0], "timestamp": r[1], "merchant": r[2], "amount": r[3],
            "bank": r[4], "status": r[5], "risk_score": r[6], "fraud_probability": r[7],
            "error_code": r[8], "retry_count": r[9]
        }))
    return txs

def log_event(phase, message):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    timestamp = datetime.now().strftime('%H:%M:%S')
    c.execute("INSERT INTO logs (timestamp, phase, message) VALUES (?,?,?)", (timestamp, phase, message))
    conn.commit()
    conn.close()

def get_logs(limit=50):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT timestamp, phase, message FROM logs ORDER BY id DESC LIMIT ?", (limit,))
    rows = c.fetchall()
    conn.close()
    return [f"[{r[0]}] [{r[1]}] {r[2]}" for r in rows]

def get_config(key, default=None):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT value FROM config WHERE key=?", (key,))
    row = c.fetchone()
    conn.close()
    return row[0] if row else default

def set_config(key, value):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("INSERT OR REPLACE INTO config (key, value) VALUES (?,?)", (key, str(value)))
    conn.commit()
    conn.close()

def clear_all_data():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("DELETE FROM transactions")
    c.execute("DELETE FROM logs")
    # Reset config
    c.execute("UPDATE config SET value='0.8' WHERE key='fraud_threshold'")
    conn.commit()
    conn.close()
