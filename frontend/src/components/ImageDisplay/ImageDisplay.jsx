import React from 'react';
import './ImageDisplay.css';

function ImageDisplay({ images }) {
    if (!images || images.length === 0) return null;

    return (
        <div className="image-grid">
            {images.map((url, index) => (
                <div key={index} className="image-item">
                    <img 
                        src={url} 
                        alt={`Generated content ${index + 1}`}
                        loading="lazy"
                        onError={(e) => {
                            e.target.style.display = 'none';
                            console.log('Failed to load image:', url);
                        }}
                    />
                </div>
            ))}
        </div>
    );
}

export default ImageDisplay;
