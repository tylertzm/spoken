import React from 'react';
import ImageDisplay from '../ImageDisplay/ImageDisplay';

function TranscriptionHistory({ allTranscriptions, imageUrls }) {
  return (
    <div className="table-cell history-cell">
      <div className="history-display">
        <div className="history-log">
          {allTranscriptions.length === 0 ? (
            <p style={{ color: '#888', fontStyle: 'italic' }}>
              History currently unavailable
            </p>
          ) : (
            allTranscriptions.map((text, index) => {
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