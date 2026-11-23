import { z } from "zod";

/**
 * Acesso do front às mensagens padrão de log do usuário logado
 * (GET /api/mensagens-log). O cadastro fica na própria API (POST na mesma rota).
 */
export interface MensagemPadraoLog {
  id: string;
  mensagem: string;
}

const respostaSchema = z.array(
  z.object({ id: z.string(), mensagem: z.string() }),
);

export const FALHA_LISTAR_MENSAGENS_PADRAO =
  "Não foi possível carregar as mensagens padrão.";

export async function listarMensagensPadraoLog(
  sinal?: AbortSignal,
): Promise<MensagemPadraoLog[]> {
  const resposta = await fetch("/api/mensagens-log", { signal: sinal }).catch(
    (falha) => {
      if (sinal?.aborted) throw falha;
      throw new Error(FALHA_LISTAR_MENSAGENS_PADRAO);
    },
  );

  if (!resposta.ok) {
    const corpo = await resposta.json().catch(() => null);
    throw new Error(
      typeof corpo?.erro === "string" ? corpo.erro : FALHA_LISTAR_MENSAGENS_PADRAO,
    );
  }

  const dados = respostaSchema.safeParse(await resposta.json().catch(() => null));
  if (!dados.success) throw new Error(FALHA_LISTAR_MENSAGENS_PADRAO);

  return dados.data.map(({ id, mensagem }) => ({ id, mensagem }));
}

/**
 * Converte texto puro em parágrafos do Tiptap. Inserir como nós de texto (e não
 * como HTML) evita que o conteúdo salvo seja interpretado como marcação.
 */
export function textoParaParagrafos(texto: string) {
  return texto.split(/\r?\n/).map((linha) => ({
    type: "paragraph" as const,
    ...(linha ? { content: [{ type: "text" as const, text: linha }] } : {}),
  }));
}
