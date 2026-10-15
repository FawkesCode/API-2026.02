export function toIsoOrUndefined(value: Date | string): string | undefined {
  const date = typeof value === "string" ? new Date(value) : value;
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

const MESES_ABREVIADOS = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

/** Formata como no mockup: "21 de Out, 2026". Retorna "" se a data for inválida. */
export function formatarDataAdicao(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getDate()} de ${MESES_ABREVIADOS[date.getMonth()]}, ${date.getFullYear()}`;
}