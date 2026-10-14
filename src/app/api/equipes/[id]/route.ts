import { controladorEquipe } from "@/controllers/equipe.controller";

type ContextoRota = { params: Promise<{ id: string }> };

export async function PATCH(requisicao: Request, contexto: ContextoRota) {
  const { id } = await contexto.params;
  return controladorEquipe.update(requisicao, id);
}
