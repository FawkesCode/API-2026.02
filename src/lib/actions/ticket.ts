"use server";
import { revalidatePath } from "next/cache";
import { servicoTicket, TicketComRelacoes } from "../services/ticket.service";
import { servicoHistoricoTicket } from "../services/historico.service";
import { toLogItem } from "../mappers/historico.mapper";

type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function addMyTeamAction(
  ticketId: string,
  equipeId: string,
  pathname?: string,
): Promise<ActionResponse<TicketComRelacoes>> {
  if (!ticketId || !equipeId) {
    return {
      success: false,
      error: "Parâmetros inválidos: ticketId e equipeId são obrigatórios.",
    };
  }

  try {
    const updatedTicket = await servicoTicket.alocarEquipe(ticketId, equipeId);

    if (!updatedTicket) {
      return {
        success: false,
        error: `Ticket com ID "${ticketId}" não foi encontrado.`,
      };
    }

    if (pathname) {
      revalidatePath(pathname);
    } else {
      revalidatePath("/equipe");
    }

    return {
      success: true,
      data: updatedTicket,
    };
  } catch (err) {
    console.error(`[addMyTeamAction] Erro ao alocar equipe:`, err);
    return {
      success: false,
      error: "Ocorreu um erro inesperado ao alocar a equipe.",
    };
  }
}

export async function removeMyTeamAction(
  ticketId: string,
  equipeId: string,
  pathname?: string,
): Promise<ActionResponse<TicketComRelacoes>> {
  if (!ticketId || !equipeId) {
    return {
      success: false,
      error: "Parâmetros inválidos: ticketId e equipeId são obrigatórios.",
    };
  }

  try {
    const updatedTicket = await servicoTicket.desalocarEquipe(
      ticketId,
      equipeId,
    );

    if (!updatedTicket) {
      return {
        success: false,
        error: `Ticket com ID "${ticketId}" não foi encontrado.`,
      };
    }

    if (pathname) {
      revalidatePath(pathname);
    } else {
      revalidatePath("/equipe");
    }

    return {
      success: true,
      data: updatedTicket,
    };
  } catch (err) {
    console.error(`[addMyTeamAction] Erro ao alocar equipe:`, err);
    return {
      success: false,
      error: "Ocorreu um erro inesperado ao alocar a equipe.",
    };
  }
}

export async function getRecentLogs(ticketId: string) {
  if (!ticketId) {
    return [];
  }

  let data;

  try {
    data = await servicoHistoricoTicket.listarPorTicket(ticketId);
  } catch (error) {
    console.error(`[getTicketLogs] Erro ao buscar os logs do ticket: ${error}`);
    throw new Error("Não foi possível carregar os logs do ticket selecionado.");
  }

  if (!data) {
    return [];
  }

  const allLogs = data.map((log) => toLogItem(log));
  const recentLogs = allLogs.slice(0, 2).map((log) => ({
    title: log.titulo,
    sentBy: log.tipo === "manual" ? log.autorNome : "Sistema",
    sentAt: log.criadoEm,
  }));

  return recentLogs;
}
