import { controladorCliente } from "@/controllers/cliente.controller";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return controladorCliente.getClient(request, id);
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return controladorCliente.updateClient(request, id);
}

export async function DELETE(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return controladorCliente.deleteClient(request, id);
}
