import { controladorTicket } from "@/controllers/ticket.controller";

type ContextoRota = { params: Promise<{ id: string }> };

export async function POST(requisicao: Request, contexto: ContextoRota) {
  const { id } = await contexto.params;
  return controladorTicket.atribuirEquipe(requisicao, id);
}

export async function DELETE(requisicao: Request, contexto: ContextoRota) {
  const { id } = await contexto.params;
  return controladorTicket.desatribuirEquipe(requisicao, id);
}