import { notFound } from "next/navigation";
import { toTicketDTO } from "@/lib/mappers/ticket.mapper";
import { servicoTicket } from "../services/ticket.service";

export async function getTeamsTickets(usuarioId: string) {
  if (!usuarioId) {
    notFound();
  }

  try {
    const { equipe, tickets } =
      await servicoTicket.buscarTicketsDaEquipeDoUsuario(usuarioId);

    return {
      equipeNome: equipe?.nome ?? "Sem equipe",
      tickets: tickets.map(toTicketDTO),
    };
  } catch (error) {
    console.error("[getTeamsTickets] Erro ao buscar os tickets da equipe:", error);
    throw new Error("Não foi possível carregar os tickets da sua equipe.");
  }
}
