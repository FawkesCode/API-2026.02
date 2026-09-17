import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@/lib/generated/prisma/client";
import { servicoProjeto } from "@/lib/services/projeto.service";
import { criarProjetoSchema } from "@/schemas/projeto.schema";

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
      { erro: "Referência inválida: clienteId, equipeId ou gestorId não existem." },
      { status: 400 },
    );
  }

  console.error(erro);
  return NextResponse.json({ erro: "Erro interno ao processar o projeto." }, { status: 500 });
}

export class ControladorProjeto {
  // GET /api/projetos 
  async listar(_requisicao: Request) {
    try {
      const projetos = await servicoProjeto.listarAtivos();
      return NextResponse.json(projetos, { status: 200 });
    } catch (erro) {
      console.error(erro);
      return NextResponse.json({ erro: "Erro interno ao listar projetos." }, { status: 500 });
    }
  }

  // [BACK #2] Rota de post para criação de projetos na plataforma.
  async criar(requisicao: Request) {
    const { corpo, erro: erroDeParse } = await extrairJson(requisicao);
    if (erroDeParse) return erroDeParse;

    const resultado = criarProjetoSchema.safeParse(corpo);
    if (!resultado.success) {
      return NextResponse.json(
        { erro: "Dados inválidos.", detalhes: z.flattenError(resultado.error).fieldErrors },
        { status: 400 },
      );
    }

    try {
      const { projeto, ticketInstalacao } = await servicoProjeto.criarComTicketDeInstalacao(
        resultado.data,
      );
      return NextResponse.json({ ...projeto, ticketInstalacao }, { status: 201 });
    } catch (erro) {
      return tratarErroInesperado(erro);
    }
  }

  // [BACK #3] Rota de get para pegar o ticket de instalação do projeto que
  // acabou de ser criado.
  async buscarTicketDeInstalacao(_requisicao: Request, projetoId: string) {
    try {
      const { projeto, ticketInstalacao } =
        await servicoProjeto.buscarProjetoComTicketDeInstalacao(projetoId);

      if (!projeto) {
        return NextResponse.json({ erro: "Projeto não encontrado." }, { status: 404 });
      }

      if (!ticketInstalacao) {
        return NextResponse.json(
          { erro: "Nenhum ticket de instalação encontrado para este projeto." },
          { status: 404 },
        );
      }

      return NextResponse.json(ticketInstalacao, { status: 200 });
    } catch (erro) {
      console.error(erro);
      return NextResponse.json(
        { erro: "Erro interno ao buscar o ticket de instalação." },
        { status: 500 },
      );
    }
  }

  // GET /api/projetos/[id] 
  async buscarDetalhe(_requisicao: Request, projetoId: string) {
    try {
      const projeto = await servicoProjeto.buscarDetalhePorId(projetoId);

      if (!projeto) {
        return NextResponse.json({ erro: "Projeto não encontrado." }, { status: 404 });
      }

      return NextResponse.json(projeto, { status: 200 });
    } catch (erro) {
      console.error(erro);
      return NextResponse.json({ erro: "Erro interno ao buscar o projeto." }, { status: 500 });
    }
  }
}

export const controladorProjeto = new ControladorProjeto();