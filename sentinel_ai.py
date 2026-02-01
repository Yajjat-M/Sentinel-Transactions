import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import sqlite3
import time
import random
import os
import csv
from datetime import datetime

# --- CONFIGURATION ---
DB_PATH = "sentinel_core.db"
AGENT_CONFIG = {
    "highRiskThreshold": 20,
    "retryCountThreshold": 3,
}

# --- DATABASE LAYER ---
def get_db_connection():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False, timeout=30.0)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    try:
        conn = get_db_connection()
        c = conn.cursor()
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
        c.execute('''CREATE TABLE IF NOT EXISTS logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT,
            phase TEXT,
            message TEXT,
            details TEXT
        )''')
        c.execute('''CREATE TABLE IF NOT EXISTS config (
            key TEXT PRIMARY KEY,
            value TEXT
        )''')
        c.execute("INSERT OR IGNORE INTO config (key, value) VALUES ('fraud_threshold', '0.8')")
        
        # Check if column exists before adding (migration)
        try:
            c.execute("SELECT details FROM logs LIMIT 1")
        except sqlite3.OperationalError:
            c.execute("ALTER TABLE logs ADD COLUMN details TEXT")
            
        conn.commit()
    except Exception as e:
        print(f"DB Init Error: {e}")
    finally:
        conn.close()

def db_save_transaction(tx):
    try:
        conn = get_db_connection()
        c = conn.cursor()
        c.execute('''INSERT OR REPLACE INTO transactions VALUES (?,?,?,?,?,?,?,?,?,?)''',
                  (tx["id"], tx["timestamp"], tx["merchant"], tx["amount"], tx["bank"], 
                   tx["status"], tx["risk_score"], tx["fraud_probability"], tx["error_code"], tx["retry_count"]))
        conn.commit()
    except Exception as e:
        print(f"DB Save Error: {e}")
    finally:
        conn.close()

def db_log_event(phase, message, details=""):
    try:
        conn = get_db_connection()
        c = conn.cursor()
        ts = datetime.now().strftime('%H:%M:%S')
        c.execute("INSERT INTO logs (timestamp, phase, message, details) VALUES (?,?,?,?)", (ts, phase, message, str(details)))
        conn.commit()
    except Exception as e:
        print(f"DB Log Error: {e}")
    finally:
        conn.close()

def db_get_recent_tx(limit=200):
    try:
        conn = get_db_connection()
        df = pd.read_sql_query(f"SELECT * FROM transactions ORDER BY timestamp DESC LIMIT {limit}", conn)
        return df
    except Exception as e:
        print(f"DB Fetch Error: {e}")
        return pd.DataFrame()
    finally:
        conn.close()

def db_get_logs(limit=50):
    try:
        conn = get_db_connection()
        c = conn.cursor()
        c.execute("SELECT timestamp, phase, message, details FROM logs ORDER BY id DESC LIMIT ?", (limit,))
        return c.fetchall()
    except Exception as e:
        print(f"DB Log Fetch Error: {e}")
        return []
    finally:
        conn.close()

def db_get_config(key, default):
    try:
        conn = get_db_connection()
        c = conn.cursor()
        c.execute("SELECT value FROM config WHERE key=?", (key,))
        row = c.fetchone()
        return row[0] if row else default
    except Exception as e:
        print(f"DB Config Fetch Error: {e}")
        return default
    finally:
        conn.close()

def db_set_config(key, value):
    try:
        conn = get_db_connection()
        c = conn.cursor()
        c.execute("INSERT OR REPLACE INTO config (key, value) VALUES (?,?)", (key, str(value)))
        conn.commit()
    except Exception as e:
        print(f"DB Config Set Error: {e}")
    finally:
        conn.close()

def db_reset():
    try:
        conn = get_db_connection()
        c = conn.cursor()
        c.execute("DELETE FROM transactions")
        c.execute("DELETE FROM logs")
        c.execute("UPDATE config SET value='0.8' WHERE key='fraud_threshold'")
        conn.commit()
    except Exception as e:
        print(f"DB Reset Error: {e}")
    finally:
        conn.close()

