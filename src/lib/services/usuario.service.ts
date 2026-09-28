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

  /**
   * Primeiro gestor ativo, usado pelo emissor de sessão de desenvolvimento
   * (`lib/controllers/sessao-dev.controller.ts`) quando nenhum usuário é
   * informado. Pode sair junto com ele quando o login real existir.
   */
  async buscarPrimeiroGestorAtivo() {
    return prisma.usuario.findFirst({
      where: { ativo: true, cargo: Cargo.GESTOR },
      select: { id: true, nome: true, cargo: true },
      orderBy: { criadoEm: "asc" },
    });
  }

  async buscarPorId(usuarioId: string) {
    return prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: {
        id: true,
        nome: true,
        cargo: true,
        equipe: { select: { nome: true } },
      },
    });
  }
}

export const servicoUsuario = new ServicoUsuario();