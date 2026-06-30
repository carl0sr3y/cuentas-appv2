import { FastifyInstance } from "fastify";
import {
    getClients,
    createClient,
    deleteClient,
    toggleFavorite,
    getClientById,
    addClientTransaction,
    deleteClientTransaction
} from "./clients.controller";
import { authenticate, authorize } from "../../middlewares/auth.middleware";


export default async function clientRoutes(app: FastifyInstance) {
    app.get(
        "/",
        { preHandler: [authenticate] },
        getClients
    );

    app.post(
        "/",
        { preHandler: [authenticate, authorize("ADMIN", "MANAGER")] },
        createClient
    );

    app.delete(
        "/:id",
        { preHandler: [authenticate, authorize("ADMIN")] },
        deleteClient
    );

    app.patch(
        "/:id/favorite",
        { preHandler: [authenticate] },
        toggleFavorite
    );

    app.get(
        "/:id",
        { preHandler: [authenticate] },
        getClientById
    );

    app.post(
        "/:id/transactions",
        { preHandler: [authenticate] },
        addClientTransaction
    );

    app.delete(
        "/:id/transactions/:transactionId",
        { preHandler: [authenticate, authorize("ADMIN")] },
        deleteClientTransaction
    );
}