# --- AGENT LOGIC ---
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
        return float(db_get_config("fraud_threshold", 0.8))

    @fraud_threshold.setter
    def fraud_threshold(self, value):
        db_set_config("fraud_threshold", value)

    def load_data(self):
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
                        next(reader, None)
                        for row in reader:
                            if len(row) < 14: continue
                            try:
                                status = 'Processed' if row[9].lower() == 'success' else 'Failed'
                                tx = {
                                    "id": row[1], "timestamp": row[2], "amount": float(row[4] or 0),
                                    "merchant": row[7], "bank": row[8], "status": status,
                                    "error_code": row[10] if row[10] else None,
                                    "risk_score": int(float(row[13] or 0)),
                                    "fraud_probability": float(row[13] or 0)/100,
                                    "retry_count": int(float(row[20] or 0))
                                }
                                db_save_transaction(tx)
                                count += 1
                            except: continue
                except: pass
        db_log_event("SYSTEM", f"Initialized with {count} historical records.")

    def run_cycle(self):
        # 1. OBSERVE (Generate Synthetic Data)
        merchants = ["Amazon", "Walmart", "Apple", "Netflix", "Uber"]
        banks = ["HDFC", "SBI", "Axis", "ICICI"]
        error_codes = ["UPI_AUTH_FAIL", "INSUFFICIENT_FUNDS", "SERVER_ERR"]
        
        new_txs = []
        for _ in range(random.randint(1, 2)):
            is_spam = random.random() < 0.2
            is_fraud = random.random() < 0.1
            
            tx = {
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
            }
            db_save_transaction(tx)
            new_txs.append(tx)
            self.stats["processed"] += 1
        
        db_log_event("OBSERVE", f"Analyzed {len(new_txs)} new transactions.", details=str(new_txs))

        # 2. REASON & ACT
        actions = []
        reasoning = []
        for t in new_txs:
            if t["risk_score"] > AGENT_CONFIG["highRiskThreshold"] and t["status"] == 'Processed':
                act = f"INVESTIGATE: High Risk {t['id']}"
                actions.append(act)
                reasoning.append(f"Transaction {t['id']} flagged for investigation due to risk score {t['risk_score']} > {AGENT_CONFIG['highRiskThreshold']}")
                self.stats["investigated"] += 1
            if t["fraud_probability"] > self.fraud_threshold:
                act = f"BLOCK: Fraud Spike {t['id']}"
                actions.append(act)
                reasoning.append(f"Transaction {t['id']} BLOCKED due to fraud probability {t['fraud_probability']:.2f} > threshold {self.fraud_threshold:.2f}")
                self.stats["blocked"] += 1
            if t["status"] == 'Failed' and t["retry_count"] > AGENT_CONFIG["retryCountThreshold"]:
                act = f"ALERT: Banking Spam {t['bank']}"
                actions.append(act)
                reasoning.append(f"Banking spam alert triggered for {t['bank']} due to {t['retry_count']} retries")
                self.stats["investigated"] += 1
        
        if actions:
            db_log_event("ACT", f"Taken {len(actions)} defensive actions.", details="; ".join(actions))
            db_log_event("REASON", "Decision logic applied", details="; ".join(reasoning))
        
        # 3. LEARN
        if random.random() < 0.1:
            current = self.fraud_threshold
            adj = random.choice([-0.01, 0.01])
            new_val = max(0.5, min(0.99, current + adj))
            self.fraud_threshold = new_val
            db_log_event("LEARN", f"Optimized threshold: {current:.2f} -> {new_val:.2f}", details="Self-correction based on recent false positives/negatives analysis.")

# --- UI LAYER ---
st.set_page_config(page_title="Sentinel AI", page_icon="🛡️", layout="wide")

