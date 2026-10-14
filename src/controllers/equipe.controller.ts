import { NextResponse } from "next/server";
import { z } from "zod";
import { obterSessaoDaRequisicao } from "@/auth/sessao";
import { Prisma } from "@/lib/generated/prisma/client";
import { updateTeamSchema } from "@/schemas/team.schema";
import {
  servicoEquipe,
  TeamNameInUseError,
  UnauthorizedTeamEditError,
} from "@/services/equipe.service";

async function extractJson(requisicao: Request) {
  try {
    return { corpo: (await requisicao.json()) as unknown, erro: null };
  } catch {
    return {
      corpo: null,
      erro: NextResponse.json(
        {
          erro: "Corpo da requisição precisa ser um JSON válido.",
          codigo: "JSON_INVALIDO",
        },
        { status: 400 },
      ),
    };
  }
}

function handleUpdateError(erro: unknown) {
  if (erro instanceof UnauthorizedTeamEditError) {
    return NextResponse.json(
      { erro: erro.message, codigo: "SEM_PERMISSAO" },
      { status: 403 },
    );
  }

  // P2002 cobre a corrida entre a checagem de nome e o update.
  if (
    erro instanceof TeamNameInUseError ||
    (erro instanceof Prisma.PrismaClientKnownRequestError &&
      erro.code === "P2002")
  ) {
    return NextResponse.json(
      {
        erro: "Já existe outra equipe com esse nome.",
        codigo: "NOME_EQUIPE_EM_USO",
      },
      { status: 400 },
    );
  }

  console.error(erro);
  return NextResponse.json(
    { erro: "Erro interno ao atualizar a equipe.", codigo: "ERRO_INTERNO" },
    { status: 500 },
  );
}

export class ControladorEquipe {
  async listar() {
    try {
      const equipes = await servicoEquipe.listar();
      return NextResponse.json(equipes, { status: 200 });
    } catch (erro) {
      console.error(erro);
      return NextResponse.json(
        { erro: "Erro interno ao listar equipes." },
        { status: 500 },
      );
    }
  }

  async update(requisicao: Request, equipeId: string) {
    const idValidado = z.uuid().safeParse(equipeId);
    if (!idValidado.success) {
      return NextResponse.json(
        { erro: "ID da equipe inválido.", codigo: "ID_INVALIDO" },
        { status: 400 },
      );
    }

    const sessao = obterSessaoDaRequisicao(requisicao);
    if (!sessao) {
      return NextResponse.json(
        { erro: "Não autenticado.", codigo: "NAO_AUTENTICADO" },
        { status: 401 },
      );
    }

    const { corpo, erro: erroDeParse } = await extractJson(requisicao);
    if (erroDeParse) return erroDeParse;

    const resultado = updateTeamSchema.safeParse(corpo);
    if (!resultado.success) {
      return NextResponse.json(
        {
          erro: "Dados inválidos.",
          codigo: "DADOS_INVALIDOS",
          detalhes: z.flattenError(resultado.error),
        },
        { status: 400 },
      );
    }

    try {
      const equipe = await servicoEquipe.update(idValidado.data, {
        ...resultado.data,
        usuarioId: sessao.usuarioId,
      });
      if (!equipe) {
        return NextResponse.json(
          { erro: "Equipe não encontrada.", codigo: "EQUIPE_NAO_ENCONTRADA" },
          { status: 404 },
        );
      }
      return NextResponse.json(equipe, { status: 200 });
    } catch (erro) {
      return handleUpdateError(erro);
    }
  }
}

export const controladorEquipe = new ControladorEquipe();
