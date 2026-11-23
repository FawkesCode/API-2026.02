const MINUTO = 60 * 1000;
const HORA = 60 * MINUTO;
const DIA = 24 * HORA;

// O prazo é calculado no cliente antes de o banco registrar criadoEm.
const TOLERANCIA_CADASTRO = 5 * MINUTO;

export const MAIOR_JANELA_ALERTA_MS = DIA;

export function janelaAlertaSlaMs(criadoEm: Date, slaEm: Date): number {
  const duracao = slaEm.getTime() - criadoEm.getTime();

  if (duracao > DIA + TOLERANCIA_CADASTRO) return DIA;
  if (duracao > 8 * HORA + TOLERANCIA_CADASTRO) return 4 * HORA;
  if (duracao > 4 * HORA + TOLERANCIA_CADASTRO) return 2 * HORA;
  return HORA;
}
