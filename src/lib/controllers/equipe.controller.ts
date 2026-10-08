import { NextResponse } from "next/server";
import { servicoEquipe } from "@/lib/services/equipe.service";

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
}

export const controladorEquipe = new ControladorEquipe();
