import { notFound } from "next/navigation";
import { toTicketDTO } from "@/lib/mappers/ticket.mapper";
import { FiltrosTicket, servicoTicket } from "../../services/ticket.service";

export async function getTeamsTickets(
  usuarioId: string,
  filtros?: Pick<FiltrosTicket, "pagina" | "itensPorPagina">,
) {
  if (!usuarioId) {
    notFound();
  }

  let equipe, itens, total, pagina, totalPaginas, itensPorPagina;

  try {
    ({ equipe, itens, total, pagina, totalPaginas, itensPorPagina } =
      await servicoTicket.buscarTicketsDaEquipeDoUsuario(usuarioId, filtros));
  } catch (error) {
    console.error(
      "[getTeamsTickets] Erro ao buscar os tickets da equipe:",
      error,
    );
    throw new Error("Não foi possível carregar os tickets da sua equipe.");
  }

  return {
    equipeNome: equipe?.nome ?? "Sem equipe",
    itens: itens.map(toTicketDTO),
    total,
    pagina,
    totalPaginas,
    itensPorPagina,
  };
}

export async function addMyTeam(ticketId: string, equipeId?: string) {
  if (!ticketId || !equipeId) {
    throw new Error(
      "Parâmetros inválidos: ticketId e equipeId são obrigatórios.",
    );
  }

  try {
    const updatedTicket = await servicoTicket.alocarEquipe(ticketId, equipeId);

    if (!updatedTicket) {
      throw new Error(`Ticket com ID "${ticketId}" não foi encontrado.`);
    }

    return updatedTicket;
  } catch (error) {
    console.error("[addMyTeam] Falha ao alocar equipe ao ticket:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Não foi possível atribuir a equipe ao ticket.");
  }
}
