import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@/lib/generated/prisma/client";
import {
  ErroConflitoPrioridade,
  ProjetoNaoEncontradoError,
  servicoTicket,
} from "@/lib/services/ticket.service";
import { toTicketDTO } from "@/lib/mappers/ticket.mapper";
import {
  atualizarPrioridadeTicketSchema,
  criarTicketSchema,
  alocarEquipeTicketSchema,
} from "@/schemas/ticket.schema";

async function extrairJson(requisicao: Request) {
  try {
    return { corpo: (await requisicao.json()) as unknown, erro: null };
  } catch {
    return {
      corpo: null,
      erro: NextResponse.json(
        { erro: "Corpo da requisição precisa ser um JSON válido." },
        { status: 400 },
      ),
    };
  }
}

function validarCorpo<T>(schema: z.ZodType<T>, corpo: unknown) {
  const resultado = schema.safeParse(corpo);
  if (!resultado.success) {
    return {
      dados: null,
      erro: NextResponse.json(
        { erro: "Dados inválidos.", detalhes: z.flattenError(resultado.error).fieldErrors },
        { status: 400 },
      ),
    };
  }
  return { dados: resultado.data, erro: null };
}

function tratarErroInesperado(erro: unknown) {
  if (erro instanceof ErroConflitoPrioridade) {
    return NextResponse.json({ erro: erro.message }, { status: 409 });
  }

  if (erro instanceof ProjetoNaoEncontradoError) {
    return NextResponse.json({ erro: erro.message }, { status: 400 });
  }

  if (erro instanceof Prisma.PrismaClientKnownRequestError) {
    if (erro.code === "P2003") {
      return NextResponse.json(
        { erro: "Referência inválida: projetoId, abertoPorId, responsavelId ou equipeId não existem." },
        { status: 400 },
      );
    }

    if (erro.code === "P2025") {
      return NextResponse.json({ erro: "Ticket não encontrado." }, { status: 404 });
    }

    if (erro.code === "P2002") {
      return NextResponse.json(
        { erro: "Já existe um registro com esses dados." },
        { status: 409 },
      );
    }
  }

  console.error(erro);
  return NextResponse.json({ erro: "Erro interno ao processar o ticket." }, { status: 500 });
}

export class ControladorTicket {
  async criar(requisicao: Request) {
    const { corpo, erro: erroDeParse } = await extrairJson(requisicao);
    if (erroDeParse) return erroDeParse;

    const { dados, erro: erroDeValidacao } = validarCorpo(criarTicketSchema, corpo);
    if (erroDeValidacao) return erroDeValidacao;

    try {
      const ticket = await servicoTicket.criar(dados);
      return NextResponse.json(toTicketDTO(ticket), { status: 201 });
    } catch (erro) {
      return tratarErroInesperado(erro);
    }
  }

  async listar(usuarioId: string | null) {
    const idValidado = z.uuid().safeParse(usuarioId);
    if (!idValidado.success) {
      return NextResponse.json({ erro: "usuarioId deve ser um UUID válido." }, { status: 400 });
    }

    try {
      const tickets = await servicoTicket.listarPorEquipeDoUsuario(idValidado.data);
      return NextResponse.json(tickets, { status: 200 });
    } catch (erro) {
      return tratarErroInesperado(erro);
    }
  }

  async atualizarPrioridade(requisicao: Request, ticketId: string) {
    const idValidado = z.uuid().safeParse(ticketId);
    if (!idValidado.success) {
      return NextResponse.json({ erro: "ID do ticket inválido." }, { status: 400 });
    }

    const { corpo, erro: erroDeParse } = await extrairJson(requisicao);
    if (erroDeParse) return erroDeParse;

    const { dados, erro: erroDeValidacao } = validarCorpo(atualizarPrioridadeTicketSchema, corpo);
    if (erroDeValidacao) return erroDeValidacao;

    try {
      const ticket = await servicoTicket.atualizarPrioridade(idValidado.data, dados);
      if (!ticket) {
        return NextResponse.json({ erro: "Ticket não encontrado." }, { status: 404 });
      }
      return NextResponse.json(toTicketDTO(ticket), { status: 200 });
    } catch (erro) {
      return tratarErroInesperado(erro);
    }
  }

  async buscarDetalhe(_requisicao: Request, ticketId: string) {
    try {
      const ticket = await servicoTicket.buscarDetalhePorId(ticketId);
      if (!ticket) {
        return NextResponse.json({ erro: "Ticket não encontrado." }, { status: 404 });
      }
      return NextResponse.json(toTicketDTO(ticket), { status: 200 });
    } catch (erro) {
      console.error(erro);
      return NextResponse.json({ erro: "Erro interno ao buscar o ticket." }, { status: 500 });
    }
  }

  async alocarEquipe(requisicao: Request, ticketId: string) {
    const idValidado = z.uuid().safeParse(ticketId);
    if (!idValidado.success) {
      return NextResponse.json({ erro: "ID do ticket inválido." }, { status: 400 });
    }

    const { corpo, erro: erroDeParse } = await extrairJson(requisicao);
    if (erroDeParse) return erroDeParse;

    const { dados, erro: erroDeValidacao } = validarCorpo(alocarEquipeTicketSchema, corpo);
    if (erroDeValidacao) return erroDeValidacao;

    try {
      const ticket = await servicoTicket.alocarEquipe(idValidado.data, dados.equipeId);
      if (!ticket) {
        return NextResponse.json({ erro: "Ticket não encontrado." }, { status: 404 });
      }
      return NextResponse.json(toTicketDTO(ticket), { status: 200 });
    } catch (erro) {
      return tratarErroInesperado(erro);
    }
  }
}

export const controladorTicket = new ControladorTicket();