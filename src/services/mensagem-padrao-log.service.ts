import { prisma } from "@/lib/prisma";
import type { PrismaClient } from "@/lib/generated/prisma/client";
import type { CriarMensagemPadraoLogSchema } from "@/schemas/mensagem-padrao-log.schema";

export class ServicoMensagemPadraoLog {
  constructor(private readonly db: PrismaClient = prisma) {}

  async listar(usuarioId: string) {
    return this.db.mensagemPadraoLog.findMany({
      where: { usuarioId },
      select: { id: true, mensagem: true, criadoEm: true, atualizadoEm: true },
      orderBy: [{ criadoEm: "desc" }, { id: "desc" }],
    });
  }

  async criar(usuarioId: string, dados: CriarMensagemPadraoLogSchema) {
    return this.db.mensagemPadraoLog.create({
      data: { usuarioId, mensagem: dados.mensagem },
      select: { id: true, mensagem: true, criadoEm: true, atualizadoEm: true },
    });
  }
}

export const servicoMensagemPadraoLog = new ServicoMensagemPadraoLog();
