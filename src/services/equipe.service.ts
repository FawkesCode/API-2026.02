import { Cargo, Prisma, PrismaClient } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const teamTechnicianData = {
  id: true,
  nome: true,
  email: true,
  cargo: true,
  equipeId: true,
} satisfies Prisma.UsuarioSelect;

export class InvalidTechnicianError extends Error {
  constructor(
    message = "Todos os tecnicoIds devem corresponder a usuários com cargo TECNICO.",
  ) {
    super(message);
    this.name = "InvalidTechnicianError";
  }
}

export class ServicoEquipe {
  constructor(private readonly db: PrismaClient = prisma) {}

  async listar() {
    return this.db.equipe.findMany({
      where: { ativo: true },
      orderBy: { nome: "asc" },
      select: { id: true, nome: true },
    });
  }

  /**
   * Replaces the team's technicians without affecting users in other roles.
   */
  async replaceTechnicians(teamId: string, technicianIds: string[]) {
    const uniqueIds = [...new Set(technicianIds)];

    return this.db.$transaction(async (transaction) => {
      const team = await transaction.equipe.findUnique({
        where: { id: teamId },
        select: { id: true },
      });
      if (!team) return null;

      const users = await transaction.usuario.findMany({
        where: { id: { in: uniqueIds } },
        select: { id: true, cargo: true },
      });

      if (
        users.length !== uniqueIds.length ||
        users.some((user) => user.cargo !== Cargo.TECNICO)
      ) {
        throw new InvalidTechnicianError();
      }

      await transaction.usuario.updateMany({
        where: {
          equipeId: teamId,
          cargo: Cargo.TECNICO,
          ...(uniqueIds.length > 0 ? { id: { notIn: uniqueIds } } : {}),
        },
        data: { equipeId: null },
      });

      if (uniqueIds.length > 0) {
        await transaction.usuario.updateMany({
          where: { id: { in: uniqueIds }, cargo: Cargo.TECNICO },
          data: { equipeId: teamId },
        });
      }

      return transaction.usuario.findMany({
        where: { equipeId: teamId, cargo: Cargo.TECNICO },
        select: teamTechnicianData,
        orderBy: { nome: "asc" },
      });
    });
  }
}

export const servicoEquipe = new ServicoEquipe();
