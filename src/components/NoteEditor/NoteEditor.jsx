import React, { useState, useEffect } from "react";
import "./NoteEditor.css";
import MDEditor from "@uiw/react-md-editor";

const NoteEditor = ({ note, onSave, onCancel }) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    if (note) {
      setTitle(note.title || "");
      setContent(note.content || "");
    }
  }, [note]);

  const handleSave = () => {
    if (title.trim() || content.trim()) {
      onSave({
        ...(note || {}),
        title: title.trim(),
        content: content.trim(),
      });
    }
  };

  const handleKeyDown = (e) => {
    if (e.ctrlKey && e.key === "s") {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <div className="note-editor" onKeyDown={handleKeyDown}>
      <div className="editor-header">
        <input
          type="text"
          placeholder="Note title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="title-input"
        />
        <div className="editor-actions">
          <button onClick={handleSave} className="save-btn">
            Save
          </button>
          <button onClick={onCancel} className="cancel-btn">
            Cancel
          </button>
        </div>
      </div>

      <div className="markdown-editor-container">
        <MDEditor
          value={content}
          onChange={(v) => setContent(v)}
          className="markdown-editor"
          data-color-mode="light"
        />
      </div>
      {!note?.synced && <div className="sync-indicator">Pending sync...</div>}
    </div>
  );
};

export default NoteEditor;
