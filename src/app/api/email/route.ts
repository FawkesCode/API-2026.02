import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      erro: "O envio de email acontece automaticamente ao atribuir uma equipe em /api/tickets/:id/equipes.",
    },
    { status: 410 },
  );
}
