import { z } from "zod";

export const changePasswordSchema = z.object({
  novaSenha: z
    .string()
    .min(8, "Senha deve ter pelo menos 8 caracteres.")
    .regex(/[A-Z]/, "Senha deve conter ao menos uma letra maiúscula.")
    .regex(/[a-z]/, "Senha deve conter ao menos uma letra minúscula.")
    .regex(/\d/, "Senha deve conter ao menos um número.")
    .regex(/[^A-Za-z0-9]/, "Senha deve conter ao menos um caractere especial."),
});
