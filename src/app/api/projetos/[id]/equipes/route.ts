import { NextResponse } from "next/server";

export async function PATCH() {
  return NextResponse.json(
    {
      erro: "Esta rota foi descontinuada. Use /api/tickets/:id/equipes para atribuir uma equipe ao ticket.",
    },
    { status: 410 },
  );
}
