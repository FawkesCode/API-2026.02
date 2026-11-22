import { Prisma, type PrismaClient } from "@/lib/generated/prisma/client";
import type { CriarTicketSchema } from "@/schemas/ticket.schema";

/**
 * Integração com as rotinas do banco `bdr_api` (3ª avaliação de BDR, Parte 5).
 *
 * Com USAR_ROTINAS_BDR=true a API passa a:
 *  - abrir tickets pela procedure `sp_abrir_ticket` (CALL), que valida as
 *    regras, grava ticket + equipe do projeto + histórico + atividade da conta
 *    numa transação e devolve o id no parâmetro OUT;
 *  - trazer o indicador `situacaoSla` calculado pela function
 *    `fn_situacao_sla(ticket_id)`.
 *
 * Sem a variável (ou no banco de dev, que não tem as rotinas) nada muda.
 */
export function rotinasBdrAtivas() {
  return process.env.USAR_ROTINAS_BDR === "true";
}

export const SITUACOES_SLA = [
  "NO_PRAZO",
  "EM_ALERTA",
  "VENCIDO",
  "CUMPRIDO",
  "VIOLADO",
] as const;

export type SituacaoSla = (typeof SITUACOES_SLA)[number];

/** Erro de regra de negócio levantado pela procedure (SIGNAL SQLSTATE '45000'). */
export class ErroRegraDoBanco extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ErroRegraDoBanco";
  }
}

// MySQL devolve SIGNAL SQLSTATE '45000' com o código 1644 (ER_SIGNAL_EXCEPTION).
function mensagemDoSignal(erro: unknown): string | null {
  if (!(erro instanceof Prisma.PrismaClientKnownRequestError)) return null;
  const causa = (
    erro.meta as
      | { driverAdapterError?: { cause?: { originalCode?: string; originalMessage?: string } } }
      | undefined
  )?.driverAdapterError?.cause;
  return causa?.originalCode === "1644" ? (causa.originalMessage ?? null) : null;
}

/**
 * CALL sp_abrir_ticket(...) e devolve o id do ticket criado (parâmetro OUT).
 *
 * O OUT fica numa variável de sessão (@ticket_id), então o CALL e o SELECT
 * precisam rodar na mesma conexão: o $transaction serve só para fixar a
 * conexão do pool. A atomicidade das gravações é da própria procedure
 * (START TRANSACTION ... COMMIT / ROLLBACK + RESIGNAL).
 */
export async function abrirTicketPelaProcedure(
  db: PrismaClient,
  dados: CriarTicketSchema,
): Promise<string> {
  try {
    return await db.$transaction(async (tx) => {
      await tx.$executeRaw`
        CALL sp_abrir_ticket(${dados.projetoId}, ${dados.abertoPorId},
             ${dados.titulo}, ${dados.descricao}, ${dados.categoria},
             ${dados.prioridade ?? null}, ${dados.slaEm}, @ticket_id)`;
      const [linha] = await tx.$queryRaw<{ id: string }[]>`
        SELECT @ticket_id AS id`;
      return linha.id;
    });
  } catch (erro) {
    const mensagem = mensagemDoSignal(erro);
    if (mensagem) throw new ErroRegraDoBanco(mensagem);
    throw erro;
  }
}

/** SELECT fn_situacao_sla(id) para cada ticket, numa única consulta. */
export async function buscarSituacoesSla(
  db: PrismaClient,
  ticketIds: string[],
): Promise<Map<string, SituacaoSla | null>> {
  if (!ticketIds.length) return new Map();
  const linhas = await db.$queryRaw<
    { id: string; situacao: SituacaoSla | null }[]
  >`SELECT id, fn_situacao_sla(id) AS situacao
      FROM tickets WHERE id IN (${Prisma.join(ticketIds)})`;
  return new Map(linhas.map((l) => [l.id, l.situacao]));
}

/** Acrescenta `situacaoSla` aos tickets quando as rotinas do BDR estão ativas. */
export async function comSituacaoSla<T extends { id: string }>(
  db: PrismaClient,
  tickets: T[],
): Promise<(T & { situacaoSla?: SituacaoSla | null })[]> {
  if (!rotinasBdrAtivas()) return tickets;
  const situacoes = await buscarSituacoesSla(
    db,
    tickets.map((t) => t.id),
  );
  return tickets.map((t) => ({
    ...t,
    situacaoSla: situacoes.get(t.id) ?? null,
  }));
}
