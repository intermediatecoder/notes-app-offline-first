import { useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import indexedDBService from "../services/indexedDBService";
import syncService, { subscribeToSyncStatus } from "../services/syncService";

export const useNotes = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadNotes = useCallback(async () => {
    try {
      const loadedNotes = await indexedDBService.getAllNotes();
      setNotes(
        loadedNotes.sort(
          (a, b) => new Date(b.lastModified) - new Date(a.lastModified)
        )
      );
    } catch (error) {
      console.error("Failed to load notes:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    return subscribeToSyncStatus("all", (noteId, status) => {
      if (status === "done") {
        setNotes((notes) => {
          return notes.map((note) => {
            if (note.id === noteId) {
              return {
                ...note,
                synced: true,
              };
            }

            return note;
          });
        });
      }
    });
  }, []);

  const saveNote = useCallback(async (noteData) => {
    const note = {
      ...noteData,
      id: noteData.id || uuidv4(),
      synced: false,
    };

    try {
      const savedNote = await indexedDBService.saveNote(note);
      setNotes((prev) => {
        const existing = prev.findIndex((n) => n.id === note.id);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = savedNote;
          return updated.sort(
            (a, b) => new Date(b.lastModified) - new Date(a.lastModified)
          );
        }
        return [savedNote, ...prev];
      });

      if (navigator.onLine) {
        syncService.syncData();
      }

      return savedNote;
    } catch (error) {
      console.error("Failed to save note:", error);
      throw error;
    }
  }, []);

  const deleteNote = useCallback(async (id) => {
    try {
      await indexedDBService.deleteNote(id);
      setNotes((prev) => prev.filter((note) => note.id !== id));

      if (navigator.onLine) {
        syncService.syncData();
      }
    } catch (error) {
      console.error("Failed to delete note:", error);
      throw error;
    }
  }, []);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  return {
    notes,
    loading,
    saveNote,
    deleteNote,
    refreshNotes: loadNotes,
  };
};
