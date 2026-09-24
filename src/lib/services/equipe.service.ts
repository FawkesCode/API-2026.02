// PREMISSA A CONFERIR: assumo que lib/prisma.ts exporta `export const prisma = ...`
// (padrão mais comum). Se o export real tiver outro nome, ajuste este import.
import { prisma } from "@/lib/prisma";

export class ServicoEquipe {
  async listar() {
    return prisma.equipe.findMany({
      where: { ativo: true },
      orderBy: { nome: "asc" },
      select: { id: true, nome: true },
    });
  }
}

export const servicoEquipe = new ServicoEquipe();
