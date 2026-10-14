import { controladorEquipe } from "@/controllers/equipe.controller";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return controladorEquipe.replaceTechnicians(request, id);
}
