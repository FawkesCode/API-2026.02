import { notFound } from "next/navigation";
import { servicoHistoricoTicket } from "../services/historico.service";
import { servicoProjeto } from "../services/projeto.service";
import { servicoTicket } from "../services/ticket.service";
import { servicoUsuario } from "../services/usuario.service";
import { toAutor, toLogItem } from "../mappers/historico.mapper";
import { getUsuarioLogado } from "./sessao";

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

/**
 * Autor dos logs = usuário logado. É ele quem assina os logs enviados e quem
 * define o lado do chat (suas mensagens ficam à direita, as dos outros à esquerda).
 *
 * Se não houver sessão (ou o usuário da sessão não for encontrado), cai no
 * comportamento anterior: responsável do ticket ou gestor do projeto.
 */
export async function getLogAuthor(ticketId: string) {
  let usuario;

  try {
    const usuarioLogado = await getUsuarioLogado();

    if (usuarioLogado?.id) {
      usuario = await servicoUsuario.buscarPorId(usuarioLogado.id);
    }

    if (!usuario) {
      console.warn(
        "[getLogAuthor] Sem usuário logado válido; usando responsável/gestor do ticket.",
      );

      const ticket = await servicoTicket.buscarDetalhePorId(ticketId);
      const projeto = ticket
        ? await servicoProjeto.buscarDetalhePorId(ticket.projetoId)
        : null;
      const autorId = ticket?.responsavel?.id ?? projeto?.gestorId;

      if (autorId) {
        usuario = await servicoUsuario.buscarPorId(autorId);
      }
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