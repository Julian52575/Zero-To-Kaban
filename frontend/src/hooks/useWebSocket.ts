import { useEffect } from "react";
import { connectWebSocket, onWebSocketMessage } from "../services/webSocket";

export function useWebSocket(callback: (type:string,data: unknown, eventId: string) => void) {
  useEffect(() => {
    connectWebSocket();

    const unsubscribe = onWebSocketMessage((message) => {
      callback(message.type, message.data, message.eventId);
    });

    return unsubscribe;
  }, [callback]);
}
