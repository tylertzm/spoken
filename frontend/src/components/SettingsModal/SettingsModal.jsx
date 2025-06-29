import React from 'react';

function SettingsModal({ 
  showSettings, 
  onClose, 
  rmsThreshold, 
  onRmsThresholdChange, 
  showStatusIndicator,
  onShowStatusIndicatorToggle
}) {
  if (!showSettings) return null;

  return (
    <div className="settings-modal-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h3>Settings</h3>
          <button 
            className="close-btn"
            onClick={onClose}
            aria-label="Close settings"
          >
            ×
          </button>
        </div>
        <div className="settings-content">
          <div className="setting-group">
            <label htmlFor="rms-slider" className="setting-label">
              RMS Threshold: {rmsThreshold}
            </label>
            <p className="setting-description">
              Minimum audio level required for transcription (filters out quiet background noise)
            </p>
            <input
              id="rms-slider"
              type="range"
              min="0"
              max="500"
              value={rmsThreshold}
              onChange={onRmsThresholdChange}
              className="rms-slider"
            />
            <div className="slider-range">
              <span>0 (Most Sensitive)</span>
              <span>500 (Least Sensitive)</span>
            </div>
          </div>
          <div className="setting-group">
            <label className="setting-label" htmlFor="show-status-indicator">
              Show Status/Notification
            </label>
            <p className="setting-description">
              Toggle the floating connection status and notification display in the top right corner.
            </p>
            <input
              type="checkbox"
              id="show-status-indicator"
              checked={typeof showStatusIndicator !== 'undefined' ? showStatusIndicator : true}
              onChange={onShowStatusIndicatorToggle}
              style={{ marginRight: 8 }}
            />
            <label htmlFor="show-status-indicator">Show status/notification</label>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsModal;