import { z } from "zod";

export const tecnicoSelecionadoSchema = z.object({
  // A checagem de UUID fica no servidor; aqui só garantimos que veio um id.
  value: z.string().min(1),
  label: z.string().min(1),
  adicionadoEm: z.string().optional(),
});

/** Validação do formulário "Gerenciar equipe" (cliente). Reaplicar no endpoint. */
export const equipeFormSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(1, "Informe o nome da equipe.")
    .max(100, "O nome deve ter no máximo 100 caracteres."),
  descricao: z
    .string()
    .trim()
    .max(255, "A descrição deve ter no máximo 255 caracteres."),
  tecnicos: z.array(tecnicoSelecionadoSchema),
});

export type EquipeFormValues = z.infer<typeof equipeFormSchema>;