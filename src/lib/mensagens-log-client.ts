import { criarMensagemPadraoLogSchema } from "@/schemas/mensagem-padrao-log.schema";

/** Mensagem padrão de log como o endpoint `/api/mensagens-log` devolve (datas em ISO). */
export interface MensagemPadraoLog {
  id: string;
  mensagem: string;
  criadoEm: string;
  atualizadoEm: string;
}

const ENDPOINT = "/api/mensagens-log";

async function erroDaResposta(resposta: Response, falha: string) {
  const corpo = await resposta.json().catch(() => null);
  return new Error(typeof corpo?.erro === "string" ? corpo.erro : falha);
}

/** Lista as mensagens padrão do usuário logado, da mais recente para a mais antiga. */
export async function listarMensagensLog(): Promise<MensagemPadraoLog[]> {
  const falha = "Não foi possível carregar as mensagens padrão. Tente novamente.";
  const resposta = await fetch(ENDPOINT, { cache: "no-store" }).catch(() => {
    throw new Error(falha);
  });
  if (!resposta.ok) throw await erroDaResposta(resposta, falha);
  return resposta.json();
}

/**
 * Valida (mesmo schema do back: sem vazio/só espaços, até 10.000 caracteres)
 * e cadastra uma mensagem padrão para o usuário logado.
 */
export async function cadastrarMensagemLog(mensagem: string): Promise<MensagemPadraoLog> {
  const validacao = criarMensagemPadraoLogSchema.safeParse({ mensagem });
  if (!validacao.success) {
    throw new Error(validacao.error.issues[0]?.message ?? "Mensagem inválida.");
  }

  const falha = "Não foi possível salvar a mensagem. Tente novamente.";
  const resposta = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(validacao.data),
  }).catch(() => {
    throw new Error(falha);
  });
  if (!resposta.ok) throw await erroDaResposta(resposta, falha);
  return resposta.json();
}

/**
 * Mescla mensagens já presentes na tela com a lista carregada da API,
 * preservando no topo cadastros feitos antes da listagem inicial terminar
 * e evitando duplicatas pelo `id`.
 */
export function mesclarMensagensLog(
  atuais: MensagemPadraoLog[],
  carregadas: MensagemPadraoLog[],
): MensagemPadraoLog[] {
  const idsCarregados = new Set(carregadas.map((m) => m.id));
  const locais = atuais.filter((m) => !idsCarregados.has(m.id));
  return [...locais, ...carregadas];
}
