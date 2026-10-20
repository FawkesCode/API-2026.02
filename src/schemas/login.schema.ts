import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  senha: z.string().min(1, "Senha é obrigatória."),
});

export type LoginSchema = z.infer<typeof loginSchema>;
