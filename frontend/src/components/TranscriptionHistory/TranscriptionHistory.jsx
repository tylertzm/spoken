import React, { useState } from 'react';
import ImageDisplay from '../ImageDisplay/ImageDisplay';

function TranscriptionHistory({ allTranscriptions, imageUrls, fullScreen, onToggleFullScreen, onEditTranscription }) {
  // Provide a default no-op function if onToggleFullScreen is not passed
  const toggleFullScreen = typeof onToggleFullScreen === 'function' ? onToggleFullScreen : () => {};
  // Provide a default no-op for edit callback
  const editTranscription = typeof onEditTranscription === 'function' ? onEditTranscription : (idx, newText) => {};

  const [editingIndex, setEditingIndex] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [localTranscriptions, setLocalTranscriptions] = useState(Array.from(new Set(allTranscriptions)));

  React.useEffect(() => {
    setLocalTranscriptions(Array.from(new Set(allTranscriptions)));
  }, [allTranscriptions]);

  // Prevent click from bubbling to parent elements
  const handleButtonClick = (e) => {
    e.stopPropagation();
    toggleFullScreen();
  };

  const handleEditClick = (idx) => {
    setEditingIndex(idx);
    setEditValue(localTranscriptions[idx]);
  };

  const handleEditChange = (e) => {
    setEditValue(e.target.value);
  };

  const handleEditSave = (idx) => {
    const updated = [...localTranscriptions];
    updated[idx] = editValue;
    setLocalTranscriptions(updated);
    setEditingIndex(null);
    editTranscription(idx, editValue);
  };

  const handleEditCancel = () => {
    setEditingIndex(null);
    setEditValue('');
  };

  return (
    <div className="table-cell history-cell" style={{ position: 'relative' }}>
      <div className="history-display">
        <div
          className={fullScreen ? 'fullscreen-history-log glassy-fade' : 'history-log'}
          style={fullScreen
            ? {
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                maxWidth: '100vw',
                maxHeight: '100vh',
                zIndex: 1000,
                alignItems: 'flex-start',
                textAlign: 'left',
                overflowY: 'auto',
                padding: '32px',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                background: 'rgba(0,0,0,0.92)',
              }
            : { position: 'relative' }}
        >
          <button
            onClick={handleButtonClick}
            className="fullscreen-toggle-btn"
            aria-label={fullScreen ? 'Exit Full Screen' : 'Full Screen'}
            type="button"
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              zIndex: 10,
              background: 'rgba(0,0,0,0.5)',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              padding: '6px 14px',
              cursor: 'pointer',
              fontSize: 18,
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
            }}
          >
            <span>{fullScreen ? '\u2715' : '\u26F6'}</span>
          </button>
          {localTranscriptions.length === 0 ? (
            <p style={{ color: '#888', fontStyle: 'italic' }}>
              History currently unavailable
            </p>
          ) : (
            localTranscriptions.map((text, index) => {
              const images = Array.isArray(imageUrls) && imageUrls[index] ? imageUrls[index] : undefined;
              return (
                <div key={index} className="history-item" style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative', marginBottom: 8 }}>
                  {editingIndex === index ? (
                    <>
                      <input
                        type="text"
                        value={editValue}
                        onChange={handleEditChange}
                        className="edit-input"
                        style={{
                          flex: 1,
                          minWidth: 0,
                          marginRight: 8,
                          padding: 0,
                          border: 'none',
                          background: 'transparent',
                          color: '#fff',
                          fontSize: '1em',
                          outline: 'none',
                          boxShadow: 'none',
                        }}
                        autoFocus
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleEditSave(index);
                          if (e.key === 'Escape') handleEditCancel();
                        }}
                      />
                      <button onClick={() => handleEditSave(index)} className="edit-save-btn" aria-label="Save Edit" style={{ marginRight: 4, background: 'transparent', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer' }}>Save</button>
                      <button onClick={handleEditCancel} className="edit-cancel-btn" aria-label="Cancel Edit" style={{ background: 'transparent', color: '#888', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer' }}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <span style={{ flex: 1, minWidth: 0, marginRight: 8, whiteSpace: 'pre-line', wordBreak: 'break-word' }}>{text}</span>
                      <button
                        onClick={() => handleEditClick(index)}
                        className="edit-btn"
                        aria-label="Edit Line"
                        style={{ background: 'transparent', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 18, padding: 4, display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}
                        onMouseOver={e => (e.currentTarget.style.color = '#fff')}
                        onMouseOut={e => (e.currentTarget.style.color = '#aaa')}
                        title="Edit"
                      >
                        <span role="img" aria-label="Edit">✏️</span>
                      </button>
                    </>
                  )}
                  {images && <div style={{ marginLeft: 8 }}><ImageDisplay images={images} /></div>}
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