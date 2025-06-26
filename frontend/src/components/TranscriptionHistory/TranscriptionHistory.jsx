import React from 'react';
import ImageDisplay from '../ImageDisplay/ImageDisplay';

function TranscriptionHistory({ allTranscriptions, imageUrls }) {
  const uniqueTranscriptions = Array.from(new Set(allTranscriptions));

  return (
    <div className="table-cell history-cell">
      <div className="history-display">
        <div className="history-log">
          {uniqueTranscriptions.length === 0 ? (
            <p style={{ color: '#888', fontStyle: 'italic' }}>
              History currently unavailable
            </p>
          ) : (
            uniqueTranscriptions.map((text, index) => {
              const images = imageUrls[index];
              return (
                <div key={index} className="history-item">
                  <p>{text}</p>
                  {images && <ImageDisplay images={images} />}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default TranscriptionHistory;