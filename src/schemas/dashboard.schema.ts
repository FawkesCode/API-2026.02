import { isValid, parseISO } from "date-fns";
import { z } from "zod";
import type { FiltrosDashboard } from "@/types/dashboard";

const REGEX_DATA_ISO = /^\d{4}-\d{2}-\d{2}$/;

function normalizarVazio(valor: unknown): unknown {
  if (typeof valor !== "string") return valor;
  const aparado = valor.trim();
  return aparado === "" ? undefined : aparado;
}

function normalizarEquipeId(valor: unknown): unknown {
  const normalizado = normalizarVazio(valor);
  if (
    typeof normalizado === "string" &&
    normalizado.toLowerCase() === "todas"
  ) {
    return undefined;
  }
  return normalizado;
}

function criarCampoUuidOpcional(nomeCampo: string) {
  return z.preprocess(
    normalizarVazio,
    z.uuid(`${nomeCampo} deve ser um UUID válido.`).optional(),
  );
}

function criarCampoDataOpcional(nomeCampo: string) {
  return z.preprocess(
    normalizarVazio,
    z
      .string()
      .regex(REGEX_DATA_ISO, `${nomeCampo} deve estar no formato YYYY-MM-DD.`)
      .refine(
        (valor) => isValid(parseISO(valor)),
        `${nomeCampo} deve representar uma data válida.`,
      )
      .optional(),
  );
}

export const filtrosDashboardSchema = z
  .object({
    equipeId: z.preprocess(
      normalizarEquipeId,
      z.uuid("equipeId deve ser um UUID válido.").optional(),
    ),
    usuarioId: criarCampoUuidOpcional("usuarioId"),
    projetoId: criarCampoUuidOpcional("projetoId"),
    clienteId: criarCampoUuidOpcional("clienteId"),
    data: criarCampoDataOpcional("data"),
    dataInicio: criarCampoDataOpcional("dataInicio"),
    dataFim: criarCampoDataOpcional("dataFim"),
  })
  .superRefine((dados, ctx) => {
    if (dados.dataInicio && dados.dataFim && dados.dataInicio > dados.dataFim) {
      ctx.addIssue({
        code: "custom",
        path: ["dataFim"],
        message: "dataFim não pode ser anterior a dataInicio.",
      });
    }
  });

export type FiltrosDashboardSchema = z.infer<typeof filtrosDashboardSchema>;

type ParametrosConsulta =
  | URLSearchParams
  | Record<string, string | string[] | undefined>;

export function validarFiltrosDashboard(params: ParametrosConsulta) {
  const bruto: Record<string, string | undefined> =
    params instanceof URLSearchParams
      ? {
          equipeId: params.get("equipeId") ?? undefined,
          usuarioId: params.get("usuarioId") ?? undefined,
          projetoId: params.get("projetoId") ?? undefined,
          clienteId: params.get("clienteId") ?? undefined,
          data: params.get("data") ?? undefined,
          dataInicio: params.get("dataInicio") ?? undefined,
          dataFim: params.get("dataFim") ?? undefined,
        }
      : {
          equipeId: Array.isArray(params.equipeId)
            ? params.equipeId[0]
            : params.equipeId,
          usuarioId: Array.isArray(params.usuarioId)
            ? params.usuarioId[0]
            : params.usuarioId,
          projetoId: Array.isArray(params.projetoId)
            ? params.projetoId[0]
            : params.projetoId,
          clienteId: Array.isArray(params.clienteId)
            ? params.clienteId[0]
            : params.clienteId,
          data: Array.isArray(params.data) ? params.data[0] : params.data,
          dataInicio: Array.isArray(params.dataInicio)
            ? params.dataInicio[0]
            : params.dataInicio,
          dataFim: Array.isArray(params.dataFim)
            ? params.dataFim[0]
            : params.dataFim,
        };

  return filtrosDashboardSchema.safeParse(bruto);
}

export type _CompatibilidadeFiltrosDashboard = FiltrosDashboardSchema extends FiltrosDashboard
  ? true
  : never;
