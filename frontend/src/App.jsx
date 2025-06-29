import React, { useState, useEffect, useRef } from 'react';
import TranscriptionDisplay from './components/TranscriptionDisplay/TranscriptionDisplay';
import TranscriptionHistory from './components/TranscriptionHistory/TranscriptionHistory';
import webRTCService from './WebRTCService';
import WebSearchDisplay from './components/WebSearchDisplay/WebSearchDisplay';

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

    return () => {
      console.log('🧹 App component', componentId, 'unmounting, removing WebRTC listener');
      
      // Clear any pending transcription timer
      if (clearTranscriptionTimer.current) {
        clearTimeout(clearTranscriptionTimer.current);
      }
      
      webRTCService.removeListener(handleWebRTCMessage);
      // WebRTC streaming will stop automatically when no listeners remain
    };
  }, []); // Empty dependency array - only run once

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

  return (
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
        />
      </header>
      {showWebSearch && (
        <WebSearchDisplay
          taskSummary={taskSummary}
          onClose={() => setShowWebSearch(false)}
        />
      )}
    </div>
  );
}

export default App;