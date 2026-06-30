import { FastifyInstance } from "fastify";
import {
  getTransactions,
  createTransaction,
  deleteTransaction
} from "./transactions.controller";
import { authenticate, authorize } from "../../middlewares/auth.middleware";

export default async function transactionRoutes(app: FastifyInstance) {
  app.get(
    "/",
    { preHandler: [authenticate, authorize("ADMIN", "MANAGER")] },
    getTransactions
  );

  app.post(
    "/",
    { preHandler: [authenticate] },
    createTransaction
  );

  app.delete(
    "/:id",
    { preHandler: [authenticate, authorize("ADMIN")] },
    deleteTransaction
  );
}