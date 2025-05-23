import React, { useEffect, useState } from "react";
import "./NoteList.css";
import indexedDBService from "../../services/indexedDBService";

const NotesList = ({ notes, onSelectNote, onDeleteNote, selectedNoteId }) => {
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return isNaN(date)
      ? ""
      : date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
  };

  const [queuedOperationsCount, setQueuedOperationsCount] = useState(0);

  useEffect(() => {
    return indexedDBService.subscribe("syncQueueChange", async () => {
      const syncQueue = await indexedDBService.getSyncQueue();
      setQueuedOperationsCount(syncQueue.length || 0);
    });
  }, []);

  const handleClearQueue = async () => {
    await indexedDBService.clearSyncQueue();
  };

  return (
    <div className="notes-list">
      <div className="notes-header">
        <h2>Notes</h2>
        <button onClick={() => onSelectNote(null)} className="new-note-btn">
          <span style={{ marginRight: "0.5em" }}>+</span> New Note
        </button>
        <button onClick={handleClearQueue} className="clear-queue-btn">
          Clear Queue ({queuedOperationsCount})
        </button>
      </div>

      {notes.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: "2.5rem" }}>🗒️</div>
          <p>No notes yet. Create your first note!</p>
        </div>
      ) : (
        <div className="notes-grid">
          {notes.map((note) => (
            <div
              key={note.id}
              className={`note-card${
                selectedNoteId === note.id ? " selected" : ""
              }`}
              onClick={() => onSelectNote(note)}>
              <div className="note-header">
                <h3 className="note-title">{note.title || "Untitled"}</h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteNote(note.id);
                  }}
                  className="delete-btn"
                  aria-label="Delete note">
                  <svg
                    viewBox="-2 -2 28 28"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                    <g
                      id="SVGRepo_tracerCarrier"
                      strokeLinecap="round"
                      strokeLinejoin="round"></g>
                    <g id="SVGRepo_iconCarrier">
                      {" "}
                      <path
                        d="M3 6H21M5 6V20C5 21.1046 5.89543 22 7 22H17C18.1046 22 19 21.1046 19 20V6M8 6V4C8 2.89543 8.89543 2 10 2H14C15.1046 2 16 2.89543 16 4V6"
                        stroke="#000000"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"></path>{" "}
                      <path
                        d="M14 11V17"
                        stroke="#000000"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"></path>{" "}
                      <path
                        d="M10 11V17"
                        stroke="#000000"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"></path>{" "}
                    </g>
                  </svg>
                </button>
              </div>

              <p className="note-preview">
                {note.content?.substring(0, 100)}
                {note.content?.length > 100 ? "..." : ""}
              </p>

              <div className="note-meta">
                <span className="note-date">{formatDate(note.updatedAt)}</span>
                {!note.synced ? (
                  <span className="sync-status" title="Pending sync">
                    Pending
                  </span>
                ) : (
                  <span className="sync-status synced" title="Synced">
                    Synced
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotesList;
