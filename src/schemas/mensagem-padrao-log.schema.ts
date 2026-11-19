import { z } from "zod";

export const criarMensagemPadraoLogSchema = z.object({
  mensagem: z.string().trim()
    .min(1, "A mensagem é obrigatória.")
    .max(10_000, "A mensagem excede o limite de 10.000 caracteres."),
}).strict();

export type CriarMensagemPadraoLogSchema = z.infer<typeof criarMensagemPadraoLogSchema>;
