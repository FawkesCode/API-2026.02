import { Cargo, Prisma, PrismaClient } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";

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
  constructor(
    message = "Um ou mais técnicos são inválidos ou já pertencem a outra equipe.",
  ) {
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

/** Campos opcionais: só o que for enviado é alterado (PATCH). */
export interface DadosAtualizarEquipe {
  nome?: string;
  descricao?: string | null;
  tecnicosIds?: string[];
}

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
   * Dados da equipe para preencher o modal de edição: nome, descrição e
   * integrantes ativos (técnicos e gestor, para exibir o responsável).
   */
  async buscarParaEdicao(equipeId: string) {
    return this.db.equipe.findFirst({
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
      return await this.db.$transaction(async (tx) => {
        // Existência antes da permissão: equipe inexistente responde 404.
        const equipe = await tx.equipe.findUnique({
          where: { id: equipeId },
          select: { ativo: true },
        });

        if (!equipe?.ativo) {
          throw new ErroEquipeNaoEncontrada();
        }

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

        if (dados.nome !== undefined || dados.descricao !== undefined) {
          await tx.equipe.update({
            where: { id: equipeId },
            data: {
              ...(dados.nome !== undefined ? { nome: dados.nome } : {}),
              ...(dados.descricao !== undefined
                ? { descricao: dados.descricao }
                : {}),
            },
          });
        }

        if (dados.tecnicosIds !== undefined) {
          await this.substituirTecnicos(tx, equipeId, dados.tecnicosIds);
        }

        const mudancas = [
          dados.nome !== undefined ? "nome" : null,
          dados.descricao !== undefined ? "descrição" : null,
          dados.tecnicosIds !== undefined ? "integrantes" : null,
        ].filter((item): item is string => item !== null);
        if (mudancas.length) {
          await tx.atividadeConta.create({
            data: {
              usuarioId,
              tipo: "EQUIPE",
              descricao: `Atualizou ${mudancas.join(", ")} da equipe.`,
            },
          });
        }

        return tx.equipe.findUniqueOrThrow({
          where: { id: equipeId },
          select: {
            id: true,
            nome: true,
            descricao: true,
          },
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

  /**
   * `tecnicosIds` é a lista completa: quem ficar de fora é desvinculado.
   */
  private async substituirTecnicos(
    tx: Prisma.TransactionClient,
    equipeId: string,
    ids: string[],
  ) {
    // Remove IDs repetidos para evitar contagens incorretas.
    const tecnicosIds = [...new Set(ids)];

    // Um técnico pertence a uma única equipe. Ao ser escolhido aqui, é
    // transferido da equipe anterior para a equipe do gestor solicitante.
    const candidatos = await tx.usuario.findMany({
      where: {
        id: { in: tecnicosIds },
        ativo: true,
        cargo: Cargo.TECNICO,
      },
      select: { id: true, equipeId: true },
    });

    if (candidatos.length !== tecnicosIds.length) {
      throw new ErroTecnicosInvalidos();
    }

    // Técnicos ativos removidos da lista ficam sem equipe. Inativos não
    // aparecem no modal, então não podem ser desvinculados por ele.
    await tx.usuario.updateMany({
      where: {
        equipeId,
        cargo: Cargo.TECNICO,
        ativo: true,
        id: { notIn: tecnicosIds },
      },
      data: { equipeId: null },
    });

    if (tecnicosIds.length > 0) {
      const { count } = await tx.usuario.updateMany({
        where: { id: { in: tecnicosIds }, ativo: true, cargo: Cargo.TECNICO },
        data: { equipeId },
      });
      if (count !== tecnicosIds.length) {
        throw new ErroTecnicosInvalidos();
      }
    }
  }

  /**
   * Substitui os técnicos de uma equipe sem afetar usuários de outros cargos.
   */
  async replaceTechnicians(
    teamId: string,
    technicianIds: string[],
    usuarioId: string,
  ) {
    const uniqueIds = [...new Set(technicianIds)];

    return this.db.$transaction(async (transaction) => {
      const team = await transaction.equipe.findUnique({
        where: { id: teamId },
        select: { id: true, ativo: true },
      });

      if (!team?.ativo) {
        return null;
      }

      const solicitante = await transaction.usuario.findUnique({
        where: { id: usuarioId },
        select: { ativo: true, cargo: true, equipeId: true },
      });
      if (
        !solicitante?.ativo ||
        solicitante.cargo !== Cargo.GESTOR ||
        solicitante.equipeId !== teamId
      ) {
        throw new ErroEquipeSemPermissao();
      }

      const users = await transaction.usuario.findMany({
        where: { id: { in: uniqueIds } },
        select: { id: true, nome: true, cargo: true },
      });

      if (
        users.length !== uniqueIds.length ||
        users.some((user) => user.cargo !== Cargo.TECNICO)
      ) {
        throw new InvalidTechnicianError();
      }

      const atuais = await transaction.usuario.findMany({
        where: { equipeId: teamId, cargo: Cargo.TECNICO },
        select: { id: true, nome: true },
      });

      // Remove da equipe os técnicos que não foram selecionados.
      await transaction.usuario.updateMany({
        where: {
          equipeId: teamId,
          cargo: Cargo.TECNICO,
          ...(uniqueIds.length > 0 ? { id: { notIn: uniqueIds } } : {}),
        },
        data: { equipeId: null },
      });

      // Adiciona os técnicos selecionados à equipe.
      if (uniqueIds.length > 0) {
        await transaction.usuario.updateMany({
          where: {
            id: { in: uniqueIds },
            cargo: Cargo.TECNICO,
          },
          data: { equipeId: teamId },
        });
      }

      const idsAtuais = new Set(atuais.map((user) => user.id));
      const idsNovos = new Set(uniqueIds);
      for (const tecnico of users.filter((user) => !idsAtuais.has(user.id))) {
        await transaction.atividadeConta.create({
          data: {
            usuarioId,
            tipo: "EQUIPE",
            descricao: `Adicionou ${tecnico.nome} à equipe.`,
          },
        });
      }
      for (const tecnico of atuais.filter((user) => !idsNovos.has(user.id))) {
        await transaction.atividadeConta.create({
          data: {
            usuarioId,
            tipo: "EQUIPE",
            descricao: `Removeu ${tecnico.nome} da equipe.`,
          },
        });
      }

      return transaction.usuario.findMany({
        where: {
          equipeId: teamId,
          cargo: Cargo.TECNICO,
        },
        select: teamTechnicianData,
        orderBy: { nome: "asc" },
      });
    });
  }
}

export const servicoEquipe = new ServicoEquipe();
