import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { Cargo } from "@/lib/generated/prisma/client";

const dadosUsuarioAtual = {
  id: true,
  nome: true,
  email: true,
  cargo: true,
  ativo: true,
  equipeId: true,
  equipe: { select: { nome: true } },
} as const;

const createdUserData = {
  id: true,
  nome: true,
  email: true,
  cargo: true,
  ativo: true,
  senhaProvisoria: true,
  equipeId: true,
  criadoEm: true,
  atualizadoEm: true,
} as const;

export class ServicoUsuario {
  /**
   * Lista usuários ativos com apenas id/nome, opcionalmente filtrando por
   * cargo (ex: `?cargo=GESTOR` para o dropdown de gestor no cadastro de
   * projeto). Sem `cargo`, retorna todos os usuários ativos.
   */

  async listarTecnicosParaEquipe(equipeId: string) {
    return prisma.usuario.findMany({
      where: {
        ativo: true,
        cargo: Cargo.TECNICO,
        OR: [{ equipeId: null }, { equipeId }],
      },
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    });
  }

  async listarParaSelecao(cargo?: Cargo) {
    return prisma.usuario.findMany({
      where: { ativo: true, ...(cargo ? { cargo } : {}) },
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    });
  }

  async createUser(data: {
    nome: string;
    email: string;
    cargo: Cargo;
    password: string;
  }) {
    const { password, ...userData } = data;

    return prisma.usuario.create({
      data: {
        ...userData,
        senhaHash: await hash(password, 12),
        senhaProvisoria: true,
        equipeId: null,
      },
      select: createdUserData,
    });
  }

  async buscarPorEmail(email: string) {
    return prisma.usuario.findUnique({
      where: { email },
      select: dadosUsuarioAtual,
    });
  }

  async buscarPorId(usuarioId: string) {
    return prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: dadosUsuarioAtual,
    });
  }
}

export const servicoUsuario = new ServicoUsuario();
