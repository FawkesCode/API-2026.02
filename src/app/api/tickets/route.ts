import { controladorTicket } from "@/controllers/ticket.controller";

export async function GET(requisicao: Request) {
  return controladorTicket.listar(requisicao);
}

export async function POST(requisicao: Request) {
  return controladorTicket.criar(requisicao);
}
