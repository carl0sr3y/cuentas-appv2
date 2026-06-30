import { FastifyRequest, FastifyReply } from "fastify";
import prisma from "../../db";

export const getTransactions = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const transactions = await prisma.transaction.findMany({
    include: { category: true, user: true },
    orderBy: { date: "desc" }
  });
  return reply.send(transactions);
};

export const createTransaction = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { type, amount, description, date, categoryId } = request.body as {
    type: "INCOME" | "EXPENSE";
    amount: number;
    description?: string;
    date?: string;
    categoryId: string;
  };
  const user = request.user as { id: string };

  const transaction = await prisma.transaction.create({
    data: {
      type,
      amount,
      description,
      date: date ? new Date(date) : new Date(),
      categoryId,
      userId: user.id
    },
    include: { category: true }
  });

  return reply.status(201).send(transaction);
};

export const deleteTransaction = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { id } = request.params as { id: string };

  await prisma.transaction.delete({ where: { id } });

  return reply.send({ message: "Transacción eliminada" });
};