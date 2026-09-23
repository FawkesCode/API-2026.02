import { notFound } from "next/navigation";
import { servicoTicket } from "../services/ticket.service";

import {
  TicketPriorityLabel,
  TicketStatusLabel,
  TicketTypeLabel,
} from "@/types/ticket";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export async function getTeamsTickets(id: string) {
  if (!id) {
    notFound();
  }

  let data;

  try {
    data = await servicoTicket.listarPorEquipeDoUsuario(id);
  } catch (error) {
    console.error(
      `[getTeamsTicket] Erro ao buscar os tickets da equipe:`,
      error,
    );
    throw new Error("Não foi possível carregar os tickets da sua equipe.");
  }

  if (!data) {
    notFound();
  }

  return data.map((ticket) => ({
    id: ticket.id,
    title: ticket.titulo,
    type:
      TicketTypeLabel[ticket.categoria] === "Instalação"
        ? ""
        : (TicketTypeLabel[ticket.categoria] ?? "Não definido"),
    openedAt: format(new Date(ticket.criadoEm), "d/M"),
    timeRemaining: formatDistanceToNow(new Date(ticket.slaEm), {
      addSuffix: false,
      locale: ptBR,
    }),
    createdBy: "Esperando correção",
    createdById: ticket.abertoPorId,
    teams: ["Esperando correção"],
    status: TicketStatusLabel[ticket.status] ?? "Não definido",
    priority: TicketPriorityLabel[ticket.prioridade] ?? "Não definido",
    description: ticket.descricao,
    recentLogs: null,
  }));
}
