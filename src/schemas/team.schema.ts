import { z } from "zod";

export const replaceTeamTechniciansSchema = z.object({
  tecnicoIds: z.array(z.uuid("Cada tecnicoId deve ser um UUID válido.")),
});

export type ReplaceTeamTechniciansSchema = z.infer<
  typeof replaceTeamTechniciansSchema
>;

/**
 * PATCH /api/equipes/:id — todos os campos são opcionais e só os enviados são
 * alterados. `tecnicosIds`, quando enviado, é a lista completa de técnicos.
 */
export const updateTeamSchema = z
  .strictObject(
    {
      nome: z
        .string("Nome deve ser um texto.")
        .trim()
        .min(1, "Informe o nome da equipe.")
        .max(100, "O nome deve ter no máximo 100 caracteres.")
        .optional(),
      descricao: z
        .string("Descrição deve ser um texto.")
        .trim()
        .max(255, "A descrição deve ter no máximo 255 caracteres.")
        .nullable()
        .optional(),
      tecnicosIds: z
        .array(z.uuid("Cada tecnicosIds deve ser um UUID válido."), {
          error: "tecnicosIds deve ser uma lista.",
        })
        .max(200, "Uma equipe pode ter no máximo 200 técnicos.")
        .optional(),
    },
    {
      error: (issue) =>
        issue.code === "unrecognized_keys"
          ? "Campo não editável. Envie apenas nome, descricao e/ou tecnicosIds."
          : undefined,
    },
  )
  .refine(
    (dados) =>
      dados.nome !== undefined ||
      dados.descricao !== undefined ||
      dados.tecnicosIds !== undefined,
    { error: "Informe ao menos um campo: nome, descricao ou tecnicosIds." },
  );

export type UpdateTeamSchema = z.infer<typeof updateTeamSchema>;
