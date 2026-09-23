import { controladorTicket } from "@/lib/controllers/ticket.controller";

export async function GET(requisicao: Request) {
  const usuarioId = new URL(requisicao.url).searchParams.get("usuarioId");
  return controladorTicket.listar(usuarioId);
}

export async function POST(requisicao: Request) {
  return controladorTicket.criar(requisicao);
}