# Custom CSS (Glassmorphism & 3D)
st.markdown("""
<style>
    /* Main Background */
    .stApp {
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        color: #e2e8f0;
    }
    
    /* Glassmorphism Containers */
    div.stMetric, div.stDataFrame, div.stPlotlyChart, div[data-testid="stExpander"] {
        background: rgba(30, 41, 59, 0.7);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 15px;
        padding: 15px;
        box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(10px);
        transition: transform 0.3s ease;
    }
    
    div.stMetric:hover, div.stDataFrame:hover {
        transform: translateY(-5px);
    }
    
    /* 3D Buttons */
    div.stButton > button {
        width: 100%;
        border-radius: 12px;
        border: none;
        padding: 0.75rem 1rem;
        font-weight: 600;
        text-transform: uppercase;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
        transition: all 0.2s ease;
    }
    div.stButton > button:active {
        transform: translateY(2px) scale(0.98);
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
    }
    div.stButton > button:first-child {
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        color: white;
    }
    
    /* Sidebar */
    [data-testid="stSidebar"] {
        background: rgba(15, 23, 42, 0.95);
        border-right: 1px solid rgba(255,255,255,0.1);
    }
    
    /* Typography */
    h1, h2, h3 { 
        color: #f8fafc; 
        text-shadow: 0 2px 4px rgba(0,0,0,0.5); 
        font-family: 'Inter', sans-serif;
    }
    
    /* Terminal Logs */
    .stTextArea textarea {
        background-color: #000000 !important;
        color: #00ff00 !important;
        font-family: 'Courier New', monospace;
        border-radius: 10px;
        border: 1px solid #333;
    }
</style>
""", unsafe_allow_html=True)

if 'agent' not in st.session_state:
    st.session_state.agent = SentinelAgent()
    # Check if data exists, if not load it
    if len(db_get_recent_tx(1)) == 0:
        st.session_state.agent.load_data()
    st.session_state.running = False

# Sidebar Navigation
with st.sidebar:
    st.title("🛡️ Sentinel AI")
    st.markdown("---")
    page = st.radio("Navigation", ["Dashboard", "Agent Logic", "Transactions", "Settings"], index=0)
    st.markdown("---")
    
    st.subheader("System Control")
    if st.button("▶ START SYSTEM", key="start"):
        st.session_state.running = True
        st.rerun()
    if st.button("⏹ STOP SYSTEM", key="stop"):
        st.session_state.running = False
        st.rerun()
    if st.button("🔄 SYSTEM RESET", key="reset"):
        db_reset()
        st.session_state.agent = SentinelAgent()
        st.session_state.agent.load_data()
        st.session_state.running = False
        st.rerun()
        
    st.markdown("---")
    st.info(f"System Status: {'🟢 ONLINE' if st.session_state.running else '🔴 OFFLINE'}")

# --- PAGE: DASHBOARD ---
if page == "Dashboard":
    st.title("🌐 Global Threat Monitor")
    
    # Top Stats
    k1, k2, k3, k4 = st.columns(4)
    df_recent = db_get_recent_tx(500)
    
    with k1:
        st.metric("Total Transactions", st.session_state.agent.stats["processed"], delta_color="normal")
    with k2:
        st.metric("Threats Blocked", st.session_state.agent.stats["blocked"], delta_color="inverse")
    with k3:
        fraud_rate = (st.session_state.agent.stats["blocked"] / max(1, st.session_state.agent.stats["processed"])) * 100
        st.metric("Fraud Rate", f"{fraud_rate:.2f}%", delta_color="inverse")
    with k4:
        st.metric("Active Threshold", f"{st.session_state.agent.fraud_threshold:.2f}")

    # Main Visuals
    c1, c2 = st.columns([2, 1])
    
    with c1:
        st.subheader("3D Transaction Topology")
        if not df_recent.empty:
            fig = px.scatter_3d(df_recent, x='amount', y='risk_score', z='fraud_probability',
                               color='status', symbol='status',
                               color_discrete_map={'Processed': '#10b981', 'Failed': '#ef4444'},
                               hover_data=['merchant', 'bank', 'error_code'],
                               title="Live Transaction Vector Space")
            fig.update_layout(
                scene=dict(
                    xaxis_title='Amount ($)',
                    yaxis_title='Risk Score',
                    zaxis_title='Fraud Probability',
                    bgcolor='rgba(0,0,0,0)'
                ),
                paper_bgcolor='rgba(0,0,0,0)',
                margin=dict(l=0, r=0, b=0, t=30),
                font=dict(color="white"),
                legend=dict(yanchor="top", y=0.9, xanchor="left", x=0.1)
            )
            st.plotly_chart(fig, use_container_width=True)
        else:
            st.info("Awaiting transaction stream...")

    with c2:
        st.subheader("Live Neural Logs")
        logs = db_get_logs(20)
        log_text = "\n".join([f"[{r[0]}] {r[2]}" for r in logs])
        st.text_area("", log_text, height=400, disabled=True)

