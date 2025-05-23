import { openDB } from "idb";

const DB_NAME = "OfflineNotesDB";
const DB_VERSION = 1;
const NOTES_STORE = "notes";
const SYNC_QUEUE_STORE = "syncQueue";

class IndexedDBService {
  constructor() {
    this.db = null;
    this.ready = this.init();
    this.listenersMap = new Map();
  }

  async init() {
    this.db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Notes store
        if (!db.objectStoreNames.contains(NOTES_STORE)) {
          const notesStore = db.createObjectStore(NOTES_STORE, {
            keyPath: "id",
          });
          notesStore.createIndex("updatedAt", "updatedAt");
        }
        // Sync queue store
        if (!db.objectStoreNames.contains(SYNC_QUEUE_STORE)) {
          const syncStore = db.createObjectStore(SYNC_QUEUE_STORE, {
            keyPath: "id",
            autoIncrement: true,
          });
          syncStore.createIndex("timestamp", "timestamp");
        }
      },
    });
  }

  async getAllNotes() {
    await this.ready;
    const tx = this.db.transaction(NOTES_STORE, "readonly");
    return await tx.objectStore(NOTES_STORE).getAll();
  }

  async getNote(id) {
    await this.ready;
    const tx = this.db.transaction(NOTES_STORE, "readonly");
    return await tx.objectStore(NOTES_STORE).get(id);
  }

  async saveNote(note) {
    await this.ready;
    // Check if note exists in DB
    let isNew = false;
    if (note.id) {
      const existing = await this.getNote(note.id);
      isNew = !existing;
    } else {
      isNew = true;
    }

    const noteWithTimestamp = {
      ...note,
      updatedAt: new Date().toISOString(),
      // Only set synced to false for new notes or when explicitly marked
      synced: isNew === false && note.synced !== false,
    };

    const tx = this.db.transaction(NOTES_STORE, "readwrite");
    await tx.objectStore(NOTES_STORE).put(noteWithTimestamp);

    // Only add to sync queue if synced is false
    if (!noteWithTimestamp.synced) {
      await this.addToSyncQueue(
        isNew ? "CREATE_NOTE" : "UPDATE_NOTE",
        noteWithTimestamp
      );
    }
    return noteWithTimestamp;
  }

  async deleteNote(id) {
    await this.ready;
    const tx = this.db.transaction(NOTES_STORE, "readwrite");
    await tx.objectStore(NOTES_STORE).delete(id);
    // Add to sync queue
    await this.addToSyncQueue("DELETE_NOTE", { id });
  }

  async addToSyncQueue(operation, data) {
    await this.ready;
    const tx = this.db.transaction(SYNC_QUEUE_STORE, "readwrite");
    await tx.objectStore(SYNC_QUEUE_STORE).add({
      operation,
      data,
      timestamp: new Date().toISOString(),
    });
    this.emitEvent("syncQueueChange");
  }

  async getSyncQueue() {
    await this.ready;
    const tx = this.db.transaction(SYNC_QUEUE_STORE, "readonly");
    const result = await tx.objectStore(SYNC_QUEUE_STORE).getAll();
    return result;
  }

  async clearSyncQueue() {
    await this.ready;
    const tx = this.db.transaction(SYNC_QUEUE_STORE, "readwrite");
    await tx.objectStore(SYNC_QUEUE_STORE).clear();
    this.emitEvent("syncQueueChange");
  }

  subscribe(event, listener) {
    const listeners = this.listenersMap.get(event) || new Set();

    if (!listeners.has(listener)) {
      listeners.add(listener);
    }

    this.listenersMap.set(event, listeners);

    return () => {
      this.listenersMap.get(event)?.delete(listener);
    };
  }

  emitEvent(event, ...args) {
    const listeners = this.listenersMap.get(event) || new Set();
    listeners.values().forEach((listener) => listener(...args));
  }
}

export default new IndexedDBService();
