import { FastifyInstance } from "fastify";
import { getSummary } from "./reports.controller";
import { authenticate, authorize } from "../../middlewares/auth.middleware";

export default async function reportRoutes(app: FastifyInstance) {
  app.get(
    "/summary",
    { preHandler: [authenticate, authorize("ADMIN", "MANAGER")] },
    getSummary
  );
}