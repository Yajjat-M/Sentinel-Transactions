import streamlit as st
import time
import pandas as pd
from src.agent import SentinelAgent
from src.ui import apply_custom_styles, render_3d_plot
from src.models import get_recent_transactions, get_logs, clear_all_data

# Page Configuration
st.set_page_config(
    page_title="Sentinel AI: Autonomous Fraud Defense",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="expanded"
)

apply_custom_styles()

# Initialize Session State
if 'agent' not in st.session_state:
    st.session_state.agent = SentinelAgent()
    # Initial load if DB is empty
    if not get_recent_transactions(1):
        st.session_state.agent.load_historical_data()
    st.session_state.running = False

# --- LAYOUT ---

st.title("🛡️ Sentinel AI Defense Grid")
st.markdown("### **Autonomous Financial Security System**")

# Control Panel
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
        clear_all_data()
        st.session_state.agent = SentinelAgent() # Re-init
        st.session_state.agent.load_historical_data()
        st.session_state.running = False
        st.rerun()

# Dashboard Grid
col1, col2 = st.columns([2, 1])

# Fetch Data for Display
recent_txs = get_recent_transactions(200) # Get last 200 for 3D plot
logs = get_logs(100)

with col1:
    st.subheader("🌐 3D Transaction Topology")
    render_3d_plot(recent_txs)

with col2:
    st.subheader("📊 System Vitality")
    
    m1, m2 = st.columns(2)
    m1.metric("Transactions", st.session_state.agent.stats["processed"], delta_color="off")
    m2.metric("Threats Blocked", st.session_state.agent.stats["blocked"], delta_color="inverse")
    
    m3, m4 = st.columns(2)
    m3.metric("Investigations", st.session_state.agent.stats["investigated"], delta_color="normal")
    m4.metric("AI Threshold", f"{st.session_state.agent.fraud_threshold:.2f}")

    st.markdown("---")
    
    st.subheader("💻 Neural Link Logs")
    if logs:
        log_text = "\n".join(logs)
        st.text_area("System Output", log_text, height=300, disabled=True, key=f"logs_{time.time()}")
    else:
        st.text_area("System Output", "System Ready. Initializing...", height=300, disabled=True)

# Data Table
st.subheader("📋 Recent Transaction Stream")
if recent_txs:
    df = pd.DataFrame([vars(t) for t in recent_txs])
    st.dataframe(
        df[['timestamp', 'id', 'merchant', 'amount', 'bank', 'status', 'fraud_probability', 'error_code']].head(10),
        use_container_width=True
    )

# Autonomous Loop
if st.session_state.running:
    st.session_state.agent.run_step()
    time.sleep(1)
    st.rerun()
