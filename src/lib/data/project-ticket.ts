import { notFound } from "next/navigation";
import { servicoProjeto } from "../services/projeto.service";
import { toTicketDTO } from "../mappers/ticket.mapper";
import type { Prioridade, StatusTicket } from "@/lib/generated/prisma/client";

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

  return {
    projectId: data.id,
    title: data.nome,
    supervisor: data.gestor.nome,
  };
}

export interface FiltrosTicket {
  prioridade?: Prioridade;
  status?: StatusTicket;
  titulo?: string;
  data?: string;
}

export async function getProjectTickets(id: string, filtros?: FiltrosTicket) {
  if (!id) {
    notFound();
  }

  let projeto;
  let tickets;

  try {
    projeto = await servicoProjeto.buscarDetalhePorId(id);
    tickets = await servicoProjeto.listarTicketsDoProjeto(id, filtros);
  } catch (error) {
    console.error(`[getProjectTickets] Erro ao buscar os tickets: ${error}`);
    throw new Error(
      "Não foi possível carregar os tickets do projeto selecionado.",
    );
  }

  if (!projeto) {
    notFound();
  }

  return tickets.map((t) => toTicketDTO(t));
}