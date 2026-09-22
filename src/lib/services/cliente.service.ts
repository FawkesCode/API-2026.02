import { prisma } from "@/lib/prisma";

export class ServicoCliente {

  async listarParaSelecao() {
    return prisma.cliente.findMany({
      where: { ativo: true },
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    });
  }
}

export const servicoCliente = new ServicoCliente();