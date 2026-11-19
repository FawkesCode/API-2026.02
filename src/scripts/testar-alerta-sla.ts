import "dotenv/config";
import { StatusTicket } from "../lib/generated/prisma/client";
import { prisma } from "../lib/prisma";
import { janelaAlertaSlaMs } from "../lib/sla-alert-window";
import { processarAlertasSla } from "../services/alerta-sla.service";

async function main() {
  const [opcao, ticketId] = process.argv.slice(2);
  if (opcao !== "--enviar" || !ticketId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ticketId)) {
    throw new Error("Uso: npm run sla:test -- --enviar <ID_DO_TICKET>");
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: { titulo: true, criadoEm: true, slaEm: true, status: true },
  });
  if (!ticket) throw new Error("Ticket não encontrado.");
  if (ticket.status === StatusTicket.ENCERRADO) throw new Error("Ticket encerrado não recebe alerta.");
  if (ticket.slaEm.getTime() <= Date.now()) throw new Error("O SLA desse ticket já venceu.");
  const emailDeTeste = process.env.EMAIL_USER;
  if (!emailDeTeste || !process.env.EMAIL_PASS) throw new Error("Configure EMAIL_USER e EMAIL_PASS no .env.");

  const janela = janelaAlertaSlaMs(ticket.criadoEm, ticket.slaEm);
  const inicioDaJanela = ticket.slaEm.getTime() - janela + 60_000;
  const agoraSimulado = new Date(Math.max(Date.now(), inicioDaJanela));
  console.info(`Testando somente o ticket "${ticket.titulo}" (${ticketId}).`);
  console.info(`Horário simulado: ${agoraSimulado.toISOString()}. O email será enviado de verdade para ${emailDeTeste}.`);

  const resumo = await processarAlertasSla(agoraSimulado, ticketId, emailDeTeste);
  console.info("Resultado:", resumo);
  if (resumo.enviados !== 1) {
    throw new Error("Nenhum email enviado. Confira se o gestor está ativo, se já houve alerta e os erros acima.");
  }
}

main()
  .catch((erro) => {
    console.error("[sla:test]", erro);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
