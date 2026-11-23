import { Prisma, StatusTicket } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import CreateTransporter from "@/services/default-classes/transporter";
import { janelaAlertaSlaMs, MAIOR_JANELA_ALERTA_MS } from "@/lib/sla-alert-window";

const RESERVA_EXPIRA_MS = 10 * 60 * 1000;

export async function processarAlertasSla(agora = new Date(), ticketId?: string, emailDeTeste?: string) {
  const limite = new Date(agora.getTime() + MAIOR_JANELA_ALERTA_MS);
  const tickets = await prisma.ticket.findMany({
    where: {
      ...(ticketId ? { id: ticketId } : {}),
      status: { not: StatusTicket.ENCERRADO },
      slaEm: { gt: agora, lte: limite },
    },
    select: {
      id: true,
      titulo: true,
      slaEm: true,
      criadoEm: true,
      projeto: {
        select: {
          nome: true,
          gestor: { select: { nome: true, email: true, ativo: true } },
        },
      },
    },
    orderBy: { slaEm: "asc" },
  });

  const resumo = { encontrados: tickets.length, enviados: 0, ignorados: 0, falhas: 0 };
  for (const ticket of tickets) {
    const tempoRestante = ticket.slaEm.getTime() - agora.getTime();
    if (tempoRestante > janelaAlertaSlaMs(ticket.criadoEm, ticket.slaEm)) {
      resumo.ignorados++;
      continue;
    }
    if (!ticket.projeto.gestor.ativo) {
      resumo.ignorados++;
      continue;
    }

    let reservado = false;
    try {
      await prisma.alertaSla.create({
        data: { ticketId: ticket.id, slaEm: ticket.slaEm, reservadoEm: agora },
      });
      reservado = true;
    } catch (erro) {
      if (!(erro instanceof Prisma.PrismaClientKnownRequestError) || erro.code !== "P2002") {
        throw erro;
      }
      const retomado = await prisma.alertaSla.updateMany({
        where: {
          ticketId: ticket.id,
          slaEm: ticket.slaEm,
          enviadoEm: null,
          reservadoEm: { lt: new Date(agora.getTime() - RESERVA_EXPIRA_MS) },
        },
        data: { reservadoEm: agora },
      });
      reservado = retomado.count === 1;
    }
    if (!reservado) {
      resumo.ignorados++;
      continue;
    }

    try {
      const atual = await prisma.ticket.findUnique({
        where: { id: ticket.id },
        select: { status: true, slaEm: true },
      });
      if (!atual || atual.status === StatusTicket.ENCERRADO ||
          atual.slaEm.getTime() !== ticket.slaEm.getTime() || atual.slaEm <= agora) {
        await prisma.alertaSla.deleteMany({ where: { ticketId: ticket.id, slaEm: ticket.slaEm, enviadoEm: null } });
        resumo.ignorados++;
        continue;
      }

      const remetente = process.env.EMAIL_USER;
      if (!remetente || !process.env.EMAIL_PASS) throw new Error("SMTP não configurado.");
      const prazo = ticket.slaEm.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
      await CreateTransporter.transporter.sendMail({
        from: remetente,
        to: emailDeTeste ?? ticket.projeto.gestor.email,
        subject: `${emailDeTeste ? "[TESTE] " : ""}Alerta de SLA: ${ticket.titulo}`,
        text: `Olá, ${ticket.projeto.gestor.nome}!\n\nO SLA do ticket "${ticket.titulo}" do projeto "${ticket.projeto.nome}" termina em ${prazo}. Acesse a plataforma para acompanhar o atendimento.`,
      });
      await prisma.alertaSla.update({
        where: { ticketId_slaEm: { ticketId: ticket.id, slaEm: ticket.slaEm } },
        data: { enviadoEm: new Date() },
      });
      resumo.enviados++;
    } catch (erro) {
      console.error(`[alerta-sla] Falha no ticket ${ticket.id}:`, erro);
      await prisma.alertaSla.deleteMany({ where: { ticketId: ticket.id, slaEm: ticket.slaEm, enviadoEm: null } });
      resumo.falhas++;
    }
  }
  return resumo;
}
