import { FastifyInstance } from "fastify";
import { getCategories, createCategory } from "./categories.controller";
import { authenticate, authorize } from "../../middlewares/auth.middleware";

export default async function categoryRoutes(app: FastifyInstance) {
  app.get(
    "/",
    { preHandler: [authenticate] },
    getCategories
  );

  app.post(
    "/",
    { preHandler: [authenticate, authorize("ADMIN", "MANAGER")] },
    createCategory
  );
}