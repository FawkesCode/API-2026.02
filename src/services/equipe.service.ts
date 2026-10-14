// PREMISSA A CONFERIR: assumo que lib/prisma.ts exporta `export const prisma = ...`
// (padrão mais comum). Se o export real tiver outro nome, ajuste este import.
import { prisma } from "@/lib/prisma";
import { Cargo } from "@/lib/generated/prisma/client";
import type { UpdateTeamSchema } from "@/schemas/team.schema";

export class UnauthorizedTeamEditError extends Error {
  constructor(message = "Apenas o gestor da equipe pode editá-la.") {
    super(message);
    this.name = "UnauthorizedTeamEditError";
  }
}

export class TeamNameInUseError extends Error {
  constructor(message = "Já existe outra equipe com esse nome.") {
    super(message);
    this.name = "TeamNameInUseError";
  }
}

const updatedTeamFields = {
  id: true,
  nome: true,
  descricao: true,
  ativo: true,
} as const;

export class ServicoEquipe {
  async listar() {
    return prisma.equipe.findMany({
      where: { ativo: true },
      orderBy: { nome: "asc" },
      select: { id: true, nome: true },
    });
  }

  /**
   * Atualiza nome e/ou descrição da equipe. Só os campos enviados mudam.
   * Retorna `null` quando a equipe não existe.
   */
  async update(
    equipeId: string,
    dados: UpdateTeamSchema & { usuarioId: string },
  ) {
    return prisma.$transaction(async (tx) => {
      const equipe = await tx.equipe.findUnique({ where: { id: equipeId } });
      if (!equipe) return null;

      const gestor = await tx.usuario.findUnique({
        where: { id: dados.usuarioId },
      });
      if (
        !gestor?.ativo ||
        gestor.cargo !== Cargo.GESTOR ||
        gestor.equipeId !== equipeId
      ) {
        throw new UnauthorizedTeamEditError();
      }

      if (dados.nome !== undefined) {
        const homonima = await tx.equipe.findFirst({
          where: { nome: dados.nome, id: { not: equipeId } },
          select: { id: true },
        });
        if (homonima) throw new TeamNameInUseError();
      }

      return tx.equipe.update({
        where: { id: equipeId },
        data: {
          ...(dados.nome !== undefined ? { nome: dados.nome } : {}),
          ...(dados.descricao !== undefined
            ? { descricao: dados.descricao }
            : {}),
        },
        select: updatedTeamFields,
      });
    });
  }
}

export const servicoEquipe = new ServicoEquipe();
