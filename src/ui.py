import streamlit as st
import plotly.express as px
import pandas as pd

def apply_custom_styles():
    st.markdown("""
    <style>
        .stApp {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            color: #e2e8f0;
        }
        div.stMetric, div.stDataFrame, div.stPlotlyChart {
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
        div.stButton > button {
            width: 100%;
            border-radius: 12px;
            border: none;
            padding: 0.75rem 1rem;
            font-weight: 600;
            text-transform: uppercase;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
        }
        div.stButton > button:active {
            transform: translateY(2px);
        }
        div.stButton > button:first-child {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
        }
        h1, h2, h3 { color: #f8fafc; text-shadow: 0 2px 4px rgba(0,0,0,0.5); }
        .stTextArea textarea {
            background-color: #000000 !important;
            color: #00ff00 !important;
            font-family: 'Courier New', monospace;
            border-radius: 10px;
        }
    </style>
    """, unsafe_allow_html=True)

def render_3d_plot(transactions):
    if not transactions:
        st.info("Waiting for data stream...")
        return

    df = pd.DataFrame([vars(t) for t in transactions])
    if df.empty:
        st.info("No transaction data available.")
        return

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
