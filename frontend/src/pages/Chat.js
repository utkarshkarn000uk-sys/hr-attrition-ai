import React, { useState, useRef, useEffect } from 'react';

const API = 'http://127.0.0.1:8000';

const SUGGESTIONS = [
  "How many employees are high risk?",
  "What is the average risk score?",
  "Show me top 5 at risk employees",
  "Which department has highest risk?",
];

export default function Chat() {
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Hi! I am your HR Analytics AI assistant. Ask me anything about employee attrition risk!' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const SESSION = useRef('session-' + Date.now());

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: msg }]);
    setLoading(true);

    const aiMsg = { role: 'ai', text: '' };
    setMessages(prev => [...prev, aiMsg]);

    try {
      const resp = await fetch(`${API}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, session_id: SESSION.current })
      });

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = decoder.decode(value).split('\n');
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') break;
          try {
            const chunk = JSON.parse(data).text;
            setMessages(prev => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                text: updated[updated.length - 1].text + chunk
              };
              return updated;
            });
          } catch(e) {}
        }
      }
    } catch(e) {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'ai', text: 'Error connecting to backend. Make sure FastAPI is running!' };
        return updated;
      });
    }
    setLoading(false);
  };

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>AI HR Assistant</h1>
      <p style={styles.subtitle}>Ask questions about employee attrition in natural language</p>

      {/* Suggestion buttons */}
      <div style={styles.suggestions}>
        {SUGGESTIONS.map((s, i) => (
          <button key={i} style={styles.suggBtn} onClick={() => send(s)}>
            {s}
          </button>
        ))}
      </div>

      {/* Chat box */}
      <div style={styles.chatBox}>
        <div style={styles.messages}>
          {messages.map((msg, i) => (
            <div key={i} style={{
              ...styles.msg,
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              background: msg.role === 'user' ? '#7c83fd' : 'white',
              color: msg.role === 'user' ? 'white' : '#333',
            }}>
              {msg.text || (loading && i === messages.length - 1 ? '...' : '')}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={styles.inputRow}>
          <input
            style={styles.input}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Ask anything about your employees..."
            disabled={loading}
          />
          <button
            style={{...styles.sendBtn, opacity: loading ? 0.6 : 1}}
            onClick={() => send()}
            disabled={loading}
          >
            {loading ? '...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { maxWidth: '800px' },
  title: { fontSize: '22px', fontWeight: '600', margin: '0 0 4px', color: '#1a1a2e' },
  subtitle: { fontSize: '14px', color: '#888', margin: '0 0 16px' },
  suggestions: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' },
  suggBtn: {
    padding: '6px 14px', background: '#7c83fd22', color: '#7c83fd',
    border: '1px solid #7c83fd44', borderRadius: '999px', fontSize: '12px',
    cursor: 'pointer', transition: 'all 0.2s'
  },
  chatBox: {
    background: 'white', borderRadius: '12px',
    boxShadow: '0 1px 4px #0001', overflow: 'hidden',
    display: 'flex', flexDirection: 'column', height: '500px'
  },
  messages: {
    flex: 1, overflowY: 'auto', padding: '16px',
    display: 'flex', flexDirection: 'column', gap: '10px'
  },
  msg: {
    maxWidth: '75%', padding: '10px 14px', borderRadius: '12px',
    fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap',
    boxShadow: '0 1px 3px #0001'
  },
  inputRow: {
    display: 'flex', gap: '8px', padding: '12px',
    borderTop: '1px solid #f0f0f0'
  },
  input: {
    flex: 1, padding: '10px 14px', border: '1px solid #ddd',
    borderRadius: '8px', fontSize: '14px', outline: 'none'
  },
  sendBtn: {
    padding: '10px 20px', background: '#7c83fd', color: 'white',
    border: 'none', borderRadius: '8px', cursor: 'pointer',
    fontSize: '14px', fontWeight: '500'
  },
};