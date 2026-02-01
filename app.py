import streamlit as st
import pandas as pd
import time
import random
import os
import csv
from datetime import datetime
import plotly.express as px
import plotly.graph_objects as go

# --- PAGE CONFIGURATION ---
st.set_page_config(
    page_title="Sentinel AI: Autonomous Fraud Defense",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# --- CUSTOM 3D UI/UX STYLES ---
st.markdown("""
<style>
    /* Global Background */
    .stApp {
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        color: #e2e8f0;
    }

    /* 3D Card Effect for Containers */
    div.stMetric, div.stDataFrame, div.stPlotlyChart {
        background: rgba(30, 41, 59, 0.7);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 15px;
        padding: 15px;
        box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(10px);
        transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    
    div.stMetric:hover, div.stDataFrame:hover {
        transform: translateY(-5px);
        box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.7);
    }

    /* 3D Button Styles */
    div.stButton > button {
        width: 100%;
        border-radius: 12px;
        border: none;
        padding: 0.75rem 1rem;
        font-weight: 600;
        letter-spacing: 0.5px;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        text-transform: uppercase;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.15);
    }

    div.stButton > button:active {
        transform: translateY(2px);
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
    }

    /* Start Button - Green/Emerald */
    div.stButton > button:first-child {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
    }
    
    /* Stop Button - Red/Rose (Custom targeting needed if multiple buttons, 
       Streamlit makes specific targeting hard, so we use order or keys) */
    
    /* Headers */
    h1, h2, h3 {
        color: #f8fafc;
        text-shadow: 0 2px 4px rgba(0,0,0,0.5);
    }

    /* Custom Scrollbar */
    ::-webkit-scrollbar {
        width: 10px;
        background: #0f172a;
    }
    ::-webkit-scrollbar-thumb {
        background: #334155;
        border-radius: 5px;
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

# --- BACKEND LOGIC (Simulated) ---

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
        self.status = data.get("status")
        self.risk_score = int(float(data.get("risk_score", 0)))
        self.fraud_probability = float(data.get("fraud_probability", 0))
        self.error_code = data.get("error_code")
        self.retry_count = int(float(data.get("retry_count", 0)))

class SentinelAgent:
    def __init__(self):
        self.transactions = []
        self.logs = []
        self.fraud_threshold = AGENT_CONFIG["fraudProbThreshold"]
        self.stats = {
            "processed": 0,
            "blocked": 0,
            "investigated": 0
        }

    def log(self, phase, message):
        timestamp = datetime.now().strftime('%H:%M:%S')
        log_entry = f"[{timestamp}] [{phase}] {message}"
        self.logs.insert(0, log_entry)
        if len(self.logs) > 100: self.logs.pop()

    def load_data(self):
        # Try to load real data, fallback to synthetic
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
                                    "retry_count": row[20] if row[20] else 0
                                }
                                self.transactions.append(Transaction(tx_data))
                                count += 1
                            except: continue
                except: pass
        
        self.log("SYSTEM", f"Dataset loaded: {count} historical records.")
        self.generate_synthetic_stream(20) # Init with some data

    def generate_synthetic_stream(self, n=5):
        merchants = ["Amazon", "Walmart", "Apple", "Netflix", "Uber", "Airbnb"]
        banks = ["HDFC", "SBI", "Axis", "ICICI", "Chase"]
        error_codes = ["UPI_AUTHENTICATION_FAILED", "INSUFFICIENT_FUNDS", "BANK_SERVER_ERROR", "RISK_CHECK_FAILED"]
        
        new_batch = []
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
            self.transactions.append(tx)
            new_batch.append(tx)
            
        # Keep list size manageable
        if len(self.transactions) > 1000:
            self.transactions = self.transactions[-1000:]
            
        return new_batch

    def run_step(self):
        # 1. OBSERVE (Generate new data)
        current_batch = self.generate_synthetic_stream(random.randint(2, 5))
        self.stats["processed"] += len(current_batch)
        self.log("OBSERVE", f"Ingested {len(current_batch)} new transactions.")

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
            # Group actions for cleaner logs
            if len(actions) > 3:
                self.log("ACT", f"Executed {len(actions)} defensive actions.")
            else:
                for a in actions:
                    self.log("ACT", a)
        
        # 4. LEARN (Feedback Loop)
        if random.random() < 0.2:
            direction = random.choice([-0.01, 0.01])
            new_thresh = max(0.5, min(0.99, self.fraud_threshold + direction))
            if new_thresh != self.fraud_threshold:
                self.fraud_threshold = new_thresh
                self.log("LEARN", f"Adjusted fraud threshold to {self.fraud_threshold:.2f} based on patterns.")

        return current_batch

# --- INITIALIZATION ---
if 'agent' not in st.session_state:
    st.session_state.agent = SentinelAgent()
    st.session_state.agent.load_data()
    st.session_state.running = False

# --- LAYOUT ---

# Top Header with 3D feel
st.title("🛡️ Sentinel AI Defense Grid")
st.markdown("### **Autonomous Financial Security System**")

# Control Panel (Top Bar)
col_ctrl1, col_ctrl2, col_ctrl3, col_ctrl4 = st.columns([1, 1, 1, 3])

with col_ctrl1:
    if st.button("▶ START SYSTEM", key="start_btn"):
        st.session_state.running = True
        st.rerun()

with col_ctrl2:
    if st.button("⏹ STOP SYSTEM", key="stop_btn"):
        st.session_state.running = False
        st.rerun()

with col_ctrl3:
    if st.button("🔄 RESET ALL", key="reset_btn"):
        st.session_state.agent = SentinelAgent()
        st.session_state.agent.load_data()
        st.session_state.running = False
        st.rerun()

# Dashboard Grid
col1, col2 = st.columns([2, 1])

with col1:
    # 3D Visualization Section
    st.subheader("🌐 3D Transaction Topology")
    
    # Prepare data for 3D plot
    df = pd.DataFrame([vars(t) for t in st.session_state.agent.transactions])
    
    if not df.empty:
        # Create 3D Scatter Plot
        fig = px.scatter_3d(
            df, 
            x='amount', 
            y='risk_score', 
            z='fraud_probability',
            color='status',
            symbol='status',
            hover_data=['id', 'merchant', 'bank'],
            title='Real-time Fraud Vector Analysis',
            color_discrete_map={'Processed': '#10b981', 'Failed': '#ef4444'},
            opacity=0.8
        )
        fig.update_layout(
            scene=dict(
                xaxis_title='Amount ($)',
                yaxis_title='Risk Score',
                zaxis_title='Fraud Prob',
                bgcolor='rgba(0,0,0,0)'
            ),
            paper_bgcolor='rgba(0,0,0,0)',
            plot_bgcolor='rgba(0,0,0,0)',
            margin=dict(l=0, r=0, b=0, t=30),
            font=dict(color="white")
        )
        st.plotly_chart(fig, use_container_width=True)
    else:
        st.info("Waiting for data stream...")

with col2:
    # Key Metrics Cards with 3D style
    st.subheader("📊 System Vitality")
    
    m1, m2 = st.columns(2)
    m1.metric("Transactions", st.session_state.agent.stats["processed"], delta_color="off")
    m2.metric("Threats Blocked", st.session_state.agent.stats["blocked"], delta_color="inverse")
    
    m3, m4 = st.columns(2)
    m3.metric("Investigations", st.session_state.agent.stats["investigated"], delta_color="normal")
    m4.metric("AI Threshold", f"{st.session_state.agent.fraud_threshold:.2f}")

    st.markdown("---")
    
    # Live Terminal
    st.subheader("💻 Neural Link Logs")
    if st.session_state.agent.logs:
        log_text = "\n".join(st.session_state.agent.logs)
        st.text_area("System Output", log_text, height=300, disabled=True, key=f"logs_{time.time()}")
    else:
        st.text_area("System Output", "System Ready. Initializing...", height=300, disabled=True)

# Data Table at Bottom
st.subheader("📋 Recent Transaction Stream")
if not df.empty:
    st.dataframe(
        df[['timestamp', 'id', 'merchant', 'amount', 'bank', 'status', 'fraud_probability', 'error_code']].tail(10).sort_index(ascending=False),
        use_container_width=True
    )

# --- AUTONOMOUS LOOP ---
if st.session_state.running:
    st.session_state.agent.run_step()
    time.sleep(1) # Refresh rate
    st.rerun()
