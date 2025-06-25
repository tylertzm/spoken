import React from 'react';

function ConnectionStatusDisplay({ connectionStatus, onReconnect }) {
  const getStatusClass = (status) => {
    if (status.includes('Connected') || status.includes('Recording')) {
      return 'status-connected';
    } else if (status.includes('Starting') || status.includes('Connecting')) {
      return 'status-connecting';
    } else if (status.includes('Error') || status.includes('Disconnected')) {
      return 'status-error';
    }
    return 'status-default';
  };

  // Only clickable if not connected/recording
  const clickable =
    connectionStatus.includes('Error') ||
    connectionStatus.includes('Disconnected') ||
    connectionStatus.includes('Connection');

  return (
    <div className="connection-status">
      <div
        className={`status-indicator ${getStatusClass(connectionStatus)}${
          clickable ? ' status-clickable' : ''
        }`}
        onClick={clickable && onReconnect ? onReconnect : undefined}
        style={clickable ? { cursor: 'pointer' } : {}}
        aria-label={clickable ? 'Click to reconnect' : undefined}
        title={clickable ? 'Click to reconnect' : undefined}
      >
        <div className="status-dot"></div>
        <span className="status-text">{connectionStatus}</span>
      </div>
    </div>
  );
}

export default ConnectionStatusDisplay;