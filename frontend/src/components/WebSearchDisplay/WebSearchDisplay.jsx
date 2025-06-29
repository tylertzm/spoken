import React, { useEffect, useState } from 'react';

function WebSearchDisplay({ taskSummary, onClose }) {
  const [searchResult, setSearchResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ask, setAsk] = useState(true);

  useEffect(() => {
    setAsk(true);
    setSearchResult('');
    setError(null);
  }, [taskSummary]);

  const handleSearch = () => {
    setLoading(true);
    setError(null);
    fetch('http://localhost:8000/web-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: taskSummary })
    })
      .then(res => res.json())
      .then(data => {
        let answer = data.answer || 'No answer found.';
        setSearchResult(answer);
        setLoading(false);
      })
      .catch(err => {
        setError('Web search failed.');
        setLoading(false);
      });
  };

  if (!taskSummary) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 2000,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        className="websearch-glass websearch"
        style={{
          background: 'rgba(0,0,0,0.92)',
          borderRadius: '18px',
          padding: '2em',
          color: '#fff',
          boxShadow: '0 4px 32px rgba(0,0,0,0.25)',
          maxWidth: 480,
          width: '90vw',
          fontFamily: 'Inter, sans-serif',
          position: 'relative',
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: 18,
            right: 18,
            background: 'rgba(255,255,255,0.08)',
            border: 'none',
            borderRadius: '50%',
            width: 32,
            height: 32,
            color: '#fff',
            fontSize: 20,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s'
          }}
          onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
          onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
        >
          ×
        </button>
        <div className="websearch-title" style={{ fontWeight: 600, fontSize: '1.2em', marginBottom: 16 }}>
          Web Search
        </div>
        {ask ? (
          <div style={{ margin: '1em 0', display: 'flex', flexDirection: 'column', gap: '1em' }}>
            <div>Would you like to search Google for:</div>
            <div style={{ fontStyle: 'italic', margin: '0.5em 0', color: '#bbb' }}>{taskSummary}</div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => { setAsk(false); handleSearch(); }}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 20px',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  fontWeight: 500,
                  transition: 'background 0.2s',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.10)'
                }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
                onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
              >
                Yes, search
              </button>
              <button
                onClick={() => { setAsk(false); onClose(); }}
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 20px',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  fontWeight: 500,
                  opacity: 0.7,
                  transition: 'background 0.2s, opacity 0.2s'
                }}
                onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.10)'; e.currentTarget.style.opacity = 1; }}
                onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.opacity = 0.7; }}
              >
                No
              </button>
            </div>
          </div>
        ) : loading ? (
          <div className="websearch-loading">Searching...</div>
        ) : error ? (
          <div className="websearch-error">{error}</div>
        ) : (
          <div className="websearch-result">{searchResult}</div>
        )}
      </div>
    </div>
  );
}

export default WebSearchDisplay;
