import { z } from "zod";
import { Cargo } from "@/lib/generated/prisma/enums";

export const criarLogTicketSchema = z.object({
  evento: z.string().trim().min(1, "Evento é obrigatório.").max(50, "Evento excede o limite de 50 caracteres."),
  descricao: z.string().trim().min(1, "Descrição é obrigatória.").max(10_000, "Descrição excede o limite de 10.000 caracteres."),
  usuarioId: z.uuid("usuarioId deve ser um UUID válido."),
});

export type CriarLogTicketSchema = z.infer<typeof criarLogTicketSchema>;

export const logRespostaSchema = z.object({
  id: z.string(),
  evento: z.string(),
  descricao: z.string(),
  criadoEm: z.coerce.date(),
  ticketId: z.string(),
  usuarioId: z.string().nullable(),
  usuario: z
    .object({
      id: z.string(),
      nome: z.string(),
      cargo: z.enum(Cargo),
      equipe: z.object({ nome: z.string() }).nullable(),
    })
    .nullable(),
});
