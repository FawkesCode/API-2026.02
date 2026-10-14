import { z } from "zod";

export const updateTeamSchema = z
  .object({
    nome: z
      .string()
      .trim()
      .min(1, "Nome da equipe não pode ser vazio.")
      .max(100, "Nome da equipe deve ter no máximo 100 caracteres.")
      .optional(),
    descricao: z
      .string()
      .trim()
      .max(255, "Descrição deve ter no máximo 255 caracteres.")
      .nullable()
      .optional(),
  })
  .strict()
  .refine((dados) => dados.nome !== undefined || dados.descricao !== undefined, {
    message: "Informe ao menos um campo para atualizar: nome ou descricao.",
  });

export type UpdateTeamSchema = z.infer<typeof updateTeamSchema>;
