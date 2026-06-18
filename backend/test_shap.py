import joblib
import numpy as np
import pandas as pd

model = joblib.load('model.pkl')
feature_names = joblib.load('feature_names.pkl')
explainer = joblib.load('shap_explainer.pkl')
df = pd.read_csv('employees.csv')

employee_features = df[feature_names].iloc[0]
raw_shap = explainer.shap_values(employee_features.values.reshape(1,-1))

print('Type:', type(raw_shap))
print('Shape:', np.array(raw_shap).shape)
print('Success!')