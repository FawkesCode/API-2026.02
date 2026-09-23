import { describe, expect, it } from "vitest";
import {
  atualizarPrioridadeTicketSchema,
  criarTicketSchema,
} from "@/schemas/ticket.schema";

const prioridadesPermitidas = ["BAIXA", "MEDIA", "ALTA", "CRITICA"] as const;
const prioridadeInvalida = "URGENTE";

function dadosValidosParaCriacao(prioridade?: (typeof prioridadesPermitidas)[number]) {
  return {
    titulo: "Falha no equipamento",
    descricao: "O equipamento precisa de manutenção.",
    categoria: "MANUTENCAO",
    prioridade,
    slaEm: new Date(Date.now() + 60_000),
    projetoId: "550e8400-e29b-41d4-a716-446655440000",
    abertoPorId: "550e8400-e29b-41d4-a716-446655440001",
  };
}

describe("schemas de prioridade do ticket", () => {
  it.each(prioridadesPermitidas)("aceita %s ao criar um ticket", (prioridade) => {
    expect(criarTicketSchema.safeParse(dadosValidosParaCriacao(prioridade)).success).toBe(true);
  });

  it("mantém a prioridade opcional ao criar um ticket", () => {
    expect(criarTicketSchema.safeParse(dadosValidosParaCriacao()).success).toBe(true);
  });

  it("rejeita uma prioridade não permitida ao criar um ticket", () => {
    expect(
      criarTicketSchema.safeParse(dadosValidosParaCriacao(prioridadeInvalida as never)).success,
    ).toBe(false);
  });

  it.each(prioridadesPermitidas)("aceita %s ao atualizar a prioridade", (prioridade) => {
    expect(atualizarPrioridadeTicketSchema.safeParse({ prioridade }).success).toBe(true);
  });

  it("rejeita uma prioridade não permitida ao atualizar a prioridade", () => {
    expect(atualizarPrioridadeTicketSchema.safeParse({ prioridade: prioridadeInvalida }).success).toBe(false);
  });

  it("exige a prioridade ao atualizar um ticket", () => {
    expect(atualizarPrioridadeTicketSchema.safeParse({}).success).toBe(false);
  });
});
