import { notFound } from "next/navigation";
import { servicoProjeto } from "../services/projeto.service";
import { toTicketDTO } from "../mappers/ticket.mapper";
import { servicoTicket } from "../services/ticket.service";

export async function getProjectById(id: string) {
  if (!id) {
    notFound();
  }

  let data;

  try {
    data = await servicoProjeto.buscarDetalhePorId(id);
  } catch (error) {
    console.error(`[getProjectById] Erro ao buscar o projeto:`, error);
    throw new Error("Não foi possível carregar o projeto selecionado.");
  }

  if (!data) {
    notFound();
  }

  return {
    projectId: data.id,
    title: data.nome,
    supervisor: data.gestor.nome,
  };
}

export async function getProjectTickets(id: string) {
  if (!id) {
    notFound();
  }

  let data;

  try {
    data = await servicoTicket.listarPorProjeto(id);
  } catch (error) {
    console.error(`[getProjectTickets] Erro ao buscar os tickets:`, error);
    throw new Error(
      "Não foi possível carregar os tickets do projeto selecionado.",
    );
  }

  if (!data) {
    notFound();
  }

  return data.map((ticket) => toTicketDTO(ticket));
}

export async function getTicket(id: string) {
  if (!id) {
    notFound();
  }

  let data;

  try {
    data = await servicoTicket.buscarDetalhePorId(id);
  } catch (error) {
    console.error(`[getTicket] Erro ao buscar o ticket:`, error);
    throw new Error("Não foi possível carregar o ticket selecionado.");
  }

  if (!data) {
    notFound();
  }

  return toTicketDTO(data);
}
