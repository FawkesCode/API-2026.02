import { Cargo } from "@/lib/generated/prisma/client";
import { z } from "zod";

export const createUserSchema = z.object({
  nome: z.string().trim().min(1, "Nome é obrigatório.").max(120),
  email: z.email("E-mail deve ter um formato válido.").max(254),
  cargo: z.enum(Cargo),
  senha: z
    .string()
    .min(8, "Senha deve ter pelo menos 8 caracteres.")
    .regex(/[A-Z]/, "Senha deve conter ao menos uma letra maiúscula.")
    .regex(/[a-z]/, "Senha deve conter ao menos uma letra minúscula.")
    .regex(/\d/, "Senha deve conter ao menos um número.")
    .regex(/[^A-Za-z0-9]/, "Senha deve conter ao menos um caractere especial."),
});

export type CreateUserSchema = z.infer<typeof createUserSchema>;

/**
 * Edição (PUT): nome, email e cargo são obrigatórios. Senha não faz parte
 * da edição; campos extras (como `senha`) são descartados pelo zod.
 */
export const updateUserSchema = createUserSchema.omit({ senha: true });

export type UpdateUserSchema = z.infer<typeof updateUserSchema>;

/** Ativação/inativação (PATCH): só o status entra; outros campos são descartados. */
export const updateUserStatusSchema = z.object({
  ativo: z.boolean("ativo deve ser true ou false."),
});

export type UpdateUserStatusSchema = z.infer<typeof updateUserStatusSchema>;
