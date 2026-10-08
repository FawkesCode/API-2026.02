import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@/lib/generated/prisma/client";
import {
  servicoHistoricoTicket,
  UsuarioSemAcessoAoTicketError,
} from "@/lib/services/historico.service";
import { criarLogTicketSchema } from "@/schemas/historico.schema";

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
  if (erro instanceof UsuarioSemAcessoAoTicketError) {
    return NextResponse.json({ erro: erro.message }, { status: 403 });
  }

  if (erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === "P2003") {
    return NextResponse.json(
      { erro: "Referência inválida: usuarioId não existe." },
      { status: 400 },
    );
  }

  console.error(erro);
  return NextResponse.json({ erro: "Erro interno ao processar o log do ticket." }, { status: 500 });
}

export class ControladorHistoricoTicket {
  async listar(_requisicao: Request, ticketId: string) {
    const idValidado = z.uuid().safeParse(ticketId);
    if (!idValidado.success) {
      return NextResponse.json({ erro: "ID do ticket inválido." }, { status: 400 });
    }

    try {
      const logs = await servicoHistoricoTicket.listarPorTicket(idValidado.data);
      if (!logs) {
        return NextResponse.json({ erro: "Ticket não encontrado." }, { status: 404 });
      }
      return NextResponse.json(logs, { status: 200 });
    } catch (erro) {
      console.error(erro);
      return NextResponse.json(
        { erro: "Erro interno ao listar os logs do ticket." },
        { status: 500 },
      );
    }
  }

  async criar(requisicao: Request, ticketId: string) {
    const idValidado = z.uuid().safeParse(ticketId);
    if (!idValidado.success) {
      return NextResponse.json({ erro: "ID do ticket inválido." }, { status: 400 });
    }

    const { corpo, erro: erroDeParse } = await extrairJson(requisicao);
    if (erroDeParse) return erroDeParse;

    const resultado = criarLogTicketSchema.safeParse(corpo);
    if (!resultado.success) {
      return NextResponse.json(
        { erro: "Dados inválidos.", detalhes: z.flattenError(resultado.error).fieldErrors },
        { status: 400 },
      );
    }

    try {
      const log = await servicoHistoricoTicket.criar(idValidado.data, resultado.data);
      if (!log) {
        return NextResponse.json({ erro: "Ticket não encontrado." }, { status: 404 });
      }
      return NextResponse.json(log, { status: 201 });
    } catch (erro) {
      return tratarErroInesperado(erro);
    }
  }
}

export const controladorHistoricoTicket = new ControladorHistoricoTicket();
