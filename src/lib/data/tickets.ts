import {
  servicoTicket,
  type FiltrosTicket,
} from "../../services/ticket.service";
import type { Prisma } from "@/lib/generated/prisma/client";
import { toTicketDTO } from "../mappers/ticket.mapper";

export type { FiltrosTicket };

export async function getAllTickets(filtros?: FiltrosTicket, escopo?: Prisma.TicketWhereInput) {
  let itens, total, pagina, totalPaginas, itensPorPagina;

  try {
    ({ itens, total, pagina, totalPaginas, itensPorPagina } =
      await servicoTicket.listarTodos(filtros, escopo));
  } catch (error) {
    console.error(`[getAllTickets] Erro ao buscar os tickets: ${error}`);
    throw new Error("Não foi possível carregar os tickets.");
  }

  return {
    itens: itens.map(toTicketDTO),
    total,
    pagina,
    totalPaginas,
    itensPorPagina,
  };
}
