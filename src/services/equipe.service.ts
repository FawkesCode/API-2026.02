import { prisma } from "@/lib/prisma";
import { Cargo, Prisma } from "@/lib/generated/prisma/client";

export class ErroEquipeSemPermissao extends Error {
  constructor(message = "Apenas o gestor da equipe pode editá-la.") {
    super(message);
    this.name = "ErroEquipeSemPermissao";
  }
}

export class ErroEquipeNaoEncontrada extends Error {
  constructor(message = "Equipe não encontrada ou inativa.") {
    super(message);
    this.name = "ErroEquipeNaoEncontrada";
  }
}

export class ErroTecnicosInvalidos extends Error {
  constructor(message = "Um ou mais técnicos selecionados são inválidos.") {
    super(message);
    this.name = "ErroTecnicosInvalidos";
  }
}

export class ErroNomeEquipeDuplicado extends Error {
  constructor(message = "Já existe uma equipe com esse nome.") {
    super(message);
    this.name = "ErroNomeEquipeDuplicado";
  }
}

export interface DadosAtualizarEquipe {
  nome: string;
  descricao: string | null;
  tecnicosIds: string[];
}

export class ServicoEquipe {
  async listar() {
    return prisma.equipe.findMany({
      where: { ativo: true },
      orderBy: { nome: "asc" },
      select: { id: true, nome: true },
    });
  }

  /**
   * Dados da equipe para preencher o modal de edição: nome, descrição e
   * integrantes ativos (técnicos e gestor, para exibir o responsável).
   * ATENÇÃO: confira se o select abaixo bate com o que o mapper
   * (lib/mappers/equipe.mapper.ts) e lib/data/equipe.ts esperam.
   */
  async buscarParaEdicao(equipeId: string) {
    return prisma.equipe.findFirst({
      where: { id: equipeId, ativo: true },
      select: {
        id: true,
        nome: true,
        descricao: true,
        usuarios: {
          where: { ativo: true },
          orderBy: { nome: "asc" },
          select: { id: true, nome: true, email: true, cargo: true },
        },
      },
    });
  }

  async atualizar(
    equipeId: string,
    usuarioId: string,
    dados: DadosAtualizarEquipe,
  ) {
    try {
      return await prisma.$transaction(async (tx) => {
        const solicitante = await tx.usuario.findUnique({
          where: { id: usuarioId },
        });
        if (
          !solicitante?.ativo ||
          solicitante.cargo !== Cargo.GESTOR ||
          solicitante.equipeId !== equipeId
        ) {
          throw new ErroEquipeSemPermissao();
        }

        const equipe = await tx.equipe.findUnique({
          where: { id: equipeId },
          select: { ativo: true },
        });
        if (!equipe?.ativo) throw new ErroEquipeNaoEncontrada();

        const tecnicos = await tx.usuario.count({
          where: {
            id: { in: dados.tecnicosIds },
            ativo: true,
            cargo: Cargo.TECNICO,
          },
        });
        if (tecnicos !== dados.tecnicosIds.length) {
          throw new ErroTecnicosInvalidos();
        }

        await tx.equipe.update({
          where: { id: equipeId },
          data: { nome: dados.nome, descricao: dados.descricao },
        });

        // Técnicos que estavam na equipe e saíram da lista ficam sem equipe.
        await tx.usuario.updateMany({
          where: {
            equipeId,
            cargo: Cargo.TECNICO,
            id: { notIn: dados.tecnicosIds },
          },
          data: { equipeId: null },
        });

        // Técnicos da lista passam para esta equipe (saem da anterior, se houver).
        await tx.usuario.updateMany({
          where: { id: { in: dados.tecnicosIds } },
          data: { equipeId },
        });

        return tx.equipe.findUniqueOrThrow({
          where: { id: equipeId },
          select: { id: true, nome: true, descricao: true },
        });
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002"
      ) {
        throw new ErroNomeEquipeDuplicado();
      }
      throw e;
    }
  }
}

export const servicoEquipe = new ServicoEquipe();