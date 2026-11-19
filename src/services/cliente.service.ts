import { prisma } from "@/lib/prisma";

export class ErroClienteNaoEncontrado extends Error {
  constructor() {
    super("Cliente não encontrado.");
    this.name = "ErroClienteNaoEncontrado";
  }
}

export class ErroCnpjJaCadastrado extends Error {
  constructor() {
    super("Este CNPJ já está cadastrado.");
    this.name = "ErroCnpjJaCadastrado";
  }
}

export class ErroNomeClienteJaCadastrado extends Error {
  constructor() {
    super("Já existe um cliente com este nome.");
    this.name = "ErroNomeClienteJaCadastrado";
  }
}

export class ErroClientePossuiProjetos extends Error {
  constructor() {
    super(
      "Cliente possui projetos vinculados e não pode ser excluído. Inative o cliente em vez de excluí-lo.",
    );
    this.name = "ErroClientePossuiProjetos";
  }
}

export class ErroClientePossuiProjetosAtivos extends Error {
  constructor() {
    super(
      "Cliente possui projetos ativos e não pode ser inativado. Inative os projetos antes.",
    );
    this.name = "ErroClientePossuiProjetosAtivos";
  }
}

const clientData = {
  id: true,
  nome: true,
  cnpj: true,
  localizacao: true,
  ativo: true,
  criadoEm: true,
  atualizadoEm: true,
} as const;

export class ServicoCliente {

  async listarParaSelecao() {
    return prisma.cliente.findMany({
      where: { ativo: true },
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    });
  }

  /** Tela de gestão: todos os clientes (ativos e inativos) com todos os campos. */
  async listDetailed() {
    return prisma.cliente.findMany({
      select: clientData,
      orderBy: { nome: "asc" },
    });
  }

  async getClientById(id: string) {
    return prisma.cliente.findUnique({ where: { id }, select: clientData });
  }

  /**
   * Cadastra um cliente já ativo, disponível na hora para receber projetos.
   * CNPJ e nome são únicos; uma corrida entre dois cadastros iguais ainda
   * sobe como P2002 do Prisma (tratado no controller).
   */
  async createClient(data: { nome: string; cnpj: string; localizacao: string }) {
    const existing = await prisma.cliente.findFirst({
      where: { OR: [{ cnpj: data.cnpj }, { nome: data.nome }] },
      select: { cnpj: true },
    });
    if (existing?.cnpj === data.cnpj) throw new ErroCnpjJaCadastrado();
    if (existing) throw new ErroNomeClienteJaCadastrado();

    return prisma.cliente.create({ data, select: clientData });
  }

  /**
   * Edição parcial: grava só os campos enviados. Nome e CNPJ continuam
   * únicos, mas o próprio cliente não conta como duplicado.
   */
  async updateClient(
    id: string,
    data: { nome?: string; cnpj?: string; localizacao?: string; ativo?: boolean },
  ) {
    return prisma.$transaction(async (tx) => {
      const current = await tx.cliente.findUnique({
        where: { id },
        select: { id: true },
      });
      if (!current) throw new ErroClienteNaoEncontrado();

      // Projeto ativo de cliente inativo sumiria do dropdown sem aviso.
      if (data.ativo === false) {
        const activeProjects = await tx.projeto.count({
          where: { clienteId: id, ativo: true },
        });
        if (activeProjects > 0) throw new ErroClientePossuiProjetosAtivos();
      }

      const uniqueFields = [
        ...(data.cnpj !== undefined ? [{ cnpj: data.cnpj }] : []),
        ...(data.nome !== undefined ? [{ nome: data.nome }] : []),
      ];
      if (uniqueFields.length > 0) {
        const existing = await tx.cliente.findFirst({
          where: { id: { not: id }, OR: uniqueFields },
          select: { cnpj: true },
        });
        if (existing && existing.cnpj === data.cnpj) throw new ErroCnpjJaCadastrado();
        if (existing) throw new ErroNomeClienteJaCadastrado();
      }

      return tx.cliente.update({ where: { id }, data, select: clientData });
    });
  }

  /**
   * Exclusão definitiva, só para cliente sem nenhum projeto (ativo ou não):
   * projetos guardam tickets e histórico, então o caminho é inativar.
   * Um projeto criado no meio do caminho ainda é barrado pela FK (P2003).
   */
  async deleteClient(id: string) {
    await prisma.$transaction(async (tx) => {
      const current = await tx.cliente.findUnique({
        where: { id },
        select: { id: true },
      });
      if (!current) throw new ErroClienteNaoEncontrado();

      const projects = await tx.projeto.count({ where: { clienteId: id } });
      if (projects > 0) throw new ErroClientePossuiProjetos();

      await tx.cliente.delete({ where: { id } });
    });
  }
}

export const servicoCliente = new ServicoCliente();
