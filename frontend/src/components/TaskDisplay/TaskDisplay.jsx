import React, { useEffect, useState, useRef } from 'react';

function TaskDisplay({ liveTranscription, onGemmaResponse }) {
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const lastTranscriptionRef = useRef('');

  useEffect(() => {
    if (!liveTranscription || liveTranscription.trim() === '') return;
    if (liveTranscription === lastTranscriptionRef.current) return;
    lastTranscriptionRef.current = liveTranscription;

    async function getGemmaTask() {
      setLoading(true);
      setError(null);
      try {
        const prompt = `what is a suitable task in under 10 words based on the sentence(s)?  only return a task when there is one and sentences are provided, otherwise, answer with - only ${liveTranscription}`;
        const res = await fetch('http://localhost:8000/gemma-python', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt })
        });
        if (!res.ok) throw new Error('Failed to fetch Gemma response');
        const data = await res.json();
        setResponse(data.response || 'No response');
        if (onGemmaResponse) onGemmaResponse(data.response || '');
      } catch (err) {
        setError(err.message);
        if (onGemmaResponse) onGemmaResponse('');
      } finally {
        setLoading(false);
      }
    }
    getGemmaTask();
  }, [liveTranscription, onGemmaResponse]);

  return (
    <div className="task-glassbox">
      {loading ? (
        <span style={{ opacity: 0.7 }}>Loading task from Gemma...</span>
      ) : error ? (
        <span style={{ color: '#ff6b6b', opacity: 0.9 }}>Error: {error}</span>
      ) : (
        <span style={{ opacity: 0.95 }}><strong>Gemma says:</strong> {response}</span>
      )}
    </div>
  );
}

export default TaskDisplay;
