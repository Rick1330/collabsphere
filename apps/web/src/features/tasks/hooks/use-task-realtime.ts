import { useEffect, useState } from "react";

export type RealtimeStatus = "connected" | "reconnecting" | "unavailable";

/**
 * Mock realtime status. In production this would subscribe to a websocket
 * channel for `task:created`, `task:updated`, `task:moved`, etc. Here we
 * simulate a connected state with an occasional brief reconnect so the UI
 * banner can be visibly exercised.
 */
export function useTaskRealtime(workspaceId: string): RealtimeStatus {
  const [status, setStatus] = useState<RealtimeStatus>("reconnecting");

  useEffect(() => {
    setStatus("reconnecting");
    const t = window.setTimeout(() => setStatus("connected"), 600);
    return () => window.clearTimeout(t);
  }, [workspaceId]);

  return status;
}
