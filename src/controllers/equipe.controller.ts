import { NextResponse } from "next/server";
import { z } from "zod";
import {
  InvalidTechnicianError,
  servicoEquipe,
} from "@/services/equipe.service";
import { replaceTeamTechniciansSchema } from "@/schemas/team.schema";

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
