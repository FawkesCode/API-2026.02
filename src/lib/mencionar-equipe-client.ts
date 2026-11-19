export const LIMITE_RELATORIO_EQUIPE = 10_000;
export const EQUIPE_JA_ASSOCIADA = "Este time já está associado ao ticket.";

export async function mencionarEquipe(
  ticketId: string,
  equipeId: string,
  relatorio: string,
  equipesAssociadas: ReadonlySet<string>,
) {
  const motivo = relatorio.trim();
  if (!equipeId) throw new Error("Selecione um time.");
  if (equipesAssociadas.has(equipeId)) throw new Error(EQUIPE_JA_ASSOCIADA);
  if (!motivo) throw new Error("Informe a razão do acionamento.");
  if (motivo.length > LIMITE_RELATORIO_EQUIPE) {
    throw new Error("O relatório deve ter até 10.000 caracteres.");
  }

  const falha = "Não foi possível adicionar o time. Tente novamente.";
  const resposta = await fetch(`/api/tickets/${encodeURIComponent(ticketId)}/equipes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ equipeId, relatorio: motivo }),
  }).catch(() => {
    throw new Error(falha);
  });

  if (!resposta.ok) {
    const corpo = await resposta.json().catch(() => null);
    throw new Error(typeof corpo?.erro === "string" ? corpo.erro : falha);
  }
}
