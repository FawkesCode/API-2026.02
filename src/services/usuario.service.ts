import { hash } from "bcryptjs";
import { endOfDay, isValid, parseISO, startOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";
import { Cargo, Prisma } from "@/lib/generated/prisma/client";
import type { FiltrosUsuario } from "@/schemas/usuario-filtros.schema";

export const TAMANHO_PAGINA_USUARIOS = 10;

export class ErroUsuarioNaoEncontrado extends Error {
  constructor(message = "Usuário não encontrado.") {
    super(message);
    this.name = "ErroUsuarioNaoEncontrado";
  }
}

export class ErroAlterarProprioCargo extends Error {
  constructor(message = "Você não pode alterar o seu próprio cargo.") {
    super(message);
    this.name = "ErroAlterarProprioCargo";
  }
}

export class ErroAlterarProprioStatus extends Error {
  constructor(message = "Você não pode inativar a sua própria conta.") {
    super(message);
    this.name = "ErroAlterarProprioStatus";
  }
}

export interface DadosAtualizarUsuario {
  nome: string;
  email: string;
  cargo: Cargo;
}

const ROTULO_CARGO: Record<Cargo, string> = {
  [Cargo.TECNICO]: "Técnico",
  [Cargo.GESTOR]: "Gestor",
  [Cargo.SUPORTE]: "Suporte Externo",
  [Cargo.SUPORTE_INTERNO]: "Suporte Interno",
  [Cargo.COMERCIAL]: "Analista de Compras",
};

const dadosUsuarioAtual = {
  id: true,
  nome: true,
  email: true,
  cargo: true,
  ativo: true,
  equipeId: true,
  equipe: { select: { nome: true } },
  criadoEm: true,
} as const;

const credenciaisLogin = {
  id: true,
  nome: true,
  email: true,
  senhaHash: true,
  cargo: true,
  ativo: true,
  senhaProvisoria: true,
} as const;

/** Campos expostos na listagem de gestão. `senhaHash` nunca entra aqui. */
const detailedUserFields = {
  id: true,
  nome: true,
  email: true,
  cargo: true,
  ativo: true,
  senhaProvisoria: true,
  equipe: { select: { nome: true } },
} as const;

/** Campos da tabela paginada de usuários. */
const camposListaUsuario = {
  id: true,
  nome: true,
  email: true,
  cargo: true,
  ativo: true,
  criadoEm: true,
  equipe: { select: { nome: true } },
  criadoPor: { select: { nome: true, email: true } },
} as const;

export type UsuarioListaRegistro = Prisma.UsuarioGetPayload<{
  select: typeof camposListaUsuario;
}>;

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

function paraDia(valor?: string) {
  if (!valor) return undefined;
  const data = parseISO(valor);
  return isValid(data) ? data : undefined;
}

/** Um dia (?data=) ou período (?dataInicio=&dataFim=), inclusivo nas pontas. */
function intervaloCriadoEm(filtros: FiltrosUsuario) {
  const inicio = paraDia(filtros.dataInicio ?? filtros.data);
  if (!inicio) return undefined;
  const fim = paraDia(filtros.dataFim) ?? inicio;
  return { gte: startOfDay(inicio), lte: endOfDay(fim) };
}

/**
 * Cria a equipe própria de um gestor. Nome único do banco: em caso de
 * homônimos, acrescenta um sufixo.
 */
async function criarEquipePropria(
  tx: Prisma.TransactionClient,
  nomeGestor: string,
) {
  const base = `Equipe ${nomeGestor}`.slice(0, 88);
  let nomeEquipe = base;
  let sufixo = 2;
  while (
    await tx.equipe.findUnique({
      where: { nome: nomeEquipe },
      select: { id: true },
    })
  ) {
    const final = ` (${sufixo++})`;
    nomeEquipe = `${base.slice(0, 100 - final.length)}${final}`;
  }
  const equipe = await tx.equipe.create({
    data: {
      nome: nomeEquipe,
      descricao: `Equipe gerenciada por ${nomeGestor}.`,
    },
    select: { id: true },
  });
  return { id: equipe.id, nome: nomeEquipe };
}

export class ServicoUsuario {
  /**
   * Lista usuários ativos com apenas id/nome, opcionalmente filtrando por
   * cargo (ex: `?cargo=GESTOR` para o dropdown de gestor no cadastro de
   * projeto). Sem `cargo`, retorna todos os usuários ativos.
   */

  async listarTecnicosParaEquipe() {
    return prisma.usuario.findMany({
      where: {
        ativo: true,
        cargo: Cargo.TECNICO,
      },
      select: {
        id: true,
        nome: true,
        equipeId: true,
        equipe: { select: { nome: true } },
      },
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

  /**
   * Lista todos os usuários (ativos e inativos) com os dados da tela de
   * gestão, ordenados por nome.
   */
  async listDetailed() {
    return prisma.usuario.findMany({
      select: detailedUserFields,
      orderBy: { nome: "asc" },
    });
  }

  /**
   * Tabela de gestão: filtros + paginação no banco.
   * Sem `status`, só usuários ativos; `status=inativo` mostra os inativos.
   */
  async listarPaginado(filtros: FiltrosUsuario) {
    const criadoEm = intervaloCriadoEm(filtros);
    const busca = filtros.busca;

    const where: Prisma.UsuarioWhereInput = {
      ativo: filtros.status !== "inativo",
      ...(filtros.cargo ? { cargo: filtros.cargo } : {}),
      ...(criadoEm ? { criadoEm } : {}),
      ...(busca
        ? {
            OR: [
              { nome: { contains: busca } },
              { email: { contains: busca } },
              { id: { contains: busca } },
            ],
          }
        : {}),
    };

    const itensPorPagina = filtros?.itensPorPagina ?? 10;
    const total = await prisma.usuario.count({ where });
    const totalPaginas = Math.max(1, Math.ceil(total / itensPorPagina));
    // Link antigo / edição manual da URL: nunca cai numa página vazia.
    const pagina = Math.min(filtros.pagina, totalPaginas);

    const itens = await prisma.usuario.findMany({
      where,
      select: camposListaUsuario,
      orderBy: [{ ativo: "desc" }, { nome: "asc" }, { id: "asc" }],
      skip: (pagina - 1) * itensPorPagina,
      take: itensPorPagina,
    });

    return { itens, total, pagina, totalPaginas, itensPorPagina };
  }

  async createUser(data: {
    nome: string;
    email: string;
    cargo: Cargo;
    password: string;
    criadoPorId?: string | null;
  }) {
    const { password, criadoPorId, ...userData } = data;

    const senhaHash = await hash(password, 12);
    return prisma.$transaction(async (tx) => {
      if (userData.cargo === Cargo.GESTOR) {
        // Cada novo gestor recebe uma equipe própria desde o cadastro.
        const equipe = await criarEquipePropria(tx, userData.nome);
        const nomeEquipe = equipe.nome;
        const gestor = await tx.usuario.create({
          data: {
            ...userData,
            senhaHash,
            senhaProvisoria: true,
            equipeId: equipe.id,
            ...(criadoPorId ? { criadoPorId } : {}),
          },
          select: createdUserData,
        });
        await tx.atividadeConta.create({
          data: {
            usuarioId: gestor.id,
            tipo: "EQUIPE",
            descricao: `Equipe ${nomeEquipe} criada automaticamente para sua conta.`,
          },
        });
        if (criadoPorId) {
          await tx.atividadeConta.create({
            data: {
              usuarioId: criadoPorId,
              tipo: "CADASTRO",
              descricao: `Criou usuário ${gestor.nome} do tipo ${ROTULO_CARGO[gestor.cargo]}.`,
            },
          });
        }
        return gestor;
      }
      const usuario = await tx.usuario.create({
        data: {
          ...userData,
          senhaHash,
          senhaProvisoria: true,
          equipeId: null,
          ...(criadoPorId ? { criadoPorId } : {}),
        },
        select: createdUserData,
      });
      if (criadoPorId) {
        await tx.atividadeConta.create({
          data: {
            usuarioId: criadoPorId,
            tipo: "CADASTRO",
            descricao: `Criou usuário ${usuario.nome} do tipo ${ROTULO_CARGO[usuario.cargo]}.`,
          },
        });
      }
      return usuario;
    });
  }

  /**
   * Edita nome, email e cargo de um usuário. A senha nunca é lida nem
   * alterada aqui.
   *
   * Troca de cargo mantém a regra do cadastro:
   * - virou GESTOR: recebe uma equipe própria nova;
   * - deixou de ser GESTOR: sai da equipe (`equipeId = null`).
   *
   * Email duplicado sobe como P2002 do Prisma (tratado no controller).
   */
  async updateUser(
    usuarioId: string,
    editorId: string,
    data: DadosAtualizarUsuario,
  ) {
    return prisma.$transaction(async (tx) => {
      const atual = await tx.usuario.findUnique({
        where: { id: usuarioId },
        select: { id: true, cargo: true },
      });
      if (!atual) throw new ErroUsuarioNaoEncontrado();

      const trocouCargo = data.cargo !== atual.cargo;
      // Evita que o analista perca o próprio acesso sem querer.
      if (trocouCargo && usuarioId === editorId) {
        throw new ErroAlterarProprioCargo();
      }

      let equipeId: string | null | undefined;
      let equipeCriada: string | undefined;
      if (trocouCargo && data.cargo === Cargo.GESTOR) {
        const equipe = await criarEquipePropria(tx, data.nome);
        equipeId = equipe.id;
        equipeCriada = equipe.nome;
      } else if (trocouCargo && atual.cargo === Cargo.GESTOR) {
        equipeId = null;
      }

      const usuario = await tx.usuario.update({
        where: { id: usuarioId },
        data: {
          nome: data.nome,
          email: data.email,
          cargo: data.cargo,
          ...(equipeId !== undefined ? { equipeId } : {}),
        },
        select: createdUserData,
      });

      if (equipeCriada) {
        await tx.atividadeConta.create({
          data: {
            usuarioId: usuario.id,
            tipo: "EQUIPE",
            descricao: `Equipe ${equipeCriada} criada automaticamente para sua conta.`,
          },
        });
      }
      await tx.atividadeConta.create({
        data: {
          usuarioId: editorId,
          tipo: "EDICAO",
          descricao: `Editou usuário ${usuario.nome} do tipo ${ROTULO_CARGO[usuario.cargo]}.`,
        },
      });

      return usuario;
    });
  }

  /**
   * O analista não pode inativar a própria conta. Se o status já é o
   * pedido, devolve o usuário sem gravar nada (nem atividade).
   */
  async updateUserStatus(usuarioId: string, editorId: string, ativo: boolean) {
    if (!ativo && usuarioId === editorId) {
      throw new ErroAlterarProprioStatus();
    }

    return prisma.$transaction(async (tx) => {
      const atual = await tx.usuario.findUnique({
        where: { id: usuarioId },
        select: createdUserData,
      });
      if (!atual) throw new ErroUsuarioNaoEncontrado();
      if (atual.ativo === ativo) return atual;

      const usuario = await tx.usuario.update({
        where: { id: usuarioId },
        data: { ativo },
        select: createdUserData,
      });

      await tx.atividadeConta.create({
        data: {
          usuarioId: editorId,
          tipo: "EDICAO",
          descricao: `${ativo ? "Reativou" : "Inativou"} usuário ${usuario.nome} do tipo ${ROTULO_CARGO[usuario.cargo]}.`,
        },
      });

      return usuario;
    });
  }

  async buscarPorEmail(email: string) {
    return prisma.usuario.findUnique({
      where: { email },
      select: dadosUsuarioAtual,
    });
  }

  async buscarCredenciaisPorEmail(email: string) {
    return prisma.usuario.findUnique({
      where: { email },
      select: credenciaisLogin,
    });
  }

  async alterarSenha(usuarioId: string, senha: string) {
    return prisma.usuario.update({
      where: { id: usuarioId },
      data: {
        senhaHash: await hash(senha, 12),
        senhaProvisoria: false,
      },
      select: { id: true },
    });
  }

  async buscarPorId(usuarioId: string) {
    return prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: dadosUsuarioAtual,
    });
  }

  async buscarEstadoSenhaPorId(usuarioId: string) {
    return prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { id: true, ativo: true, senhaProvisoria: true },
    });
  }
}

export const servicoUsuario = new ServicoUsuario();
