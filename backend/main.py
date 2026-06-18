import os
import json
import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Annotated
from typing_extensions import TypedDict
from langchain_groq import ChatGroq
from langchain.tools import tool
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.prebuilt import ToolNode
from langchain_core.messages import SystemMessage

# ── Load ML model and data ────────────────────────────────────
print("Loading ML model...")
model = joblib.load("model.pkl")
feature_names = joblib.load("feature_names.pkl")
explainer = joblib.load("shap_explainer.pkl")

df = pd.read_csv("employees.csv")
print(f"Loaded {len(df)} employees")

# ── Add risk scores ───────────────────────────────────────────
df_features = df[feature_names]
all_probs = model.predict_proba(df_features)[:,1]
df['RiskScore'] = (all_probs * 100).round(1)
df['RiskLevel'] = pd.cut(df['RiskScore'],
                          bins=[0,30,70,100],
                          labels=['Low','Medium','High'])
print("Risk scores calculated for all employees!")

# ── FastAPI ───────────────────────────────────────────────────
app = FastAPI(title="HR AttritionAI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes ────────────────────────────────────────────────────
@app.get("/")
def home():
    return {"message": "HR AttritionAI API running!"}

@app.get("/stats")
def get_stats():
    return {
        "total_employees": len(df),
        "attrition_rate": round((df['Attrition']==1).mean()*100, 1),
        "high_risk_count": int((df['RiskLevel']=='High').sum()),
        "avg_satisfaction": round(df['SatisfactionScore'].mean(), 2),
        "avg_salary": round(df['MonthlyIncome'].mean(), 0),
    }

@app.get("/employees")
def get_employees(department: Optional[str]=None,
                  risk_level: Optional[str]=None,
                  limit: int=100):
    result = df.copy()
    if department:
        result = result[result['Department'].astype(str)==department]
    if risk_level:
        result = result[result['RiskLevel']==risk_level]
    result = result.head(limit)
    return result.to_dict(orient='records')

@app.get("/employees/{employee_id}")
def get_employee(employee_id: int):
    if employee_id >= len(df):
        raise HTTPException(status_code=404, detail="Employee not found")
    return df.iloc[employee_id].to_dict()

@app.get("/shap/{employee_id}")
def get_shap(employee_id: int):
    if employee_id >= len(df):
        raise HTTPException(status_code=404, detail="Employee not found")

    employee_features = df[feature_names].iloc[employee_id]
    raw_shap = explainer.shap_values(
        employee_features.values.reshape(1, -1)
    )
    shap_vals = raw_shap[0]  # shape (15,)

    shap_data = []
    for i in range(len(feature_names)):
        shap_data.append({
            "feature": feature_names[i],
            "value": round(float(employee_features.values[i]), 2),
            "shap_value": round(float(shap_vals[i]), 4),
            "impact": "increases_risk" if shap_vals[i] > 0 else "decreases_risk"
        })

    shap_data.sort(key=lambda x: abs(x['shap_value']), reverse=True)

    return {
        "employee_id": employee_id,
        "risk_score": float(df.iloc[employee_id]['RiskScore']),
        "top_factors": shap_data[:5],
        "all_factors": shap_data
    }

class PredictRequest(BaseModel):
    Age: int = 35
    Department: int = 1
    DistanceFromHome: int = 5
    Education: int = 3
    EducationField: int = 2
    EnvironmentSatisfaction: int = 3
    JobSatisfaction: int = 3
    MaritalStatus: int = 1
    MonthlyIncome: int = 5000
    NumCompaniesWorked: int = 2
    WorkLifeBalance: int = 3
    YearsAtCompany: int = 5

@app.post("/predict")
def predict(req: PredictRequest):
    data = req.dict()

    data['SalaryPerYear'] = data['MonthlyIncome'] / (data['YearsAtCompany'] + 1)
    data['SatisfactionScore'] = (
        data['EnvironmentSatisfaction'] +
        data['JobSatisfaction'] +
        data['WorkLifeBalance']
    ) / 3
    data['DistanceIncomeRatio'] = data['DistanceFromHome'] / (data['MonthlyIncome'] / 1000)

    features = [data[f] for f in feature_names]
    features_array = np.array(features).reshape(1, -1)

    prob = model.predict_proba(features_array)[0][1]
    risk_score = round(float(prob) * 100, 1)

    if risk_score >= 70:
        risk_level = "High"
        recommendation = "Urgent: Schedule salary review and flexible work arrangement"
    elif risk_score >= 30:
        risk_level = "Medium"
        recommendation = "Monitor closely: Consider career development opportunities"
    else:
        risk_level = "Low"
        recommendation = "Employee appears satisfied. Maintain current engagement"

    return {
        "risk_score": risk_score,
        "risk_level": risk_level,
        "recommendation": recommendation
    }

# ── LangGraph Chatbot ─────────────────────────────────────────
from dotenv import load_dotenv
load_dotenv()
llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0.7)

