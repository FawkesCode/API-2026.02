import { notFound } from "next/navigation";
import { servicoProjeto } from "../services/projeto.service";
import { toTicketDTO } from "../mappers/ticket.mapper";
import { servicoTicket } from "../services/ticket.service";

export async function getProjectById(id: string) {
  let data;

  try {
    data = await servicoProjeto.buscarDetalhePorId(id);
  } catch (error) {
    console.error(`[getProjectById] Erro ao buscar o projeto: ${error}`);
    throw new Error("Não foi possível carregar o projeto selecionado.");
  }

  if (!data || !id) {
    notFound();
  }

  // No momento, a única coisa que precisamos pegar o projeto é o nome e o id
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
    data = await servicoProjeto.listarTicketsPorProjeto(id);
  } catch (error) {
    console.error(`[getProjectTickets] Erro ao buscar os tickets: ${error}`);
    throw new Error(
      "Não foi possível carregar os tickets do projeto selecionado.",
    );
  }

  if (!data) {
    notFound();
  }

  return data.map((d) => toTicketDTO(d));
}

export async function getTicket(id: string) {
  if (!id) {
    notFound();
  }

  let data;

  try {
    data = await servicoTicket.buscarDetalhePorId(id);
  } catch (error) {
    console.error(`[getProjectTickets] Erro ao buscar os tickets: ${error}`);
    throw new Error(
      "Não foi possível carregar os tickets do projeto selecionado.",
    );
  }

  if (!data) {
    notFound();
  }

  return toTicketDTO(data);
}
