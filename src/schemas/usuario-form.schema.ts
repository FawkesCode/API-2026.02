import { z } from "zod";
import { Cargo } from "@/types/ticket-enums";
import type { SelectInterface } from "@/lib/data/dropdown";

export const OPCOES_TIPO_CONTA: SelectInterface[] = [
  { label: "Suporte Interno", value: Cargo.SUPORTE_INTERNO },
  { label: "Comercial", value: Cargo.COMERCIAL },
  { label: "Suporte Externo", value: Cargo.SUPORTE },
  { label: "Gestor", value: Cargo.GESTOR },
  { label: "Técnico", value: Cargo.TECNICO },
];

export const REGRAS_SENHA = [
  {
    id: "tamanhoMinimo",
    label: "Mínimo de 8 caracteres.",
    validar: (senha: string) => senha.length >= 8,
  },
  {
    id: "minuscula",
    label: "Pelo menos uma letra minúscula.",
    validar: (senha: string) => /[a-z]/.test(senha),
  },
  {
    id: "maiuscula",
    label: "Pelo menos uma letra maiúscula.",
    validar: (senha: string) => /[A-Z]/.test(senha),
  },
  {
    id: "numero",
    label: "Deve conter números.",
    validar: (senha: string) => /\d/.test(senha),
  },
  {
    id: "especial",
    label: "Deve conter caracteres especiais.",
    validar: (senha: string) => /[^A-Za-z0-9]/.test(senha),
  },
] as const;

const tipoContaSelecionadaSchema = z.object({
  value: z.enum(Cargo, { message: "Selecione o tipo de conta." }),
  label: z.string().min(1),
});

export const usuarioFormSchema = z
  .object({
    email: z
      .string()
      .trim()
      .min(1, "Informe o e-mail.")
      .email("E-mail deve ter um formato válido.")
      .max(254, "O e-mail deve ter no máximo 254 caracteres."),
    nome: z
      .string()
      .trim()
      .min(1, "Informe o nome do usuário.")
      .max(120, "O nome deve ter no máximo 120 caracteres."),
    tipoConta: tipoContaSelecionadaSchema
      .nullable()
      .refine((val) => val !== null, {
        message: "Selecione o tipo de conta.",
      }),
    senha: z
      .string()
      .min(1, "Informe a senha.")
      .min(8, "A senha deve ter no mínimo 8 caracteres.")
      .regex(/[a-z]/, "A senha deve conter pelo menos uma letra minúscula.")
      .regex(/[A-Z]/, "A senha deve conter pelo menos uma letra maiúscula.")
      .regex(/\d/, "A senha deve conter números.")
      .regex(/[^A-Za-z0-9]/, "A senha deve conter caracteres especiais."),
    confirmarSenha: z.string().min(1, "Confirme a senha."),
  })
  .refine((data) => data.senha === data.confirmarSenha, {
    message: "As senhas não coincidem.",
    path: ["confirmarSenha"],
  });

export type UsuarioFormInput = z.input<typeof usuarioFormSchema>;
export type UsuarioFormValues = z.output<typeof usuarioFormSchema>;
