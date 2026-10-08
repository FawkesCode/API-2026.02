import { controladorHistoricoTicket } from "@/lib/controllers/historico.controller";

type ContextoRota = { params: Promise<{ id: string }> };

export async function GET(requisicao: Request, contexto: ContextoRota) {
  const { id } = await contexto.params;
  return controladorHistoricoTicket.listar(requisicao, id);
}

export async function POST(requisicao: Request, contexto: ContextoRota) {
  const { id } = await contexto.params;
  return controladorHistoricoTicket.criar(requisicao, id);
}
