import { FastifyRequest, FastifyReply } from "fastify";
import prisma from "../../db";

export const getSummary = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const transactions = await prisma.transaction.findMany({
    include: { category: true }
  });

  const totalIncome = transactions
    .filter(t => t.type === "INCOME")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpense = transactions
    .filter(t => t.type === "EXPENSE")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const balance = totalIncome - totalExpense;

  const byCategory = transactions.reduce((acc: any, t) => {
    const key = t.category.name;
    if (!acc[key]) acc[key] = { total: 0, type: t.type };
    acc[key].total += Number(t.amount);
    return acc;
  }, {});

  return reply.send({
    totalIncome,
    totalExpense,
    balance,
    byCategory
  });
};