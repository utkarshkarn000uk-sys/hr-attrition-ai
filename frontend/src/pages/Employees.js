import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = 'https://hr-attrition-ai-backend.onrender.com';

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/employees?limit=200`)
      .then(res => {
        setEmployees(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = employees.filter(emp => {
    const matchSearch = emp.Age?.toString().includes(search) ||
                        emp.MonthlyIncome?.toString().includes(search);
    const matchFilter = filter === 'All' || emp.RiskLevel === filter;
    return matchSearch && matchFilter;
  });

  const getRiskColor = (level) => {
    if (level === 'High') return { bg: '#fee2e2', color: '#ef4444' };
    if (level === 'Medium') return { bg: '#fef3c7', color: '#f59e0b' };
    return { bg: '#dcfce7', color: '#22c55e' };
  };

  if (loading) return <div style={styles.loading}>Loading employees...</div>;

  return (
    <div>
      <h1 style={styles.title}>Employee Risk Table</h1>
      <p style={styles.subtitle}>{filtered.length} employees shown</p>

      <div style={styles.controls}>
        <input
          style={styles.search}
          placeholder="Search by age or salary..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          style={styles.select}
          value={filter}
          onChange={e => setFilter(e.target.value)}
        >
          <option value="All">All Risk Levels</option>
          <option value="High">High Risk</option>
          <option value="Medium">Medium Risk</option>
          <option value="Low">Low Risk</option>
        </select>
      </div>

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHead}>
              <th style={styles.th}>#</th>
              <th style={styles.th}>Age</th>
              <th style={styles.th}>Department</th>
              <th style={styles.th}>Monthly Income</th>
              <th style={styles.th}>Job Satisfaction</th>
              <th style={styles.th}>Years at Company</th>
              <th style={styles.th}>Risk Score</th>
              <th style={styles.th}>Risk Level</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 100).map((emp, i) => {
              const risk = getRiskColor(emp.RiskLevel);
              return (
                <tr key={i} style={styles.tableRow}>
                  <td style={styles.td}>{i + 1}</td>
                  <td style={styles.td}>{emp.Age}</td>
                  <td style={styles.td}>{emp.Department}</td>
                  <td style={styles.td}>${emp.MonthlyIncome?.toLocaleString()}</td>
                  <td style={styles.td}>{emp.JobSatisfaction}/4</td>
                  <td style={styles.td}>{emp.YearsAtCompany} yrs</td>
                  <td style={styles.td}>
                    <div style={styles.riskBar}>
                      <div style={{
                        ...styles.riskFill,
                        width: `${emp.RiskScore}%`,
                        background: risk.color
                      }}/>
                      <span style={styles.riskText}>
                        {parseFloat(emp.RiskScore).toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <span style={{
                      background: risk.bg,
                      color: risk.color,
                      padding: '3px 10px',
                      borderRadius: '999px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      {emp.RiskLevel}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles = {
  title: { fontSize: '22px', fontWeight: '600', margin: '0 0 4px', color: '#1a1a2e' },
  subtitle: { fontSize: '14px', color: '#888', margin: '0 0 16px' },
  loading: { fontSize: '16px', color: '#888', padding: '40px', textAlign: 'center' },
  controls: { display: 'flex', gap: '12px', marginBottom: '16px' },
  search: {
    flex: 1, padding: '10px 14px', border: '1px solid #ddd',
    borderRadius: '8px', fontSize: '14px', outline: 'none'
  },
  select: {
    padding: '10px 14px', border: '1px solid #ddd',
    borderRadius: '8px', fontSize: '14px', outline: 'none',
    background: 'white', cursor: 'pointer'
  },
  tableWrap: {
    background: 'white', borderRadius: '10px',
    boxShadow: '0 1px 4px #0001', overflow: 'hidden'
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  tableHead: { background: '#f9f9f9' },
  th: {
    padding: '12px 14px', textAlign: 'left', fontSize: '12px',
    color: '#888', fontWeight: '500', borderBottom: '1px solid #eee'
  },
  tableRow: { borderBottom: '1px solid #f5f5f5' },
  td: { padding: '11px 14px', fontSize: '13px', color: '#333' },
  riskBar: {
    position: 'relative', background: '#f5f5f5',
    borderRadius: '4px', height: '20px', width: '100px', overflow: 'hidden'
  },
  riskFill: { position: 'absolute', top: 0, left: 0, height: '100%', opacity: 0.3 },
  riskText: {
    position: 'absolute', top: '50%', left: '50%',
    transform: 'translate(-50%,-50%)', fontSize: '11px', fontWeight: '500'
  },
};