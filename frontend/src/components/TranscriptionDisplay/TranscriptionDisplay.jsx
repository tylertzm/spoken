import React, { useState, useRef } from 'react';
import SettingsModal from '../SettingsModal/SettingsModal';
import LanguageSelector from '../LanguageSelector/LanguageSelector';
import ConnectionStatusDisplay from '../ConnectionStatusDisplay/ConnectionStatusDisplay';
import LiveTranscriptionDisplay from '../LiveTranscriptionDisplay/LiveTranscriptionDisplay';
import TranscriptionHistory from '../TranscriptionHistory/TranscriptionHistory';
import TaskDisplay from '../TaskDisplay/TaskDisplay';
import WebSearchDisplay from '../WebSearchDisplay/WebSearchDisplay';

function TranscriptionDisplay({ 
  transcription, 
  allTranscriptions, 
  connectionStatus, 
  imageUrls, 
  onLanguageChange, 
  onReconnect,
  cleanedTranscriptions,
  historyFullScreen = false,
  onToggleHistoryFullScreen = () => {},
}) {
  const [rmsThreshold, setRmsThreshold] = useState(100);
  const [showSettings, setShowSettings] = useState(false);
  const [showWebSearch, setShowWebSearch] = useState(false);
  const [webSearchQuery, setWebSearchQuery] = useState('');
  const [liveFullScreen, setLiveFullScreen] = useState(false);
  const [showStatusIndicator, setShowStatusIndicator] = useState(true);
  const gemmaResponseRef = useRef('');

  // Handle RMS threshold changes
  const handleRmsThresholdChange = async (event) => {
    const newThreshold = parseInt(event.target.value);
    setRmsThreshold(newThreshold);

    // Send the new RMS threshold to the backend
    try {
      const response = await fetch('http://localhost:8000/rms-threshold', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ threshold: newThreshold }),
      });

      if (!response.ok) {
        console.error('Failed to update RMS threshold');
      }
    } catch (error) {
      console.error('Error updating RMS threshold:', error);
    }
  };

  // Watch for a new Gemma response that triggers web search
  const handleGemmaResponse = (response) => {
    gemmaResponseRef.current = response;
    if (
      response && response.toLowerCase().includes('search')
    ) {
      setWebSearchQuery(response);
      setShowWebSearch(true);
    }
  };

  return (
    <div className="transcription-absolute-table">
      <div className="table-row">
        <div className="table-cell" style={{ gridColumn: '1 / span 2' }}>
          <div className="control-bar">
            <LanguageSelector onLanguageChange={onLanguageChange} />
            {showStatusIndicator && (
              <ConnectionStatusDisplay connectionStatus={connectionStatus} onReconnect={onReconnect} />
            )}
          </div>
        </div>
      </div>
      <div className="table-row">
        <div className="table-cell">
          <div style={{ display: 'flex', flexDirection: 'row', width: '100%' }}>
            {/* Live Transcription Fullscreen Overlay */}
            {liveFullScreen && (
              <div className="live-fullscreen-overlay">
                <LiveTranscriptionDisplay transcription={transcription} className="live-fullscreen-content" />
                <button
                  className="fullscreen-btn live-fs-btn"
                  onClick={() => setLiveFullScreen(false)}
                  aria-label="Exit Fullscreen Live Transcription"
                  style={{ position: 'absolute', top: 20, right: 20, zIndex: 2002 }}
                >
                  ⤫
                </button>
              </div>
            )}
            {/* Normal (non-fullscreen) layout */}
            {!liveFullScreen && (
              <div style={{ flex: 1, marginRight: 8, position: 'relative' }}>
                <LiveTranscriptionDisplay transcription={transcription} />
                <button
                  className="fullscreen-btn live-fs-btn"
                  onClick={() => setLiveFullScreen(true)}
                  aria-label="Fullscreen Live Transcription"
                  style={{ position: 'absolute', top: 10, right: 10, zIndex: 20 }}
                >
                  ⛶
                </button>
              </div>
            )}
            <div style={{ flex: 1, marginLeft: 8 }}>
              <TranscriptionHistory 
                allTranscriptions={allTranscriptions} 
                imageUrls={imageUrls} 
                fullScreen={historyFullScreen}
                onToggleFullScreen={onToggleHistoryFullScreen}
                cleanedTranscriptions={cleanedTranscriptions || []} 
              />
            </div>
          </div>
        </div>
      </div>
      <div className="table-row">
        <div className="table-cell" style={{ gridColumn: '1 / span 2' }}>
          {/* Task cell spanning both columns */}
          <div className="task-cell">
            <TaskDisplay liveTranscription={transcription} onGemmaResponse={handleGemmaResponse} />
          </div>
        </div>
      </div>
      {/* Floating Settings Button */}
      <button 
        className="floating-settings-btn"
        onClick={() => setShowSettings(!showSettings)}
        aria-label="Settings"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.2573 9.77251 19.9887C9.5799 19.7201 9.31074 19.5176 9 19.405C8.69838 19.2719 8.36381 19.2322 8.03941 19.291C7.71502 19.3498 7.41568 19.5045 7.18 19.735L7.12 19.795C6.93425 19.981 6.71368 20.1285 6.47088 20.2291C6.22808 20.3298 5.96783 20.3816 5.705 20.3816C5.44217 20.3816 5.18192 20.3298 4.93912 20.2291C4.69632 20.1285 4.47575 19.981 4.29 19.795C4.10405 19.6093 3.95653 19.3887 3.85588 19.1459C3.75523 18.9031 3.70343 18.6428 3.70343 18.38C3.70343 18.1172 3.75523 17.8569 3.85588 17.6141C3.95653 17.3713 4.10405 17.1507 4.29 16.965L4.35 16.905C4.58054 16.6693 4.73519 16.37 4.794 16.0456C4.85282 15.7212 4.81312 15.3866 4.68 15.085C4.55324 14.7892 4.34276 14.537 4.07447 14.3593C3.80618 14.1816 3.49179 14.0863 3.17 14.085H3C2.46957 14.085 1.96086 13.8743 1.58579 13.4992C1.21071 13.1241 1 12.6154 1 12.085C1 11.5546 1.21071 11.0459 1.58579 10.6708C1.96086 10.2957 2.46957 10.085 3 10.085H3.09C3.42099 10.0773 3.742 9.96991 4.01062 9.7773C4.27924 9.58468 4.48171 9.31553 4.5935 9.005C4.72663 8.70338 4.76633 8.77283 4.70751 8.04442C4.64869 7.72002 4.49404 7.42068 4.2635 7.185L4.2035 7.125C4.01755 6.93925 3.87003 6.71868 3.76938 6.47588C3.66873 6.23308 3.61693 5.97283 3.61693 5.71C3.61693 5.44717 3.66873 5.18692 3.76938 4.94412C3.87003 4.70132 4.01755 4.48075 4.2035 4.295C4.38925 4.10905 4.60982 3.96153 4.85262 3.86088C5.09542 3.76023 5.35567 3.70843 5.6185 3.70843C5.88133 3.70843 6.14158 3.76023 6.38438 3.86088C6.62718 3.96153 6.84775 4.10905 7.0335 4.295L7.0935 4.355C7.32918 4.58554 7.62852 4.74019 7.95291 4.79901C8.27731 4.85783 8.61188 4.81813 8.9135 4.685H9C9.29577 4.55824 9.54802 4.34776 9.72571 4.07947C9.9034 3.81118 9.9987 3.49679 10 3.175V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73313 15.6362 4.77283 15.9606 4.71401C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92C19.4468 9.21577 19.6572 9.46802 19.9255 9.64571C20.1938 9.8234 20.5082 9.9187 20.83 9.92H21C21.5304 9.92 22.0391 10.1307 22.4142 10.5058C22.7893 10.8809 23 11.3896 23 11.92C23 12.4504 22.7893 12.9591 22.4142 13.3342C22.0391 13.7093 21.5304 13.92 21 13.92H20.91C20.5882 13.9213 20.2738 14.0166 20.0055 14.1943C19.7372 14.372 19.5267 14.6242 19.4 14.92V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Settings Modal */}
      <SettingsModal 
        showSettings={showSettings}
        onClose={() => setShowSettings(false)}
        rmsThreshold={rmsThreshold}
        onRmsThresholdChange={handleRmsThresholdChange}
        showStatusIndicator={showStatusIndicator}
        onShowStatusIndicatorToggle={() => setShowStatusIndicator(v => !v)}
      />

      {/* WebSearchDisplay as a floating popup */}
      {showWebSearch && (
        <WebSearchDisplay
          taskSummary={webSearchQuery}
          onClose={() => setShowWebSearch(false)}
        />
      )}
    </div>
  );
}

export default TranscriptionDisplay;
