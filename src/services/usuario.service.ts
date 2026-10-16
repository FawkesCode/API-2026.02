import { hash } from "bcryptjs";
import { endOfDay, isValid, parseISO, startOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";
import { Cargo, Prisma } from "@/lib/generated/prisma/client";
import type { FiltrosUsuario } from "@/schemas/usuario-filtros.schema";

export const TAMANHO_PAGINA_USUARIOS = 10;

const dadosUsuarioAtual = {
  id: true,
  nome: true,
  email: true,
  cargo: true,
  ativo: true,
  equipeId: true,
  equipe: { select: { nome: true } },
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

    const total = await prisma.usuario.count({ where });
    const totalPaginas = Math.max(1, Math.ceil(total / TAMANHO_PAGINA_USUARIOS));
    // Link antigo / edição manual da URL: nunca cai numa página vazia.
    const pagina = Math.min(filtros.pagina, totalPaginas);

    const itens = await prisma.usuario.findMany({
      where,
      select: camposListaUsuario,
      // `id` desempata nomes iguais para a paginação ficar estável.
      orderBy: [{ ativo: "desc" }, { nome: "asc" }, { id: "asc" }],
      skip: (pagina - 1) * TAMANHO_PAGINA_USUARIOS,
      take: TAMANHO_PAGINA_USUARIOS,
    });

    return { itens, total, pagina, totalPaginas };
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