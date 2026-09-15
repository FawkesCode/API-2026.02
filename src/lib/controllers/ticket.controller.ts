import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@/lib/generated/prisma/client";
import { servicoTicket } from "@/lib/services/ticket.service";
import {criarTicketSchema,atualizarPrioridadeTicketSchema} from "@/schemas/ticket.schema";

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

function tratarErroInesperado(erro: unknown) {
  if (erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === "P2003") {
    return NextResponse.json(
      { erro: "Referência inválida: projetoId, abertoPorId ou responsavelId não existem." },
      { status: 400 },
    );
  }

  console.error(erro);
  return NextResponse.json({ erro: "Erro interno ao processar o ticket." }, { status: 500 });
}

export class ControladorTicket {
  async criar(requisicao: Request) {
    const { corpo, erro: erroDeParse } = await extrairJson(requisicao);
    if (erroDeParse) return erroDeParse;

    const resultado = criarTicketSchema.safeParse(corpo);
    if (!resultado.success) {
      return NextResponse.json(
        { erro: "Dados inválidos.", detalhes: z.flattenError(resultado.error).fieldErrors },
        { status: 400 },
      );
    }

    try {
      const ticket = await servicoTicket.criar(resultado.data);
      return NextResponse.json(ticket, { status: 201 });
    } catch (erro) {
      return tratarErroInesperado(erro);
    }
  }

  async atualizarPrioridade(requisicao: Request, ticketId: string) {
    const { corpo, erro: erroDeParse } = await extrairJson(requisicao);
    if (erroDeParse) return erroDeParse;

    const resultado = atualizarPrioridadeTicketSchema.safeParse(corpo);
    if (!resultado.success) {
      return NextResponse.json(
        { erro: "Dados inválidos.", detalhes: z.flattenError(resultado.error).fieldErrors },
        { status: 400 },
      );
    }

    try {
      const ticket = await servicoTicket.atualizarPrioridade(ticketId, resultado.data);
      if (!ticket) {
        return NextResponse.json({ erro: "Ticket não encontrado." }, { status: 404 });
      }
      return NextResponse.json(ticket, { status: 200 });
    } catch (erro) {
      return tratarErroInesperado(erro);
    }
  }
}

export const controladorTicket = new ControladorTicket();
