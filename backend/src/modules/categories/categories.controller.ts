import { FastifyRequest, FastifyReply } from "fastify";
import prisma from "../../db";

interface CategoryBody {
  name: string;
  type: "INCOME" | "EXPENSE";
}

export const getCategories = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const categories = await prisma.category.findMany();
  return reply.send(categories);
};

export const createCategory = async (
  request: FastifyRequest<{ Body: CategoryBody }>,
  reply: FastifyReply
) => {
  const { name, type } = request.body;

  const category = await prisma.category.create({
    data: { name, type }
  });

  return reply.status(201).send(category);
};