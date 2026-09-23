import { notFound } from "next/navigation";
import { servicoProjeto } from "../services/projeto.service";
import { toTicketDTO } from "../mappers/ticket.mapper";

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

  let projeto: Awaited<ReturnType<typeof servicoProjeto.buscarDetalhePorId>>;
  let tickets: Awaited<ReturnType<typeof servicoProjeto.listarTicketsPorProjeto>>;

  try {
    projeto = await servicoProjeto.buscarDetalhePorId(id);
    tickets = await servicoProjeto.listarTicketsPorProjeto(id);
  } catch (error) {
    console.error(`[getProjectTickets] Erro ao buscar os tickets: ${error}`);
    throw new Error(
      "Não foi possível carregar os tickets do projeto selecionado.",
    );
  }

  if (!projeto) {
    notFound();
  }

  return tickets.map((ticket) => toTicketDTO(ticket));
}
