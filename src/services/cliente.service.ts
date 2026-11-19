import { prisma } from "@/lib/prisma";

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
}

export const servicoCliente = new ServicoCliente();
