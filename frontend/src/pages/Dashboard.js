import React, { useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell,
         XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';

const API = 'const API = 'https://hr-attrition-ai-backend.onrender.com';
const COLORS = ['#ef4444', '#f97316', '#22c55e'];

function StatCard({ title, value, subtitle, color }) {
  return (
    <div style={{...styles.card, borderTop: `4px solid ${color}`}}>
      <p style={styles.cardTitle}>{title}</p>
      <p style={{...styles.cardValue, color}}>{value}</p>
      <p style={styles.cardSub}>{subtitle}</p>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/stats`),
      axios.get(`${API}/employees?limit=200`)
    ]).then(([statsRes, empRes]) => {
      setStats(statsRes.data);
      setEmployees(empRes.data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  if (loading) return <div style={styles.loading}>Loading dashboard...</div>;
  if (!stats) return <div style={styles.loading}>Error loading data. Is backend running?</div>;

  // Department attrition data for bar chart
  const deptMap = {};
  employees.forEach(emp => {
    const dept = emp.Department;
    if (!deptMap[dept]) deptMap[dept] = { total: 0, risk: 0 };
    deptMap[dept].total++;
    deptMap[dept].risk += emp.RiskScore;
  });
  const deptData = Object.entries(deptMap).map(([dept, val]) => ({
    department: `Dept ${dept}`,
    avgRisk: Math.round(val.risk / val.total)
  }));

  // Risk level pie chart data
  const riskData = [
    { name: 'High Risk', value: stats.high_risk_count },
    { name: 'Medium Risk', value: Math.round(employees.length * 0.4) },
    { name: 'Low Risk', value: employees.length - stats.high_risk_count - Math.round(employees.length * 0.4) },
  ];

  return (
    <div>
      <h1 style={styles.title}>HR Dashboard</h1>
      <p style={styles.subtitle}>Employee Attrition Risk Overview</p>

      {/* Stat cards */}
      <div style={styles.cardGrid}>
        <StatCard
          title="Total Employees"
          value={stats.total_employees}
          subtitle="In dataset"
          color="#7c83fd"
        />
        <StatCard
          title="Attrition Rate"
          value={`${stats.attrition_rate}%`}
          subtitle="Historical rate"
          color="#ef4444"
        />
        <StatCard
          title="High Risk"
          value={stats.high_risk_count}
          subtitle="Employees at risk"
          color="#f97316"
        />
        <StatCard
          title="Avg Satisfaction"
          value={`${stats.avg_satisfaction}/4`}
          subtitle="Satisfaction score"
          color="#22c55e"
        />
      </div>

      {/* Charts */}
      <div style={styles.chartGrid}>
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Avg Risk Score by Department</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={deptData}>
              <XAxis dataKey="department" />
              <YAxis domain={[0,100]} />
              <Tooltip />
              <Bar dataKey="avgRisk" fill="#7c83fd" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Risk Level Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={riskData} cx="50%" cy="50%"
                   outerRadius={90} dataKey="value" label>
                {riskData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top at risk employees */}
      <div style={styles.chartCard}>
        <h3 style={styles.chartTitle}>Top 5 At-Risk Employees</h3>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHead}>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Age</th>
              <th style={styles.th}>Department</th>
              <th style={styles.th}>Monthly Income</th>
              <th style={styles.th}>Risk Score</th>
            </tr>
          </thead>
          <tbody>
            {employees
              .sort((a,b) => b.RiskScore - a.RiskScore)
              .slice(0,5)
              .map((emp, i) => (
                <tr key={i} style={styles.tableRow}>
                  <td style={styles.td}>{i+1}</td>
                  <td style={styles.td}>{emp.Age}</td>
                  <td style={styles.td}>{emp.Department}</td>
                  <td style={styles.td}>${emp.MonthlyIncome?.toLocaleString()}</td>
                  <td style={styles.td}>
                    <span style={{
                      background: '#ef444422',
                      color: '#ef4444',
                      padding: '2px 8px',
                      borderRadius: '999px',
                      fontWeight: '500'
                    }}>
                      {parseFloat(emp.RiskScore).toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles = {
  title: { fontSize: '22px', fontWeight: '600', margin: '0 0 4px', color: '#1a1a2e' },
  subtitle: { fontSize: '14px', color: '#888', margin: '0 0 20px' },
  loading: { fontSize: '16px', color: '#888', padding: '40px', textAlign: 'center' },
  cardGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '20px' },
  card: { background: 'white', borderRadius: '10px', padding: '16px', boxShadow: '0 1px 4px #0001' },
  cardTitle: { fontSize: '12px', color: '#888', margin: '0 0 6px', textTransform: 'uppercase' },
  cardValue: { fontSize: '28px', fontWeight: '600', margin: '0 0 4px' },
  cardSub: { fontSize: '12px', color: '#aaa', margin: 0 },
  chartGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginBottom: '20px' },
  chartCard: { background: 'white', borderRadius: '10px', padding: '16px', boxShadow: '0 1px 4px #0001' },
  chartTitle: { fontSize: '14px', fontWeight: '500', margin: '0 0 12px', color: '#333' },
  table: { width: '100%', borderCollapse: 'collapse' },
  tableHead: { background: '#f9f9f9' },
  th: { padding: '10px 12px', textAlign: 'left', fontSize: '12px', color: '#888', fontWeight: '500', borderBottom: '1px solid #eee' },
  tableRow: { borderBottom: '1px solid #f5f5f5' },
  td: { padding: '10px 12px', fontSize: '13px', color: '#333' },
};