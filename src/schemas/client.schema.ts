import { z } from "zod";

const CNPJ_WEIGHTS_FIRST = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const CNPJ_WEIGHTS_SECOND = [6, ...CNPJ_WEIGHTS_FIRST];

function checkDigit(digits: string, weights: number[]) {
  const sum = weights.reduce((acc, weight, i) => acc + Number(digits[i]) * weight, 0);
  const rest = sum % 11;
  return rest < 2 ? 0 : 11 - rest;
}

/** Confere tamanho, sequência repetida e os dois dígitos verificadores. */
export function isValidCnpj(digits: string) {
  if (!/^\d{14}$/.test(digits) || /^(\d)\1{13}$/.test(digits)) return false;
  return (
    checkDigit(digits, CNPJ_WEIGHTS_FIRST) === Number(digits[12]) &&
    checkDigit(digits, CNPJ_WEIGHTS_SECOND) === Number(digits[13])
  );
}

/**
 * Aceita CNPJ com ou sem máscara (12.345.678/0001-95 ou 12345678000195)
 * e devolve só os 14 dígitos.
 */
const cnpjSchema = z
  .string("CNPJ é obrigatório.")
  .trim()
  .min(1, "CNPJ é obrigatório.")
  .regex(/^[\d./-]+$/, "CNPJ deve conter apenas números, pontos, barra e hífen.")
  .transform((value) => value.replace(/\D/g, ""))
  .refine(isValidCnpj, "CNPJ inválido.");

export const createClientSchema = z.object({
  nome: z
    .string("Nome é obrigatório.")
    .trim()
    .min(1, "Nome é obrigatório.")
    .max(150, "Nome deve ter no máximo 150 caracteres."),
  cnpj: cnpjSchema,
  localizacao: z
    .string("Localização é obrigatória.")
    .trim()
    .min(1, "Localização é obrigatória.")
    .max(255, "Localização deve ter no máximo 255 caracteres."),
});

export type CreateClientSchema = z.infer<typeof createClientSchema>;
