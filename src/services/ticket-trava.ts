import type { Prisma, StatusTicket } from "@/lib/generated/prisma/client";

/**
 * Lê o status do ticket travando a linha até o fim da transação
 * (SELECT ... FOR UPDATE). Uma leitura comum não basta: no REPEATABLE READ do
 * MySQL, outra transação poderia encerrar o ticket entre a leitura e a escrita.
 * Chame antes das outras leituras do ticket na transação, para que elas já
 * enxerguem o estado mais recente.
 *
 * Retorna `null` quando o ticket não existe.
 */
export async function travarStatusDoTicket(
  tx: Prisma.TransactionClient,
  ticketId: string,
): Promise<StatusTicket | null> {
  const [linha] = await tx.$queryRaw<{ status: StatusTicket }[]>`
    SELECT status FROM tickets WHERE id = ${ticketId} FOR UPDATE`;
  return linha?.status ?? null;
}
