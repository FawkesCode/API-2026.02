import { z } from "zod";

export const criarProjetoSchema = z.object({
  nome: z.string().trim().min(1, "Nome do projeto é obrigatório.").max(150),
  localInstalacao: z
    .string()
    .trim()
    .min(1, "Local de instalação é obrigatório.")
    .max(255),

  descricao: z.string().trim().min(1).optional(),
  clienteId: z.uuid("clienteId deve ser um UUID válido."),
  equipeId: z.uuid("equipeId deve ser um UUID válido."),
  gestorId: z.uuid("gestorId deve ser um UUID válido."),
});

export type CriarProjetoSchema = z.infer<typeof criarProjetoSchema>;