import { z } from "zod";

export const criarLogTicketSchema = z.object({
  evento: z.string().trim().min(1, "Evento é obrigatório.").max(50, "Evento excede o limite de 50 caracteres."),
  descricao: z.string().trim().min(1, "Descrição é obrigatória.").max(10_000, "Descrição excede o limite de 10.000 caracteres."),
  usuarioId: z.uuid("usuarioId deve ser um UUID válido.").optional(),
});

export type CriarLogTicketSchema = z.infer<typeof criarLogTicketSchema>;
