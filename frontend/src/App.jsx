import React, { useState, useEffect, useRef } from 'react';
import TranscriptionDisplay from './components/TranscriptionDisplay/TranscriptionDisplay';
import TranscriptionHistory from './components/TranscriptionHistory/TranscriptionHistory';
import webRTCService from './WebRTCService';
import WebSearchDisplay from './components/WebSearchDisplay/WebSearchDisplay';
import GroqKeyModal from './components/GroqKeyModal';

function App() {
  const [transcription, setTranscription] = useState('');
  const [allTranscriptions, setAllTranscriptions] = useState([]);
  const [imageUrls, setImageUrls] = useState({});  // Store images by chunkId
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  const [selectedLanguage, setSelectedLanguage] = useState('en'); // New state for language
  const [cleanedTranscriptions, setCleanedTranscriptions] = useState([]); // NEW
  const [historyFullScreen, setHistoryFullScreen] = useState(false);
  const [showWebSearch, setShowWebSearch] = useState(false);
  const [taskSummary, setTaskSummary] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(true);
  const clearTranscriptionTimer = useRef(null);
  const [mainTranscribeSocket, setMainTranscribeSocket] = useState(null);
  const [finalizedIndexes, setFinalizedIndexes] = useState([]); // NEW: track finalized entries
  const [showGroqModal, setShowGroqModal] = useState(false);
  const allTranscriptionsRef = useRef(allTranscriptions);

  useEffect(() => {
    const componentId = Math.random().toString(36).substring(2, 11);
    console.log('🎯 App component mounted with ID:', componentId, 'setting up WebRTC listener');
    
    const handleWebRTCMessage = (message) => {
      console.log('[App] Received WebRTC message:', message); // Debug log
      if (message.type === 'status') {
        setConnectionStatus(message.data);
      } else if (message.type === 'images') {
        // Store images for the corresponding transcription
        setImageUrls(prev => ({
          ...prev,
          [message.chunkId]: message.images
        }));
        console.log('🖼️ Received images for chunk:', message.chunkId, message.images);
      } else if (message.type === 'history') {
        // Real-time streaming chunk for history log
        const text = message.message;
        // Only add to history if it's not the default chunk sent message
        if (!text.startsWith('audioData chunk sent')) {
          setAllTranscriptions(prev => {
            if (text && (prev.length === 0 || prev[0] !== text)) {
              return [text, ...prev];
            }
            return prev;
          });
        }
      } else if (message.type === 'summary') {
        // 3-second chunk for summary
        setCleanedTranscriptions(prev => {
          const text = message.message;
          if (text && (prev.length === 0 || prev[0] !== text)) {
            return [text, ...prev];
          }
          return prev;
        });
      } else if (message.type === 'transcription') {
        console.log('[App] Received transcription message.data:', message.data); // Debug log
        const transcriptionText = message.data;
        
        // Only update transcription if it's meaningful (not empty or "No speech detected")
        if (transcriptionText && 
            transcriptionText.trim() !== '' && 
            transcriptionText !== '[No speech detected]' &&
            !transcriptionText.includes('[Transcription error:')) {
          
          console.log('✅ Updating live transcription:', transcriptionText);
          setTranscription(transcriptionText);
          
          // Clear any existing timer
          if (clearTranscriptionTimer.current) {
            clearTimeout(clearTranscriptionTimer.current);
          }
          
          // Set a new timer to clear the transcription after 5 seconds of silence
          clearTranscriptionTimer.current = setTimeout(() => {
            console.log('⏰ Clearing transcription after timeout');
            setTranscription('');
          }, 5000);
          
          // Add to history only if it's different from the last one
          setAllTranscriptions(prev => {
            if (prev.length === 0 || prev[0] !== transcriptionText) {
              return [transcriptionText, ...prev];
            }
            return prev;
          });
        } else {
          console.log('🔇 Ignoring empty/error transcription:', transcriptionText);
          // Don't update live transcription - keep the previous one visible
        }
      }
    };

    // Add listener - WebRTC streaming will start automatically
    webRTCService.addListener(handleWebRTCMessage);

    // Setup main-transcribe WebSocket for finalized history
    const ws = new window.WebSocket('ws://localhost:8000/main-transcribe');
    ws.onopen = () => {
      console.log('[MainTranscribe] Connected to /main-transcribe');
    };
    ws.onmessage = async (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'history' && message.message) {
          // Call backend to merge live and finalized history using LLM
          try {
            const response = await fetch('http://localhost:8000/merge-history', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                live_history: allTranscriptionsRef.current,
                finalized_chunk: message.message
              })
            });
            const data = await response.json();
            if (Array.isArray(data.merged)) {
              setAllTranscriptions(data.merged);
              // Mark all merged entries as finalized for feedback (simple: all entries are finalized after merge)
              setFinalizedIndexes(data.merged.map((_, idx) => idx));
            } else {
              setAllTranscriptions([message.message, ...allTranscriptionsRef.current]);
              setFinalizedIndexes([0]);
            }
          } catch (err) {
            console.error('[MainTranscribe] Merge error:', err);
            setAllTranscriptions(prev => {
              if (prev.length === 0 || prev[0] !== message.message) {
                setFinalizedIndexes([0]);
                return [message.message, ...prev];
              }
              return prev;
            });
          }
        }
      } catch (e) {
        console.warn('[MainTranscribe] Failed to parse message', event.data);
      }
    };
    ws.onerror = (err) => {
      console.error('[MainTranscribe] WebSocket error:', err);
    };
    ws.onclose = () => {
      console.log('[MainTranscribe] WebSocket closed');
    };
    setMainTranscribeSocket(ws);

    return () => {
      console.log('🧹 App component', componentId, 'unmounting, removing WebRTC listener');
      
      // Clear any pending transcription timer
      if (clearTranscriptionTimer.current) {
        clearTimeout(clearTranscriptionTimer.current);
      }
      
      webRTCService.removeListener(handleWebRTCMessage);
      // WebRTC streaming will stop automatically when no listeners remain

      ws.close();
    };
  }, []); // Empty dependency array - only run once

  useEffect(() => {
    const key = localStorage.getItem('groq_api_key');
    if (!key) setShowGroqModal(true);
  }, []);

  const handleSetGroqKey = (key) => {
    setShowGroqModal(false);
    // Optionally: trigger any logic that needs the key
  };

  const handleLanguageChange = (language) => {
    setSelectedLanguage(language);
    console.log('🔄 Language changed to:', language);
    webRTCService.setLanguage(language); // Update WebRTC service with new language
  };

  // Reconnect handler for connection status click
  const handleReconnect = () => {
    console.log('🔄 Reconnecting WebRTC...');
    webRTCService.forceCleanup();
    setTimeout(() => {
      webRTCService.startAudioStreaming();
    }, 500); // Small delay to ensure cleanup
  };

  const handleTranscriptionToggle = () => {
    if (isTranscribing) {
      webRTCService.stopAudioStreaming();
      setIsTranscribing(false);
    } else {
      webRTCService.startAudioStreaming();
      setIsTranscribing(true);
    }
  };

  useEffect(() => {
    const cleaned = Array.from(new Set(
      allTranscriptions
        .map(t => (typeof t === 'string' ? t.trim() : ''))
        .filter(Boolean)
    ));
    setCleanedTranscriptions(cleaned);
  }, [allTranscriptions]);

  useEffect(() => {
    console.log('[WebSearch Trigger] taskSummary:', taskSummary, 'showWebSearch:', showWebSearch);
    const triggerWords = ['check', 'search', 'find', 'lookup', 'google'];
    if (
      typeof taskSummary === 'string' &&
      triggerWords.some(word => taskSummary.toLowerCase().includes(word)) &&
      !showWebSearch
    ) {
      console.log('[WebSearch Trigger] Triggering popup!');
      setShowWebSearch(true);
    }
  }, [taskSummary, showWebSearch]);

  return (
    <>
      {showGroqModal && <GroqKeyModal onSetKey={handleSetGroqKey} />}
      <div className={historyFullScreen ? 'fullscreen-history' : ''}>
        <header className="App-header">
          <TranscriptionDisplay
            transcription={transcription}
            allTranscriptions={allTranscriptions}
            connectionStatus={connectionStatus}
            imageUrls={imageUrls}
            onLanguageChange={handleLanguageChange}
            onReconnect={handleReconnect}
            cleanedTranscriptions={cleanedTranscriptions}
            historyFullScreen={historyFullScreen}
            onToggleHistoryFullScreen={() => setHistoryFullScreen(v => !v)}
            isTranscribing={isTranscribing}
            onTranscriptionToggle={handleTranscriptionToggle}
            finalizedIndexes={finalizedIndexes} // Pass to child
          />
        </header>
        {showWebSearch && (
          <WebSearchDisplay
            taskSummary={taskSummary}
            onClose={() => setShowWebSearch(false)}
          />
        )}
      </div>
    </>
  );
}

export default App;