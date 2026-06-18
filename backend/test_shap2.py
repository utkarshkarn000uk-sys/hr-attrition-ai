import joblib
import numpy as np
import pandas as pd

model = joblib.load('model.pkl')
feature_names = joblib.load('feature_names.pkl')
explainer = joblib.load('shap_explainer.pkl')
df = pd.read_csv('employees.csv')

employee_features = df[feature_names].iloc[0]
raw_shap = explainer.shap_values(employee_features.values.reshape(1,-1))

shap_vals = raw_shap[0]
print("shap_vals type:", type(shap_vals))
print("shap_vals shape:", shap_vals.shape)
print("feature_names count:", len(feature_names))
print("First shap value:", shap_vals[0])
print("Risk score:", df.iloc[0]['RiskScore'])
print("All good!")
