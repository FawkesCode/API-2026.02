import { z } from "zod";
import { Categoria, Prioridade } from "@/lib/generated/prisma/client";

export const criarTicketSchema = z.object({
  titulo: z.string().trim().min(1, "Título é obrigatório.").max(180),
  descricao: z.string().trim().min(1, "Descrição é obrigatória."),
  categoria: z.enum(Categoria),
  prioridade: z.enum(Prioridade).optional(),
  slaEm: z.coerce.date({ error: "slaEm é obrigatório e deve ser uma data válida." }),
  projetoId: z.uuid("projetoId deve ser um UUID válido."),
  abertoPorId: z.uuid("abertoPorId deve ser um UUID válido."),
  responsavelId: z.uuid("responsavelId deve ser um UUID válido.").optional(),
});

export type CriarTicketSchema = z.infer<typeof criarTicketSchema>;

export const atualizarPrioridadeTicketSchema = z.object({
  prioridade: z.enum(Prioridade),
  usuarioId: z.uuid("usuarioId deve ser um UUID válido.").optional(),
});

export type AtualizarPrioridadeTicketSchema = z.infer<typeof atualizarPrioridadeTicketSchema>;
