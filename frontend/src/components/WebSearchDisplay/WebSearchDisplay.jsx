import React, { useEffect, useState } from 'react';

function WebSearchDisplay({ taskSummary }) {
  const [searchResult, setSearchResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!taskSummary) return;
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
        // Refine extraction: strip HTML tags, decode entities, trim whitespace
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = answer;
        answer = tempDiv.textContent || tempDiv.innerText || '';
        answer = answer.replace(/\s+/g, ' ').trim();
        setSearchResult(answer);
        setLoading(false);
      })
      .catch(err => {
        setError('Web search failed.');
        setLoading(false);
      });
  }, [taskSummary]);

  return (
    <div className="websearch-glass websearch">
      <div className="websearch-title">Web Search</div>
      {loading && <div className="websearch-loading">Searching...</div>}
      {error && <div className="websearch-error">{error}</div>}
      {!loading && !error && (
        <div className="websearch-result">{searchResult}</div>
      )}
    </div>
  );
}

export default WebSearchDisplay;
