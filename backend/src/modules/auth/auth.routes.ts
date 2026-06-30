import { FastifyInstance } from "fastify";
import { register, login } from "./auth.controller";
import { registerSchema, loginSchema } from "./auth.schema";

export default async function authRoutes(app: FastifyInstance) {
  app.post("/register", { schema: registerSchema }, register);
  app.post("/login", { schema: loginSchema }, login);
}