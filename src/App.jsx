import React, { useState } from "react";
import { useNotes } from "./hooks/useNotes";
import NotesList from "./components/NoteList/NoteList";
import NoteEditor from "./components/NoteEditor/NoteEditor";
import ConnectionStatus from "./components/ConnectionStatus/ConnectionStatus";
import SyncNotification from "./components/SyncNotification/SyncNotification";
import "./App.css";

function App() {
  const { notes, loading, saveNote, deleteNote } = useNotes();
  const [selectedNote, setSelectedNote] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const handleSelectNote = (note) => {
    setSelectedNote(note);
    setIsEditing(true);
  };

  const handleSaveNote = async (noteData) => {
    try {
      await saveNote(noteData);
      setIsEditing(false);
      setSelectedNote(null);
    } catch {
      alert("Failed to save note. Please try again.");
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (window.confirm("Are you sure you want to delete this note?")) {
      try {
        await deleteNote(noteId);
        if (selectedNote?.id === noteId) {
          setSelectedNote(null);
          setIsEditing(false);
        }
      } catch {
        alert("Failed to delete note. Please try again.");
      }
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSelectedNote(null);
  };

  if (loading) {
    return (
      <div className="app">
        <div className="loading">Loading your notes...</div>
      </div>
    );
  }

  return (
    <div className="app">
      <SyncNotification />
      <header className="app-header">
        <h1>Offline-First Notes App</h1>
        <ConnectionStatus />
      </header>
      <main className="app-main">
        {isEditing ? (
          <NoteEditor
            note={selectedNote}
            onSave={handleSaveNote}
            onCancel={handleCancel}
          />
        ) : (
          <NotesList
            notes={notes}
            onSelectNote={handleSelectNote}
            onDeleteNote={handleDeleteNote}
            selectedNoteId={selectedNote?.id}
          />
        )}
      </main>
    </div>
  );
}

export default App;
