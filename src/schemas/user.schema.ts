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
