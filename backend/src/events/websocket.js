const { WebSocketServer, WebSocket } = require("ws");

let wss;

const clients = new Map();

function initWebSocket(server) {
  wss = new WebSocketServer({
    server,
    path: "/ws",
  });

  wss.on("connection", (ws,req) => {
    const userId = req.headers["x-auth-user-id"];
    if (!userId) {
      console.log("No userId provided in WebSocket connection");
      ws.close(1008, "No userId provided");
      return;
    }
    console.log("WebSocket client connected for userId:", userId);
    addClient(userId, ws);

    ws.on("close", () => {
      console.log("WebSocket client disconnected");
      removeClient(userId);
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
    });
  });

  console.log("WebSocket server started on /ws");
}

function sendToUser(userId, message) {
  console.log(`Attempting to send message to userId: ${userId}`);
  console.log(`Current clients: ${Array.from(clients.keys()).join(", ")}`);
  const ws = clients.get(String(userId));
  if (!ws){
    console.log(`No WebSocket connection found for userId: ${userId}`);
    return;
  }
  if (ws.readyState !== WebSocket.OPEN) {
    console.log(`WebSocket connection for userId: ${userId} is not open`);
    clients.delete(String(userId));
    return;
  }
  ws.send(JSON.stringify(message));
  console.log(`Message sent to userId: ${userId}: ${JSON.stringify(message)}`);
}

function addClient(userId, ws) {
  clients.set(String(userId), ws);
  console.log(`Added WebSocket client for userId: ${userId}`);
}

function removeClient(userId) {
  clients.delete(String(userId));
  console.log(`Removed WebSocket client for userId: ${userId}`);
}

function broadcast(message) {
  const payload = JSON.stringify(message);

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

module.exports = {
  initWebSocket,
  broadcast,
  sendToUser,
};