import { controladorUsuario } from "@/controllers/usuario.controller";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return controladorUsuario.resetUserPassword(request, id);
}
