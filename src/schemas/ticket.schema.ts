import { z } from "zod";
import { Categoria, Prioridade } from "@/lib/generated/prisma/client";

export const criarTicketSchema = z.object({
  titulo: z.string().trim().min(1, "Título é obrigatório.").max(180),
  descricao: z.string().trim().min(1, "Descrição é obrigatória.").max(10_000, "Descrição excede o limite de 10.000 caracteres."),
  categoria: z.enum(Categoria),
  prioridade: z.enum(Prioridade).optional(),
  slaEm: z.coerce
    .date({ error: "slaEm é obrigatório e deve ser uma data válida." })
    .refine((data) => data.getTime() > Date.now(), "slaEm deve ser uma data futura."),
  projetoId: z.uuid("projetoId deve ser um UUID válido."),
  abertoPorId: z.uuid("abertoPorId deve ser um UUID válido."),
  responsavelId: z.uuid("responsavelId deve ser um UUID válido.").optional(),
  // NOVO — equipes adicionais (além da equipe herdada do Projeto) que
  // devem atuar no ticket. Opcional para não quebrar quem já chama
  // este endpoint sem enviar esse campo.
  equipeIds: z.array(z.uuid("Cada id de equipe deve ser um UUID válido.")).optional(),
});

export const alocarEquipeTicketSchema = z.object({
  equipeId: z.uuid("equipeId deve ser um UUID válido."),
});
 
export type AlocarEquipeTicketSchema = z.infer<typeof alocarEquipeTicketSchema>;

export type CriarTicketSchema = z.infer<typeof criarTicketSchema>;

export const atualizarPrioridadeTicketSchema = z.object({
  prioridade: z.enum(Prioridade),
});

export type AtualizarPrioridadeTicketSchema = z.infer<typeof atualizarPrioridadeTicketSchema>;

export type AtualizarPrioridadeComAutor = AtualizarPrioridadeTicketSchema & {
  usuarioId: string;
};
