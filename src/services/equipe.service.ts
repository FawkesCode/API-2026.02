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

export interface DadosAtualizarEquipe {
  nome: string;
  descricao: string | null;
  tecnicosIds: string[];
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
    // Remove IDs repetidos para evitar contagens incorretas.
    const tecnicosIds = [...new Set(dados.tecnicosIds)];

    try {
      return await this.db.$transaction(async (tx) => {
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

        if (!equipe?.ativo) {
          throw new ErroEquipeNaoEncontrada();
        }

        // Aceita técnicos ativos que estejam sem equipe ou já pertençam
        // à equipe editada. Não transfere técnicos de outras equipes.
        const candidatos = await tx.usuario.findMany({
          where: {
            id: { in: tecnicosIds },
            ativo: true,
            cargo: Cargo.TECNICO,
            OR: [{ equipeId: null }, { equipeId }],
          },
          select: { id: true, equipeId: true },
        });

        if (candidatos.length !== tecnicosIds.length) {
          throw new ErroTecnicosInvalidos();
        }

        await tx.equipe.update({
          where: { id: equipeId },
          data: {
            nome: dados.nome,
            descricao: dados.descricao,
          },
        });

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

        // Vincula só quem ainda está sem equipe. A condição `equipeId: null`
        // vai no próprio UPDATE: se outra requisição alocar o técnico entre a
        // leitura acima e esta escrita, a contagem diverge e a transação é
        // desfeita (sem depender de como o driver conta linhas afetadas).
        const livres = candidatos
          .filter((c) => c.equipeId === null)
          .map((c) => c.id);

        if (livres.length > 0) {
          const { count } = await tx.usuario.updateMany({
            where: {
              id: { in: livres },
              ativo: true,
              cargo: Cargo.TECNICO,
              equipeId: null,
            },
            data: { equipeId },
          });

          if (count !== livres.length) {
            throw new ErroTecnicosInvalidos();
          }
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
   * Substitui os técnicos de uma equipe sem afetar usuários de outros cargos.
   */
  async replaceTechnicians(teamId: string, technicianIds: string[]) {
    const uniqueIds = [...new Set(technicianIds)];

    return this.db.$transaction(async (transaction) => {
      const team = await transaction.equipe.findUnique({
        where: { id: teamId },
        select: { id: true },
      });

      if (!team) {
        return null;
      }

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