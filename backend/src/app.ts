import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import websocketPlugin from "@fastify/websocket";
import dotenv from "dotenv";
import authRoutes from "./modules/auth/auth.routes";
import transactionRoutes from "./modules/transactions/transactions.routes";
import categoryRoutes from "./modules/categories/categories.routes";
import reportRoutes from "./modules/reports/reports.routes";
import clientRoutes from "./modules/clients/clients.routes";
import wsPlugin from "./plugins/websocket";

dotenv.config();

const app = Fastify({ logger: true });

app.register(cors, { 
  origin: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
});
app.register(jwt, { secret: process.env.JWT_SECRET! });
app.register(websocketPlugin);

app.register(authRoutes, { prefix: "/auth" });
app.register(transactionRoutes, { prefix: "/transactions" });
app.register(categoryRoutes, { prefix: "/categories" });
app.register(reportRoutes, { prefix: "/reports" });
app.register(clientRoutes, { prefix: "/clients" });
app.register(wsPlugin);

app.get("/", async () => {
  return { status: "ok", message: "Cuentas App API funcionando" };
});

const start = async () => {
  try {
    await app.listen({ port: 3002, host: "0.0.0.0" });
    console.log("Servidor corriendo en http://localhost:3002");
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();