# --- PAGE: AGENT LOGIC ---
elif page == "Agent Logic":
    st.title("🧠 Autonomous Agent Logic")
    
    col_logic, col_details = st.columns([1, 1])
    
    with col_logic:
        st.subheader("Decision Cycle State")
        
        # Visualize the loop
        st.markdown("""
        <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.05); padding: 20px; border-radius: 15px; margin-bottom: 20px;">
            <div style="text-align: center; color: #60a5fa;">
                <h3>👁️ OBSERVE</h3>
                <p>Ingest Data</p>
            </div>
            <div style="font-size: 24px;">➡️</div>
            <div style="text-align: center; color: #f59e0b;">
                <h3>🤔 REASON</h3>
                <p>Analyze Risk</p>
            </div>
            <div style="font-size: 24px;">➡️</div>
            <div style="text-align: center; color: #ef4444;">
                <h3>🛡️ ACT</h3>
                <p>Block/Alert</p>
            </div>
            <div style="font-size: 24px;">➡️</div>
            <div style="text-align: center; color: #10b981;">
                <h3>🎓 LEARN</h3>
                <p>Self-Optimize</p>
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        st.markdown("### Current Policy Parameters")
        st.json({
            "fraud_threshold": st.session_state.agent.fraud_threshold,
            "high_risk_score_trigger": AGENT_CONFIG["highRiskThreshold"],
            "max_retries_allowed": AGENT_CONFIG["retryCountThreshold"]
        })

    with col_details:
        st.subheader("Reasoning Engine Output")
        recent_reasoning = db_get_logs(10)
        # Filter for REASON or LEARN phases
        filtered_logs = [r for r in recent_reasoning if r[2] in ['REASON', 'LEARN', 'ACT']]
        
        for log in recent_reasoning:
            ts, phase, msg, details = log
            if phase == "REASON":
                icon = "🤔"
                color = "#f59e0b"
            elif phase == "ACT":
                icon = "🛡️"
                color = "#ef4444"
            elif phase == "LEARN":
                icon = "🎓"
                color = "#10b981"
            elif phase == "OBSERVE":
                icon = "👁️"
                color = "#60a5fa"
            else:
                icon = "ℹ️"
                color = "#94a3b8"
            
            with st.expander(f"{icon} {phase} - {ts}"):
                st.write(f"**Message:** {msg}")
                if details:
                    st.code(details, language="text")

# --- PAGE: TRANSACTIONS ---
elif page == "Transactions":
    st.title("📊 Transaction Explorer")
    
    df = db_get_recent_tx(1000)
    
    # Filters
    f1, f2 = st.columns(2)
    with f1:
        status_filter = st.multiselect("Filter by Status", df['status'].unique(), default=df['status'].unique())
    with f2:
        bank_filter = st.multiselect("Filter by Bank", df['bank'].unique(), default=df['bank'].unique())
    
    if not df.empty:
        filtered_df = df[df['status'].isin(status_filter) & df['bank'].isin(bank_filter)]
        st.dataframe(filtered_df, use_container_width=True, height=600)
    else:
        st.info("No transaction data found.")

# --- PAGE: SETTINGS ---
elif page == "Settings":
    st.title("⚙️ System Configuration")
    
    st.subheader("Manual Override")
    new_threshold = st.slider("Global Fraud Probability Threshold", 0.0, 1.0, st.session_state.agent.fraud_threshold, 0.01)
    
    if new_threshold != st.session_state.agent.fraud_threshold:
        st.session_state.agent.fraud_threshold = new_threshold
        st.success(f"Threshold updated to {new_threshold}")
        db_log_event("CONFIG", f"Manual threshold override to {new_threshold}")

# --- SYSTEM LOOP ---
if st.session_state.running:
    st.session_state.agent.run_cycle()
    time.sleep(1)
    st.rerun()
