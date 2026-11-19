import { controladorCliente } from "@/controllers/cliente.controller";

export async function GET(request: Request) {
  return controladorCliente.listDetailed(request);
}
