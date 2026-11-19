import { controladorCliente } from "@/controllers/cliente.controller";

export async function GET(requisicao: Request) {
  return controladorCliente.listar(requisicao);
}

export async function POST(requisicao: Request) {
  return controladorCliente.createClient(requisicao);
}
