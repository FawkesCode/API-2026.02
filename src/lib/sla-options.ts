/**
 * O backend (`criarTicketSchema`) espera `slaEm` como uma data futura,
 * não uma duração. O mockup mostra "SLA estimado" como um select — aqui
 * ele é uma lista de prazos pré-definidos, convertidos para uma data
 * absoluta na hora do submit.
 */
export const SLA_OPTIONS = [
  { value: "4h", label: "4 horas", horas: 4 },
  { value: "8h", label: "8 horas", horas: 8 },
  { value: "24h", label: "1 Dia", horas: 24 },
  { value: "48h", label: "2 Dias", horas: 48 },
  { value: "72h", label: "3 dias", horas: 72 },
  { value: "168h", label: "7 dias", horas: 168 },
] as const;

export type SlaPresetValue = (typeof SLA_OPTIONS)[number]["value"];

export function calcularSlaEm(valor: string): Date | null {
  const opcao = SLA_OPTIONS.find((o) => o.value === valor);
  if (!opcao) return null;
  return new Date(Date.now() + opcao.horas * 60 * 60 * 1000);
}
