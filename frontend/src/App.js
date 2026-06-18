import React from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Chat from './pages/Chat';
import Predict from './pages/Predict';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div style={styles.app}>

        {/* Sidebar */}
        <div style={styles.sidebar}>
          <div style={styles.logo}>HR AttritionAI</div>
          <nav>
            <NavLink to="/" end style={({isActive}) =>
              isActive ? {...styles.link, ...styles.activeLink} : styles.link}>
              Dashboard
            </NavLink>
            <NavLink to="/employees" style={({isActive}) =>
              isActive ? {...styles.link, ...styles.activeLink} : styles.link}>
              Employees
            </NavLink>
            <NavLink to="/chat" style={({isActive}) =>
              isActive ? {...styles.link, ...styles.activeLink} : styles.link}>
              AI Chatbot
            </NavLink>
            <NavLink to="/predict" style={({isActive}) =>
              isActive ? {...styles.link, ...styles.activeLink} : styles.link}>
              Predict Risk
            </NavLink>
          </nav>
        </div>

        {/* Main content */}
        <div style={styles.main}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/employees" element={<Employees />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/predict" element={<Predict />} />
          </Routes>
        </div>

      </div>
    </BrowserRouter>
  );
}

const styles = {
  app: {
    display: 'flex',
    minHeight: '100vh',
    fontFamily: 'sans-serif',
    background: '#f5f5f5',
  },
  sidebar: {
    width: '220px',
    background: '#1a1a2e',
    color: 'white',
    padding: '24px 0',
    flexShrink: 0,
    minHeight: '100vh',
  },
  logo: {
    fontSize: '18px',
    fontWeight: '600',
    padding: '0 24px 24px',
    borderBottom: '1px solid #333',
    marginBottom: '16px',
    color: '#7c83fd',
  },
  link: {
    display: 'block',
    padding: '12px 24px',
    color: '#aaa',
    textDecoration: 'none',
    fontSize: '14px',
    transition: 'all 0.2s',
  },
  activeLink: {
    color: 'white',
    background: '#7c83fd22',
    borderLeft: '3px solid #7c83fd',
  },
  main: {
    flex: 1,
    padding: '24px',
    overflowY: 'auto',
  },
};

export default App;