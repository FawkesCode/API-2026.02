import type { LogItem } from "@/lib/mappers/historico.mapper";

/** A lista de tickets é ordenada do mais novo para o mais antigo. */
export function voltarParaPrimeiraPaginaDosTickets(url: URL): string | null {
  if (!/^\/tickets\/?$/.test(url.pathname) || !url.searchParams.has("pagina")) {
    return null;
  }

  const params = new URLSearchParams(url.search);
  params.delete("pagina");
  const busca = params.toString();
  return `${url.pathname}${busca ? `?${busca}` : ""}${url.hash}`;
}

/** O servidor prevalece; só ficam locais os registros ainda não recebidos na lista. */
export function reconciliarLogs(
  servidor: LogItem[],
  enviados: LogItem[],
): { logs: LogItem[]; pendentes: LogItem[] } {
  if (enviados.length === 0) return { logs: servidor, pendentes: enviados };

  const idsServidor = new Set(servidor.map((log) => log.id));
  const pendentes = enviados.filter((log) => !idsServidor.has(log.id));
  return {
    logs: pendentes.length
      ? [...servidor, ...pendentes].sort(
          (a, b) => a.criadoEm.getTime() - b.criadoEm.getTime(),
        )
      : servidor,
    pendentes,
  };
}
