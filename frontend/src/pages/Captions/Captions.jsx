import React from 'react';
import './Captions.css';

const Captions = ({ summary }) => {
  return (
    <div className="captions-container">
      <div className="captions-text">
        {summary ? summary : 'No summary available.'}
      </div>
    </div>
  );
};

export default Captions;