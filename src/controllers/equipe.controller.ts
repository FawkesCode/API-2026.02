import { NextResponse } from "next/server";
import { z } from "zod";
import { obterSessaoDaRequisicao } from "@/auth/sessao";
import {
  ErroEquipeNaoEncontrada,
  ErroEquipeSemPermissao,
  ErroNomeEquipeDuplicado,
  ErroTecnicosInvalidos,
  InvalidTechnicianError,
  servicoEquipe,
} from "@/services/equipe.service";
import {
  replaceTeamTechniciansSchema,
  updateTeamSchema,
} from "@/schemas/team.schema";

function handleUpdateTeamError(error: unknown) {
  if (error instanceof ErroEquipeNaoEncontrada) {
    return NextResponse.json(
      { erro: error.message, codigo: "EQUIPE_NAO_ENCONTRADA" },
      { status: 404 },
    );
  }
  if (error instanceof ErroEquipeSemPermissao) {
    return NextResponse.json(
      { erro: error.message, codigo: "SEM_PERMISSAO" },
      { status: 403 },
    );
  }
  if (error instanceof ErroNomeEquipeDuplicado) {
    return NextResponse.json(
      { erro: error.message, codigo: "NOME_EQUIPE_EM_USO" },
      { status: 400 },
    );
  }
  if (error instanceof ErroTecnicosInvalidos) {
    return NextResponse.json(
      { erro: error.message, codigo: "TECNICOS_INVALIDOS" },
      { status: 409 },
    );
  }

  console.error(error);
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

  async updateTeam(request: Request, teamId: string) {
    const validatedId = z.uuid().safeParse(teamId);
    if (!validatedId.success) {
      return NextResponse.json(
        { erro: "ID da equipe inválido.", codigo: "ID_INVALIDO" },
        { status: 400 },
      );
    }

    const session = obterSessaoDaRequisicao(request);
    if (!session) {
      return NextResponse.json(
        { erro: "Não autenticado.", codigo: "NAO_AUTENTICADO" },
        { status: 401 },
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          erro: "Corpo da requisição precisa ser um JSON válido.",
          codigo: "JSON_INVALIDO",
        },
        { status: 400 },
      );
    }

    const result = updateTeamSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          // O modal exibe `erro`, então vai a mensagem do primeiro problema.
          erro: result.error.issues[0]?.message ?? "Dados inválidos.",
          codigo: "DADOS_INVALIDOS",
          detalhes: z.flattenError(result.error),
        },
        { status: 400 },
      );
    }

    const { nome, descricao, tecnicosIds } = result.data;
    try {
      const team = await servicoEquipe.atualizar(
        validatedId.data,
        session.usuarioId,
        {
          nome,
          // Descrição vazia é salva como `null`, como o modal já esperava.
          descricao: descricao === undefined ? undefined : descricao || null,
          tecnicosIds,
        },
      );
      return NextResponse.json(team, { status: 200 });
    } catch (error) {
      return handleUpdateTeamError(error);
    }
  }

  async replaceTechnicians(request: Request, teamId: string) {
    const validatedId = z.uuid().safeParse(teamId);
    if (!validatedId.success) {
      return NextResponse.json(
        { erro: "ID da equipe inválido.", codigo: "INVALID_TEAM_ID" },
        { status: 400 },
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          erro: "Corpo da requisição precisa ser um JSON válido.",
          codigo: "INVALID_REQUEST_BODY",
        },
        { status: 400 },
      );
    }

    const result = replaceTeamTechniciansSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          erro: "Dados inválidos.",
          codigo: "INVALID_TECHNICIAN_IDS",
          detalhes: z.flattenError(result.error).fieldErrors,
        },
        { status: 400 },
      );
    }

    try {
      const technicians = await servicoEquipe.replaceTechnicians(
        validatedId.data,
        result.data.tecnicoIds,
      );
      if (!technicians) {
        return NextResponse.json(
          { erro: "Equipe não encontrada.", codigo: "TEAM_NOT_FOUND" },
          { status: 404 },
        );
      }
      return NextResponse.json(technicians, { status: 200 });
    } catch (error) {
      if (error instanceof InvalidTechnicianError) {
        return NextResponse.json(
          { erro: error.message, codigo: "INVALID_TECHNICIAN_IDS" },
          { status: 400 },
        );
      }

      console.error(error);
      return NextResponse.json(
        {
          erro: "Erro interno ao alterar técnicos da equipe.",
          codigo: "INTERNAL_SERVER_ERROR",
        },
        { status: 500 },
      );
    }
  }
}

export const controladorEquipe = new ControladorEquipe();
