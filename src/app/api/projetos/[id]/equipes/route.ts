import { controladorTicket } from "@/lib/controllers/ticket.controller";

type ContextoRota = { params: Promise<{ id: string }> };

export async function PATCH(requisicao: Request, contexto: ContextoRota) {
  const { id } = await contexto.params;
  return controladorTicket.alocarEquipe(requisicao, id);
}
