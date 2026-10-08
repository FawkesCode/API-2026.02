import { controladorProjeto } from "@/lib/controllers/projeto.controller";

type ContextoRota = { params: Promise<{ id: string }> };

export async function GET(requisicao: Request, contexto: ContextoRota) {
  const { id } = await contexto.params;
  return controladorProjeto.buscarDetalhe(requisicao, id);
}