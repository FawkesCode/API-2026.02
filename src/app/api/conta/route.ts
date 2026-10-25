import { exigirCargo } from "@/auth/exigir-cargo";
import { Cargo } from "@/lib/generated/prisma/client";
import { buscarPerfilComAtividades } from "@/services/atividade-conta.service";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const acesso = await exigirCargo(request, ...Object.values(Cargo));
  if (!acesso.autorizado) return acesso.resposta;

  try {
    const perfil = await buscarPerfilComAtividades(acesso.usuario.id);
    if (!perfil) {
      return NextResponse.json({ erro: "Usuário não encontrado." }, { status: 404 });
    }
    return NextResponse.json(perfil, { status: 200 });
  } catch (error) {
    console.error("[GET /api/conta] Erro ao buscar perfil:", error);
    return NextResponse.json(
      { erro: "Erro interno ao buscar os dados da conta." },
      { status: 500 },
    );
  }
}
