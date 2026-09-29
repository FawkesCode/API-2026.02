import { controladorCliente } from "@/lib/controllers/cliente.controller";

export async function GET(requisicao: Request) {
  return controladorCliente.listar(requisicao);
}