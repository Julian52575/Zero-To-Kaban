let socket: WebSocket | null = null;

export function connectWebSocket() {
  if (socket && socket.readyState === WebSocket.OPEN) {
    return socket;
  }

  socket = new WebSocket("ws://localhost:8000/ws");

  socket.onopen = () => {
    console.log("WebSocket connected");
  };

  socket.onclose = () => {
    console.log("WebSocket disconnected");
    socket = null;
  };

  socket.onerror = (error) => {
    console.error("WebSocket error:", error);
  };


  return socket;
}

export function disconnectWebSocket() {
  if (socket) {
    socket.close();
    socket = null;
  }
}

export function onWebSocketMessage(callback: (message: any) => void) {
  if (!socket) {
    throw new Error("WebSocket is not connected");
  }

  const handler = (event: MessageEvent) => {
    const message = JSON.parse(event.data);
    callback(message);
  };

  socket.addEventListener("message", handler);

  return () => {
    socket?.removeEventListener("message", handler);
  };
}