@tool
def query_employees(department: str = "", risk_level: str = "") -> str:
    """Query employees by department or risk level."""
    result = df.copy()
    if department:
        result = result[result['Department'].astype(str).str.contains(
            department, case=False)]
    if risk_level:
        result = result[result['RiskLevel'].str.lower()==risk_level.lower()]
    count = len(result)
    avg_risk = result['RiskScore'].mean()
    return f"Found {count} employees. Average risk score: {avg_risk:.1f}%"

@tool
def get_dashboard_stats() -> str:
    """Get overall HR dashboard statistics."""
    stats = {
        "total": len(df),
        "high_risk": int((df['RiskLevel']=='High').sum()),
        "medium_risk": int((df['RiskLevel']=='Medium').sum()),
        "low_risk": int((df['RiskLevel']=='Low').sum()),
        "avg_risk": round(df['RiskScore'].mean(), 1),
    }
    return json.dumps(stats)

@tool
def get_top_at_risk(n: int = 5) -> str:
    """Get the top N employees most at risk of leaving."""
    top = df.nlargest(n, 'RiskScore')[
        ['Age','Department','MonthlyIncome','RiskScore','RiskLevel']
    ]
    return top.to_string(index=True)

tools = [query_employees, get_dashboard_stats, get_top_at_risk]
llm_with_tools = llm.bind_tools(tools)

class ChatState(TypedDict):
    messages: Annotated[list, add_messages]

def agent_node(state: ChatState) -> dict:
    messages = [SystemMessage(content="""You are an expert HR analytics AI assistant.
You have access to employee attrition data and ML predictions.
Use tools to answer questions about employee risk and retention.
Always be specific with numbers and percentages.""")] + state["messages"]
    response = llm_with_tools.invoke(messages)
    return {"messages": [response]}

tool_node = ToolNode(tools)

def should_continue(state: ChatState) -> str:
    if state["messages"][-1].tool_calls:
        return "tools"
    return END

builder = StateGraph(ChatState)
builder.add_node("agent", agent_node)
builder.add_node("tools", tool_node)
builder.add_edge(START, "agent")
builder.add_conditional_edges("agent", should_continue)
builder.add_edge("tools", "agent")

checkpointer = InMemorySaver()
graph = builder.compile(checkpointer=checkpointer)

class ChatRequest(BaseModel):
    message: str
    session_id: str = "default"

@app.post("/chat")
async def chat(req: ChatRequest):
    config = {"configurable": {"thread_id": req.session_id}}

    async def stream_response():
        async for event in graph.astream_events(
            {"messages": [("user", req.message)]},
            config=config,
            version="v2"
        ):
            if event["event"] == "on_chat_model_stream":
                chunk = event["data"]["chunk"].content
                if chunk:
                    yield f"data: {json.dumps({'text': chunk})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(stream_response(), media_type="text/event-stream")