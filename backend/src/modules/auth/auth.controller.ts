import { FastifyRequest, FastifyReply } from "fastify";
import bcrypt from "bcrypt";
import prisma from "../../db";

interface RegisterBody {
  name: string;
  email: string;
  password: string;
  role?: "ADMIN" | "MANAGER" | "EMPLOYEE";
}

interface LoginBody {
  email: string;
  password: string;
}

export const register = async (
  request: FastifyRequest<{ Body: RegisterBody }>,
  reply: FastifyReply
) => {
  const { name, email, password, role } = request.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return reply.status(400).send({ error: "El email ya está registrado" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword, role: role || "EMPLOYEE" }
  });

  const token = await reply.jwtSign(
    { id: user.id, email: user.email, role: user.role },
    { expiresIn: "8h" }
  );

  return reply.status(201).send({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role }
  });
};

export const login = async (
  request: FastifyRequest<{ Body: LoginBody }>,
  reply: FastifyReply
) => {
  const { email, password } = request.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return reply.status(401).send({ error: "Credenciales incorrectas" });
  }

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return reply.status(401).send({ error: "Credenciales incorrectas" });
  }

  const token = await reply.jwtSign(
    { id: user.id, email: user.email, role: user.role },
    { expiresIn: "8h" }
  );

  return reply.send({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role }
  });
};

export const changePassword = async (
  request: FastifyRequest<{ Body: { email: string; newPassword: string } }>,
  reply: FastifyReply
) => {
  const { email, newPassword } = request.body;

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  const user = await prisma.user.update({
    where: { email },
    data: { password: hashedPassword }
  });

  return reply.send({ message: "Contraseña actualizada", email: user.email });
};