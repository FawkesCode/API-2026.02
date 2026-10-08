import { notFound } from "next/navigation";
import { servicoHistoricoTicket } from "../../services/historico.service";
import { servicoProjeto } from "../../services/projeto.service";
import { servicoTicket } from "../../services/ticket.service";
import { servicoUsuario } from "../../services/usuario.service";
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
 * Usuário da sessão. Qualquer falha (sessão indisponível, erro na consulta)
 * vira `null` para que o fallback do autor seja sempre tentado.
 */
async function buscarUsuarioLogado() {
  try {
    const usuarioLogado = await getUsuarioLogado();
    if (!usuarioLogado?.id) return null;

    return await servicoUsuario.buscarPorId(usuarioLogado.id);
  } catch (error) {
    console.warn(
      `[getLogAuthor] Não foi possível obter o usuário logado: ${error}`,
    );
    return null;
  }
}

async function buscarResponsavelOuGestor(ticketId: string) {
  const ticket = await servicoTicket.buscarDetalhePorId(ticketId);
  const projeto = ticket
    ? await servicoProjeto.buscarDetalhePorId(ticket.projetoId)
    : null;
  const autorId = ticket?.responsavel?.id ?? projeto?.gestorId;

  return autorId ? servicoUsuario.buscarPorId(autorId) : null;
}

/**
 * Autor dos logs = usuário logado. É ele quem assina os logs enviados e quem
 * define o lado do chat.
 *
 * Se não houver usuário logado válido (sem sessão ou erro ao consultá-la),
 * usa o responsável do ticket ou, na falta dele, o gestor do projeto.
 */
export async function getLogAuthor(ticketId: string) {
  let usuario = await buscarUsuarioLogado();

  if (!usuario) {
    console.warn(
      "[getLogAuthor] Sem usuário logado válido; usando responsável/gestor do ticket.",
    );

    try {
      usuario = await buscarResponsavelOuGestor(ticketId);
    } catch (error) {
      console.error(`[getLogAuthor] Erro ao buscar o autor dos logs: ${error}`);
      throw new Error(
        "Não foi possível carregar o usuário responsável pelo ticket.",
      );
    }
  }

  if (!usuario) {
    notFound();
  }

  return toAutor(usuario);
}
