import { z } from "zod";
import { Cargo } from "@/lib/generated/prisma/client";

const dataIso = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .optional()
  .catch(undefined);

/**
 * Valida os parâmetros da URL (entrada não confiável). Valor inválido
 * vira "sem filtro" em vez de quebrar a página.
 */
export const filtrosUsuarioSchema = z.object({
  busca: z.string().trim().max(120).optional().catch(undefined),
  status: z.enum(["ativo", "inativo"]).optional().catch(undefined),
  cargo: z.enum(Cargo).optional().catch(undefined),
  data: dataIso,
  dataInicio: dataIso,
  dataFim: dataIso,
  pagina: z.coerce.number().int().min(1).catch(1),
});

export type FiltrosUsuario = z.infer<typeof filtrosUsuarioSchema>;

type ParametrosBrutos = Record<string, string | string[] | undefined>;

export function parseFiltrosUsuario(params: ParametrosBrutos): FiltrosUsuario {
  const plano = Object.fromEntries(
    Object.entries(params).map(([chave, valor]) => [
      chave,
      Array.isArray(valor) ? valor[0] : valor,
    ]),
  );
  return filtrosUsuarioSchema.parse(plano);
}