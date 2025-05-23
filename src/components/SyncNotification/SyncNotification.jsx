import React, { useEffect, useState } from "react";
import { subscribeToSyncStatus } from "../../services/syncService";
import "./SyncNotification.css";
import { statusText } from "../../shared/constants";

export default function SyncNotification() {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeToSyncStatus("global", (noteId, newStatus) => {
      setStatus(newStatus);
      if (newStatus === "done") {
        setTimeout(() => setStatus(null), 1800);
      }
      if (newStatus === "error") {
        setTimeout(() => setStatus(null), 3000);
      }
    });
    return unsubscribe;
  }, []);

  if (!status) return null;

  return (
    <div className={`sync-notification sync-${status}`}>
      {statusText[status]}
    </div>
  );
}
