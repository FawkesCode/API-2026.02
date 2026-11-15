import { prisma } from "../lib/prisma";

import CreateTransporter from "./default-classes/transporter";

const transporter = CreateTransporter.transporter;

function escaparHtml(valor: string) {
  return valor.replace(/[&<>"']/g, (caractere) => {
    const entidades: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entidades[caractere];
  });
}

export default class EmailManagerService {
  private dados: {
    ticketId: string;
    destinatarios?: { nome: string; email: string }[];
    managerId?: string;
    relatorio?: string;
  };

  constructor(
    dados: {
      ticketId: string;
      destinatarios: { nome: string; email: string }[];
      relatorio?: string;
    },
  );
  /** Compatibilidade com o controlador antigo, hoje descontinuado. */
  constructor(managerId: string, ticketId: string);
  constructor(
    dadosOuManagerId:
      | string
      | {
          ticketId: string;
          destinatarios: { nome: string; email: string }[];
          relatorio?: string;
        },
    ticketIdLegado?: string,
  ) {
    this.dados =
      typeof dadosOuManagerId === "string"
        ? { managerId: dadosOuManagerId, ticketId: ticketIdLegado! }
        : dadosOuManagerId;
  }

  public async sendMail() {
    let destinatarios = this.dados.destinatarios;
    if (!destinatarios && this.dados.managerId) {
      const gestor = await prisma.usuario.findFirst({
        where: { id: this.dados.managerId, cargo: "GESTOR", ativo: true },
        select: { nome: true, email: true },
      });
      if (!gestor) throw new Error("Perfil inativo ou não encontrado.");
      destinatarios = [gestor];
    }
    if (!destinatarios?.length) throw new Error("Nenhum destinatário ativo.");

    const ticketInfo = await prisma.ticket.findFirst({
      where: {
        id: this.dados.ticketId,
      },
      select: {
        titulo: true,
        descricao: true,
        categoria: true,
        prioridade: true,
        status: true,
        projeto: {
          select: {
            nome: true,
          },
        },
      },
    });

    if (!ticketInfo) {
      throw new Error("Ticket não encontrado.");
    }

    const dataAtribuicao = new Date().toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
    });
    const nomesDestinatarios = destinatarios.map(({ nome }) => nome).join(", ");
    const nomesDestinatariosHtml = escaparHtml(nomesDestinatarios);
    const relatorio = this.dados.relatorio?.trim() || ticketInfo.descricao;
    const relatorioHtml = escaparHtml(relatorio).replace(/\r?\n/g, "<br />");
    const tituloTicketHtml = escaparHtml(ticketInfo.titulo);
    const nomeProjetoHtml = escaparHtml(ticketInfo.projeto.nome);
    const categoriaHtml = escaparHtml(ticketInfo.categoria);
    const prioridadeHtml = escaparHtml(ticketInfo.prioridade);
    const statusHtml = escaparHtml(ticketInfo.status);
    const dataAtribuicaoHtml = escaparHtml(dataAtribuicao);

    const text = `Olá, ${nomesDestinatarios}!

Um novo ticket foi atribuído ao seu time. Confira os detalhes abaixo:

--------------------------------------------------
Título:     ${ticketInfo.titulo}
Projeto:    ${ticketInfo.projeto.nome}
Categoria:  ${ticketInfo.categoria}
Prioridade: ${ticketInfo.prioridade}
Status:     ${ticketInfo.status}
Data/Hora:  ${dataAtribuicao}
Relatório / razão do acionamento:
${relatorio}
--------------------------------------------------

Acesse o sistema para mais detalhes.`;

    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Novo Ticket Atribuído</title>
</head>
<body style="margin: 0; padding: 24px; background-color: #f0f7ff; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 77, 153, 0.1); border: 1px solid #dbeafe;">
    <tr>
      <td style="background-color: #0284c7; padding: 24px 32px; text-align: left;">
        <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 600;">Notificação de Ticket</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 32px;">
        <p style="font-size: 16px; margin: 0 0 16px 0; color: #0f172a;">
          Olá, <strong>${nomesDestinatariosHtml}</strong>!
        </p>
        <p style="font-size: 14px; margin: 0 0 24px 0; color: #475569; line-height: 1.5;">
          Um novo ticket foi atribuído ao seu time. Abaixo estão as informações detalhadas:
        </p>

        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; margin-bottom: 24px;">
          <tbody>
            <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #0369a1; width: 30%;">Título</td>
              <td style="padding: 12px 16px; font-size: 14px; color: #0f172a; font-weight: 500;">${tituloTicketHtml}</td>
            </tr>
            <tr style="background-color: #ffffff; border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #0369a1;">Projeto</td>
              <td style="padding: 12px 16px; font-size: 14px; color: #334155; font-weight: 500;">${nomeProjetoHtml}</td>
            </tr>
            <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #0369a1;">Categoria</td>
              <td style="padding: 12px 16px; font-size: 14px; color: #334155;">${categoriaHtml}</td>
            </tr><tr style="background-color: #ffffff; border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #0369a1;">Prioridade</td>
              <td style="padding: 12px 16px; font-size: 14px; color: #334155;">${prioridadeHtml}</td>
            </tr>
            <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #0369a1;">Status</td>
              <td style="padding: 12px 16px; font-size: 14px; color: #334155; font-weight: 500;">${statusHtml}</td>
            </tr>
            <tr style="background-color: #ffffff; border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #0369a1;">Atribuído em</td>
              <td style="padding: 12px 16px; font-size: 14px; color: #334155; font-weight: 500;">${dataAtribuicaoHtml}</td>
            </tr>
            <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #0369a1; vertical-align: top;">Relatório / razão do acionamento</td>
              <td style="padding: 12px 16px; font-size: 14px; color: #334155;">${relatorioHtml}</td>
            </tr>
          </tbody>
        </table>

        <p style="font-size: 13px; color: #64748b; margin: 0; line-height: 1.4;">
          Por favor, acesse a plataforma para gerenciar o ticket e delegar para a sua equipe.
        </p>
      </td>
    </tr>
    <tr>
      <td style="background-color: #f1f5f9; padding: 16px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0; font-size: 12px; color: #94a3b8;">
          Este é um e-mail automático enviado pelo sistema de chamados.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
`;

    try {
      const info = await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: destinatarios.map(({ email }) => email),
        subject: `Ticket atribuido ao seu time ${ticketInfo.titulo}`,
        text: text,
        html: html,
      });

      console.log(`E-mail enviado com sucesso! ID: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("Erro ao enviar e-mail:", error);
      return { success: false, error };
    }
  }
}
