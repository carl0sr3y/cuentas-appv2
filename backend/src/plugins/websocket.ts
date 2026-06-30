import { FastifyInstance } from "fastify";

const clients = new Set<any>();

export const broadcastNotification = (message: object) => {
  const data = JSON.stringify(message);
  clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(data);
    }
  });
};

export default async function websocketPlugin(app: FastifyInstance) {
  app.get("/ws", { websocket: true }, (socket) => {
    clients.add(socket);

    socket.on("close", () => {
      clients.delete(socket);
    });
  });
}