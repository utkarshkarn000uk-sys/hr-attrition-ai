import React, { useState } from 'react';
import axios from 'axios';

const API = 'https://hr-attrition-ai-backend.onrender.com';

export default function Predict() {
  const [form, setForm] = useState({
    Age: 35,
    Department: 1,
    DistanceFromHome: 5,
    Education: 3,
    EducationField: 2,
    EnvironmentSatisfaction: 3,
    JobSatisfaction: 3,
    MaritalStatus: 1,
    MonthlyIncome: 5000,
    NumCompaniesWorked: 2,
    WorkLifeBalance: 3,
    YearsAtCompany: 5,
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: Number(e.target.value) });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await axios.post(`${API}/predict`, form);
      setResult(res.data);
    } catch(e) {
      alert('Error connecting to backend!');
    }
    setLoading(false);
  };

  const getRiskColor = (level) => {
    if (level === 'High') return '#ef4444';
    if (level === 'Medium') return '#f59e0b';
    return '#22c55e';
  };

  const fields = [
    { name: 'Age', label: 'Age', min: 18, max: 60 },
    { name: 'MonthlyIncome', label: 'Monthly Income ($)', min: 1000, max: 20000 },
    { name: 'YearsAtCompany', label: 'Years at Company', min: 0, max: 40 },
    { name: 'DistanceFromHome', label: 'Distance from Home (km)', min: 1, max: 30 },
    { name: 'JobSatisfaction', label: 'Job Satisfaction (1-4)', min: 1, max: 4 },
    { name: 'EnvironmentSatisfaction', label: 'Environment Satisfaction (1-4)', min: 1, max: 4 },
    { name: 'WorkLifeBalance', label: 'Work Life Balance (1-4)', min: 1, max: 4 },
    { name: 'Education', label: 'Education Level (1-5)', min: 1, max: 5 },
    { name: 'NumCompaniesWorked', label: 'Companies Worked Before', min: 0, max: 10 },
    { name: 'Department', label: 'Department (0-2)', min: 0, max: 2 },
    { name: 'MaritalStatus', label: 'Marital Status (0-2)', min: 0, max: 2 },
    { name: 'EducationField', label: 'Education Field (0-5)', min: 0, max: 5 },
  ];

  return (
    <div>
      <h1 style={styles.title}>Predict Attrition Risk</h1>
      <p style={styles.subtitle}>Enter employee details to predict their attrition risk</p>

      <div style={styles.layout}>
        {/* Form */}
        <div style={styles.formCard}>
          <h3 style={styles.cardTitle}>Employee Details</h3>
          <div style={styles.grid}>
            {fields.map(field => (
              <div key={field.name} style={styles.fieldGroup}>
                <label style={styles.label}>{field.label}</label>
                <input
                  type="number"
                  name={field.name}
                  value={form[field.name]}
                  onChange={handleChange}
                  min={field.min}
                  max={field.max}
                  style={styles.input}
                />
              </div>
            ))}
          </div>
          <button
            style={{...styles.btn, opacity: loading ? 0.7 : 1}}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Predicting...' : 'Predict Attrition Risk'}
          </button>
        </div>

        {/* Result */}
        {result && (
          <div style={styles.resultCard}>
            <h3 style={styles.cardTitle}>Prediction Result</h3>

            {/* Risk gauge */}
            <div style={styles.gaugeWrap}>
              <div style={styles.gaugeLabel}>Attrition Risk Score</div>
              <div style={styles.gaugeBg}>
                <div style={{
                  ...styles.gaugeFill,
                  width: `${result.risk_score}%`,
                  background: getRiskColor(result.risk_level)
                }}/>
              </div>
              <div style={{
                fontSize: '42px',
                fontWeight: '700',
                color: getRiskColor(result.risk_level),
                margin: '12px 0'
              }}>
                {result.risk_score}%
              </div>
              <span style={{
                background: getRiskColor(result.risk_level) + '22',
                color: getRiskColor(result.risk_level),
                padding: '6px 18px',
                borderRadius: '999px',
                fontWeight: '600',
                fontSize: '16px'
              }}>
                {result.risk_level} Risk
              </span>
            </div>

            {/* Recommendation */}
            <div style={styles.recBox}>
              <p style={styles.recTitle}>AI Recommendation</p>
              <p style={styles.recText}>{result.recommendation}</p>
            </div>

            {/* Tips */}
            <div style={styles.tipsBox}>
              <p style={styles.recTitle}>Key factors to improve</p>
              <p style={styles.recText}>
                • Increase job satisfaction and work-life balance scores{'\n'}
                • Review monthly compensation{'\n'}
                • Consider career development opportunities
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  title: { fontSize: '22px', fontWeight: '600', margin: '0 0 4px', color: '#1a1a2e' },
  subtitle: { fontSize: '14px', color: '#888', margin: '0 0 20px' },
  layout: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '20px' },
  formCard: { background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px #0001' },
  resultCard: { background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px #0001' },
  cardTitle: { fontSize: '15px', fontWeight: '600', margin: '0 0 16px', color: '#1a1a2e' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: '4px' },
  label: { fontSize: '11px', color: '#888', fontWeight: '500', textTransform: 'uppercase' },
  input: {
    padding: '8px 12px', border: '1px solid #ddd',
    borderRadius: '6px', fontSize: '14px', outline: 'none'
  },
  btn: {
    width: '100%', padding: '12px', background: '#7c83fd',
    color: 'white', border: 'none', borderRadius: '8px',
    fontSize: '15px', fontWeight: '500', cursor: 'pointer'
  },
  gaugeWrap: { textAlign: 'center', marginBottom: '20px' },
  gaugeLabel: { fontSize: '13px', color: '#888', marginBottom: '8px' },
  gaugeBg: { background: '#f5f5f5', borderRadius: '8px', height: '12px', overflow: 'hidden' },
  gaugeFill: { height: '100%', borderRadius: '8px', transition: 'width 0.5s ease' },
  recBox: { background: '#f9f9f9', borderRadius: '8px', padding: '14px', marginBottom: '12px' },
  tipsBox: { background: '#f0f4ff', borderRadius: '8px', padding: '14px' },
  recTitle: { fontSize: '12px', fontWeight: '600', color: '#555', margin: '0 0 6px', textTransform: 'uppercase' },
  recText: { fontSize: '13px', color: '#444', margin: 0, lineHeight: '1.7', whiteSpace: 'pre-wrap' },
};