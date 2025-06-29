import React, { useState } from 'react';
import ImageDisplay from '../ImageDisplay/ImageDisplay';
import ReactDOM from 'react-dom';

function TranscriptionHistory({ allTranscriptions, imageUrls, fullScreen, onToggleFullScreen, onEditTranscription, finalizedIndexes = [], onDeleteTranscription }) {
  // Provide a default no-op function if onToggleFullScreen is not passed
  const toggleFullScreen = typeof onToggleFullScreen === 'function' ? onToggleFullScreen : () => {};
  // Provide a default no-op for edit callback
  const editTranscription = typeof onEditTranscription === 'function' ? onEditTranscription : (idx, newText) => {};
  // Provide a default no-op for delete callback
  const deleteTranscription = typeof onDeleteTranscription === 'function' ? onDeleteTranscription : (idx) => {};

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

  const handleDelete = (idx) => {
    const updated = localTranscriptions.filter((_, i) => i !== idx);
    setLocalTranscriptions(updated);
    deleteTranscription(idx);
  };

  // Fullscreen overlay content
  const fullscreenContent = (
    <div className="history-fullscreen-overlay">
      <button
        onClick={handleButtonClick}
        className="fullscreen-btn live-fs-btn"
        aria-label="Exit Full Screen"
        type="button"
      >
        <span>&#10005;</span> {/* Unicode X for close */}
      </button>
      <div className="fullscreen-history-log glassy-fade">
        <div className="fullscreen-history-scroll">
          {localTranscriptions.length === 0 ? (
            <p className="history-empty-msg">
              History currently unavailable
            </p>
          ) : (
            localTranscriptions.map((text, index) => {
              const images = Array.isArray(imageUrls) && imageUrls[index] ? imageUrls[index] : undefined;
              const isFinalized = finalizedIndexes.includes(index);
              return (
                <div key={index} className={`history-item${isFinalized ? ' finalized' : ''}`}> 
                  {editingIndex === index ? (
                    <>
                      <input
                        type="text"
                        value={editValue}
                        onChange={handleEditChange}
                        className="edit-input"
                        autoFocus
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleEditSave(index);
                          if (e.key === 'Escape') handleEditCancel();
                        }}
                      />
                      <button onClick={() => handleEditSave(index)} className="edit-save-btn" aria-label="Save Edit">Save</button>
                      <button onClick={handleEditCancel} className="edit-cancel-btn" aria-label="Cancel Edit">Cancel</button>
                    </>
                  ) : (
                    <>
                      <span className={`history-text${isFinalized ? ' finalized' : ''}`}>{text}</span>
                      {isFinalized && <span title="Finalized" className="finalized-check">✔️</span>}
                      <button
                        onClick={() => handleEditClick(index)}
                        className="edit-btn"
                        aria-label="Edit Line"
                        title="Edit"
                      >
                        <span role="img" aria-label="Edit">✏️</span>
                      </button>
                      <button
                        onClick={() => handleDelete(index)}
                        className="edit-btn"
                        aria-label="Delete Line"
                        title="Delete"
                        style={{ color: 'red', marginLeft: 4 }}
                      >
                        <span role="img" aria-label="Delete">🗑️</span>
                      </button>
                    </>
                  )}
                  {images && <div className="history-image-wrapper"><ImageDisplay images={images} /></div>}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="table-cell history-cell" style={{ position: 'relative' }}>
      <div className="history-display">
        {!fullScreen && (
          <>
            <button
              onClick={handleButtonClick}
              className="fullscreen-btn live-fs-btn history-fs-btn"
              aria-label="Full Screen"
              type="button"
              style={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }}
            >
              <span>&#9974;</span> {/* Unicode for compass icon */}
            </button>
            <div className="history-log">
              {localTranscriptions.length === 0 ? (
                <p className="history-empty-msg">
                  History currently unavailable
                </p>
              ) : (
                localTranscriptions.map((text, index) => {
                  const images = Array.isArray(imageUrls) && imageUrls[index] ? imageUrls[index] : undefined;
                  const isFinalized = finalizedIndexes.includes(index);
                  return (
                    <div key={index} className={`history-item${isFinalized ? ' finalized' : ''}`}> 
                      {editingIndex === index ? (
                        <>
                          <input
                            type="text"
                            value={editValue}
                            onChange={handleEditChange}
                            className="edit-input"
                            autoFocus
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleEditSave(index);
                              if (e.key === 'Escape') handleEditCancel();
                            }}
                          />
                          <button onClick={() => handleEditSave(index)} className="edit-save-btn" aria-label="Save Edit">Save</button>
                          <button onClick={handleEditCancel} className="edit-cancel-btn" aria-label="Cancel Edit">Cancel</button>
                        </>
                      ) : (
                        <>
                          <span className={`history-text${isFinalized ? ' finalized' : ''}`}>{text}</span>
                          {isFinalized && <span title="Finalized" className="finalized-check">✔️</span>}
                          <button
                            onClick={() => handleEditClick(index)}
                            className="edit-btn"
                            aria-label="Edit Line"
                            title="Edit"
                          >
                            <span role="img" aria-label="Edit">✏️</span>
                          </button>
                          <button
                            onClick={() => handleDelete(index)}
                            className="edit-btn"
                            aria-label="Delete Line"
                            title="Delete"
                            style={{ color: 'red', marginLeft: 4 }}
                          >
                            <span role="img" aria-label="Delete">🗑️</span>
                          </button>
                        </>
                      )}
                      {images && <div className="history-image-wrapper"><ImageDisplay images={images} /></div>}
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
        {fullScreen && ReactDOM.createPortal(fullscreenContent, document.body)}
      </div>
    </div>
  );
}

export default TranscriptionHistory;