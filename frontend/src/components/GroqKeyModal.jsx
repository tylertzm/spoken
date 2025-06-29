import React, { useState } from 'react';

const MODAL_STYLE = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  background: 'rgba(0,0,0,0.7)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 3000,
};

const BOX_STYLE = {
  background: '#fff',
  borderRadius: '16px',
  padding: '2rem',
  minWidth: 320,
  maxWidth: '90vw',
  boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
};

export default function GroqKeyModal({ onSetKey }) {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const resp = await fetch('http://localhost:8000/set-groq-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groq_api_key: key }),
      });
      if (!resp.ok) {
        const data = await resp.json();
        setError(data.detail || 'Invalid key');
        setLoading(false);
        return;
      }
      localStorage.setItem('groq_api_key', key);
      setLoading(false);
      onSetKey(key);
    } catch (err) {
      setError('Network error');
      setLoading(false);
    }
  };

  return (
    <div style={MODAL_STYLE}>
      <form style={BOX_STYLE} onSubmit={handleSubmit}>
        <h2 style={{ color: '#111', marginBottom: 16 }}>Enter your Groq API Key</h2>
        <input
          type="password"
          value={key}
          onChange={e => setKey(e.target.value)}
          placeholder="sk-..."
          style={{
            width: '100%',
            padding: '0.7rem',
            borderRadius: 8,
            border: '1px solid #ccc',
            fontSize: '1rem',
            marginBottom: 12,
          }}
          required
        />
        <button
          type="submit"
          disabled={loading || !key}
          style={{
            background: '#111',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '0.7rem 2rem',
            fontSize: '1rem',
            cursor: 'pointer',
            marginBottom: 8,
          }}
        >
          {loading ? 'Validating...' : 'Save Key'}
        </button>
        {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
        <div style={{ fontSize: 13, color: '#666', marginTop: 16, textAlign: 'center' }}>
          Your key is only stored in your browser and sent securely to the backend for validation.
        </div>
      </form>
    </div>
  );
}
