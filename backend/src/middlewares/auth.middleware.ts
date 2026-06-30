import { FastifyRequest, FastifyReply } from "fastify";

export const authenticate = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.status(401).send({ error: "No autorizado, token inválido" });
  }
};

export const authorize = (...roles: string[]) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { role: string };
    if (!roles.includes(user.role)) {
      reply.status(403).send({ error: "No tienes permiso para esto" });
    }
  };
};