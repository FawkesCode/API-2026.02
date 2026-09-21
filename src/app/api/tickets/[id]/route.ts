import { controladorTicket } from "@/lib/controllers/ticket.controller";

type ContextoRota = { params: Promise<{ id: string }> };

export async function PATCH(requisicao: Request, contexto: ContextoRota) {
  const { id } = await contexto.params;
  return controladorTicket.atualizarPrioridade(requisicao, id);
}

export async function GET(requisicao: Request, contexto: ContextoRota) {
  const { id } = await contexto.params;
  return controladorTicket.buscarDetalhe(requisicao, id);
}
