import React, { useEffect, useRef } from 'react';

function LiveTranscriptionDisplay({ transcription }) {
  const liveTextRef = useRef(null);

  useEffect(() => {
    const adjustFontSize = () => {
      const textElement = liveTextRef.current;
      if (!textElement) return;

      const container = textElement.parentElement;
      if (!container) return;

      // Reset font size to default first
      textElement.style.fontSize = '';
      
      // Get the computed styles
      const containerHeight = container.clientHeight - 40; // Account for padding
      const containerWidth = container.clientWidth - 40; // Account for padding
      
      // Check if text overflows
      let fontSize = parseFloat(window.getComputedStyle(textElement).fontSize);
      const maxFontSize = fontSize; // Store original size as max
      
      // Reduce font size until text fits
      while ((textElement.scrollHeight > containerHeight || textElement.scrollWidth > containerWidth) && fontSize > 12) {
        fontSize -= 2;
        textElement.style.fontSize = `${fontSize}px`;
      }
      
      // Don't exceed the maximum font size
      if (fontSize > maxFontSize) {
        textElement.style.fontSize = `${maxFontSize}px`;
      }
    };

    // Adjust on text change
    if (transcription) {
      adjustFontSize();
    }

    // Adjust on window resize
    window.addEventListener('resize', adjustFontSize);
    return () => window.removeEventListener('resize', adjustFontSize);
  }, [transcription]);

  return (
    <div className="transcription-cell">
      <div className="transcription-display">
        <p ref={liveTextRef} className="live-text">
          {transcription || 'Waiting for speech...'}
        </p>
        <div style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
          Debug: "{transcription}" | Length: {transcription?.length || 0}
        </div>
      </div>
    </div>
  );
}

export default LiveTranscriptionDisplay; 