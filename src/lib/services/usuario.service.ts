import { prisma } from "@/lib/prisma";
import { Cargo } from "@/lib/generated/prisma/client";

export class ServicoUsuario {
  /**
   * Lista usuários ativos com apenas id/nome, opcionalmente filtrando por
   * cargo (ex: `?cargo=GESTOR` para o dropdown de gestor no cadastro de
   * projeto). Sem `cargo`, retorna todos os usuários ativos.
   */
  async listarParaSelecao(cargo?: Cargo) {
    return prisma.usuario.findMany({
      where: { ativo: true, ...(cargo ? { cargo } : {}) },
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    });
  }
}

export const servicoUsuario = new ServicoUsuario();