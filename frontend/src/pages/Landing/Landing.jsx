import React, { useEffect } from 'react';
import './Landing.css'; // Import the styles

function Landing() {
  // No fade-in effect needed
  useEffect(() => {}, []);

  return (
    <div className="landing-body">
      <div className="content-overlay">
        <h1 className="text-5xl font-bold mb-4">Speak Now</h1>
        <p className="text-xl text-gray-300">Real-time Transcription with AI</p>
        <a
          href="/transcribe"
          className="start-button"
          onClick={(e) => {
            e.preventDefault();
            document.querySelector('main').classList.add('fade-out');
            setTimeout(() => {
              window.location.href = '/transcribe';
            }, 300); // Match the fade-out duration
          }}
        >
          Start Transcribing
        </a>       
      </div>

      <div className="arc-container">
        <div className="arc-gradient"></div>
      </div>
    </div>
  );
}

export default Landing;
