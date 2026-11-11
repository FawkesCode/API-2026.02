import { controladorUsuario } from "@/controllers/usuario.controller";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return controladorUsuario.getUser(request, id);
}

export async function PUT(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return controladorUsuario.updateUser(request, id);
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return controladorUsuario.updateUserStatus(request, id);
}
