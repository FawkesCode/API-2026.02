import { servicoTicket, type FiltrosTicket } from "../services/ticket.service";
import { toTicketDTO } from "../mappers/ticket.mapper";

export type { FiltrosTicket };

export async function getAllTickets(filtros?: FiltrosTicket) {
  let tickets;

  try {
    tickets = await servicoTicket.listarTodos(filtros);
  } catch (error) {
    console.error(`[getAllTickets] Erro ao buscar os tickets: ${error}`);
    throw new Error("Não foi possível carregar os tickets.");
  }

  return tickets.map((t) => toTicketDTO(t));
}