import { FastifyRequest, FastifyReply } from "fastify";
import prisma from "../../db";
import { broadcastNotification } from "../../plugins/websocket";

export const getClients = async (request: FastifyRequest, reply: FastifyReply) => {
  const clients = await prisma.client.findMany({
    orderBy: [{ isFavorite: "desc" }, { name: "asc" }],
    include: { transactions: true }
  });

  const clientsWithBalance = clients.map((c) => {
    const balance = c.transactions.reduce((sum, t) => {
      return t.type === "INCOME" ? sum + Number(t.amount) : sum - Number(t.amount);
    }, 0);
    return { ...c, balance };
  });

  return reply.send(clientsWithBalance);
};

export const createClient = async (request: FastifyRequest, reply: FastifyReply) => {
  const { name, type, phone, email } = request.body as {
    name: string;
    type?: "PERSON" | "COMPANY";
    phone?: string;
    email?: string;
  };
  const currentUser = request.user as { id: string };

  const userRecord = await prisma.user.findUnique({ where: { id: currentUser.id } });

  const client = await prisma.client.create({
    data: { name, type: type || "PERSON", phone, email }
  });

  broadcastNotification({
    message: `${userRecord?.name} agregó al cliente ${name}`
  });

  return reply.status(201).send(client);
};

export const deleteClient = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as { id: string };
  await prisma.clientTransaction.deleteMany({ where: { clientId: id } });
  await prisma.client.delete({ where: { id } });
  return reply.send({ message: "Cliente eliminado" });
};

export const toggleFavorite = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as { id: string };
  const client = await prisma.client.findUnique({ where: { id } });
  if (!client) return reply.status(404).send({ error: "Cliente no encontrado" });

  const updated = await prisma.client.update({
    where: { id },
    data: { isFavorite: !client.isFavorite }
  });

  return reply.send(updated);
};

export const getClientById = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as { id: string };

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      transactions: {
        orderBy: { date: "desc" },
        include: { user: { select: { name: true } } }
      }
    }
  });

  if (!client) return reply.status(404).send({ error: "Cliente no encontrado" });

  const balance = client.transactions.reduce((sum, t) => {
    return t.type === "INCOME" ? sum + Number(t.amount) : sum - Number(t.amount);
  }, 0);

  return reply.send({ ...client, balance });
};

export const addClientTransaction = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as { id: string };
  const { type, amount, description } = request.body as {
    type: "INCOME" | "EXPENSE";
    amount: number;
    description?: string;
  };
  const currentUser = request.user as { id: string };

  const transaction = await prisma.clientTransaction.create({
    data: {
      type,
      amount,
      description,
      clientId: id,
      userId: currentUser.id
    },
    include: { user: { select: { name: true } } }
  });

  const client = await prisma.client.findUnique({ where: { id } });

  broadcastNotification({
    message: `${transaction.user.name} agregó un movimiento de Q${amount} en la cuenta de ${client?.name}`
  });

  return reply.status(201).send(transaction);
};

export const deleteClientTransaction = async (request: FastifyRequest, reply: FastifyReply) => {
  const { transactionId } = request.params as { transactionId: string };
  await prisma.clientTransaction.delete({ where: { id: transactionId } });
  return reply.send({ message: "Transacción eliminada" });
};