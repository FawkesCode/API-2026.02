import { controladorTicket } from "@/lib/controllers/ticket.controller";

export async function POST(requisicao: Request) {
  return controladorTicket.criar(requisicao);
}
