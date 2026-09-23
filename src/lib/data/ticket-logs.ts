import { notFound } from "next/navigation";
import { servicoHistoricoTicket } from "../services/historico.service";
import { servicoTicket } from "../services/ticket.service";
import { servicoUsuario } from "../services/usuario.service";
import { toAutor, toLogItem } from "../mappers/historico.mapper";

export async function getTicketLogs(ticketId: string) {
  if (!ticketId) {
    notFound();
  }

  let data;

  try {
    data = await servicoHistoricoTicket.listarPorTicket(ticketId);
  } catch (error) {
    console.error(`[getTicketLogs] Erro ao buscar os logs do ticket: ${error}`);
    throw new Error("Não foi possível carregar os logs do ticket selecionado.");
  }

  if (!data) {
    notFound();
  }

  return data.map((log) => toLogItem(log));
}

export async function getLogAuthor(ticketId: string) {
  let usuario;

  try {
    const ticket = await servicoTicket.buscarDetalhePorId(ticketId);
    if (ticket) {
      usuario = await servicoUsuario.buscarPorId(
        ticket.responsavel?.id ?? ticket.abertoPor.id,
      );
    }
  } catch (error) {
    console.error(`[getLogAuthor] Erro ao buscar o autor dos logs: ${error}`);
    throw new Error(
      "Não foi possível carregar o usuário responsável pelo ticket.",
    );
  }

  if (!usuario) {
    notFound();
  }

  return toAutor(usuario);
}
