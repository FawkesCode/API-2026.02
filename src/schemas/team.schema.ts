import { z } from "zod";

export const replaceTeamTechniciansSchema = z.object({
  tecnicoIds: z.array(z.uuid("Cada tecnicoId deve ser um UUID válido.")),
});

export type ReplaceTeamTechniciansSchema = z.infer<
  typeof replaceTeamTechniciansSchema
>;
