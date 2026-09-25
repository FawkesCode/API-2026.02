import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { z } from "zod";

const sessaoSchema = z.object({
  usuarioId: z.uuid(),
  exp: z.number().int().positive(),
});

type DadosTokenSessao = z.infer<typeof sessaoSchema>;

function obterSegredoDaSessao() {
  const segredo = process.env.SESSION_SECRET;
  if (!segredo) {
    throw new Error("SESSION_SECRET não está configurada.");
  }
  return segredo;
}

function codificar(valor: object) {
  return Buffer.from(JSON.stringify(valor)).toString("base64url");
}

function decodificar<T>(valor: string): T | null {
  try {
    return JSON.parse(Buffer.from(valor, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

function assinar(conteudo: string) {
  return createHmac("sha256", obterSegredoDaSessao()).update(conteudo).digest("base64url");
}

function extrairToken(requisicao: Request) {
  const authorization = requisicao.headers.get("authorization");
  if (authorization?.startsWith("Bearer ")) {
    return authorization.slice("Bearer ".length);
  }

  const cookies = requisicao.headers.get("cookie");
  return cookies
    ?.split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith("session="))
    ?.slice("session=".length);
}

/**
 * Valida um token de sessão assinado pelo servidor e retorna a identidade
 * comprovada por ele. O ID do usuário nunca é aceito do corpo da requisição.
 */
function verificarToken(token: string | undefined | null) {
  if (!token) return null;

  const [cabecalhoCodificado, payloadCodificado, assinatura, ...restante] = token.split(".");
  if (!cabecalhoCodificado || !payloadCodificado || !assinatura || restante.length > 0) {
    return null;
  }

  try {
    const assinaturaEsperada = assinar(`${cabecalhoCodificado}.${payloadCodificado}`);
    const assinaturaRecebida = Buffer.from(assinatura, "base64url");
    const assinaturaEsperadaBuffer = Buffer.from(assinaturaEsperada, "base64url");
    if (
      assinaturaRecebida.length !== assinaturaEsperadaBuffer.length ||
      !timingSafeEqual(assinaturaRecebida, assinaturaEsperadaBuffer)
    ) {
      return null;
    }
  } catch {
    return null;
  }

  const cabecalho = decodificar<{ alg?: string }>(cabecalhoCodificado);
  const resultado = sessaoSchema.safeParse(decodificar(payloadCodificado));
  if (!cabecalho || cabecalho.alg !== "HS256" || !resultado.success) {
    return null;
  }

  if (resultado.data.exp <= Math.floor(Date.now() / 1000)) {
    return null;
  }

  return { usuarioId: resultado.data.usuarioId };
}

/**
 * Retorna a identidade comprovada por um token de sessão assinado pelo servidor.
 * O ID do usuário nunca é aceito do corpo da requisição.
 */
export function obterSessaoDaRequisicao(requisicao: Request) {
  return verificarToken(extrairToken(requisicao));
}

/**
 * Mesma verificação de `obterSessaoDaRequisicao`, mas para uso em Server
 * Components / Server Actions, onde não há um `Request` disponível e o
 * cookie precisa ser lido via `next/headers`.
 */
export async function obterSessaoAtual() {
  const cookieStore = await cookies();
  return verificarToken(cookieStore.get("session")?.value);
}

/** Cria o token que deve ser gravado pelo fluxo de login em cookie HttpOnly. */
export function criarTokenDeSessao(dados: DadosTokenSessao) {
  const cabecalho = codificar({ alg: "HS256", typ: "JWT" });
  const payload = codificar(sessaoSchema.parse(dados));
  const conteudo = `${cabecalho}.${payload}`;
  return `${conteudo}.${assinar(conteudo)}`;
}
