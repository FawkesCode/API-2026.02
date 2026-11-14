import dotenv from "dotenv";
import { prisma } from "../lib/prisma";
import path from "path";
import CreateTransporter from "./default-classes/transporter";

dotenv.config({ path: path.resolve(process.cwd(), "src", ".env") });
const transporter = CreateTransporter.transporter;

export default class EmailManagerService {
  constructor(
    private readonly equipeId: string,
    private readonly ticketId: string,
    private readonly relatorio: string,
  ) {}

  public async sendMail() {
    const [equipe, ticketInfo] = await Promise.all([
      prisma.equipe.findUnique({
        where: { id: this.equipeId },
        select: {
          nome: true,
          usuarios: {
            where: { ativo: true },
            select: { nome: true, email: true },
          },
        },
      }),
      prisma.ticket.findUnique({
        where: { id: this.ticketId },
        select: {
          titulo: true,
          categoria: true,
          prioridade: true,
          status: true,
          projeto: { select: { nome: true } },
        },
      }),
    ]);

    if (!equipe) throw new Error("Equipe não encontrada.");
    if (!ticketInfo) throw new Error("Ticket não encontrado.");
    const destinatarios = equipe.usuarios.map((usuario) => usuario.email).filter(Boolean);
    if (destinatarios.length === 0) {
      console.warn(`Nenhum membro ativo encontrado para a equipe ${this.equipeId}.`);
      return { success: false, error: new Error("A equipe não possui membros ativos com e-mail.") };
    }

    const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    })[char]!);
    const relatorioSeguro = escapeHtml(this.relatorio);
    const dataAtribuicao = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
    const text = `Olá, time ${equipe.nome}!\n\nUm técnico mencionou sua equipe no ticket.\n\nRelatório do técnico — motivo do acionamento:\n${this.relatorio}\n\nTítulo: ${ticketInfo.titulo}\nProjeto: ${ticketInfo.projeto.nome}\nCategoria: ${ticketInfo.categoria}\nPrioridade: ${ticketInfo.prioridade}\nStatus: ${ticketInfo.status}\nData/Hora: ${dataAtribuicao}\n\nAcesse o sistema para mais detalhes.`;
    const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Time mencionado em ticket</title></head><body style="margin:0;padding:24px;background:#f0f7ff;font-family:Arial,sans-serif;color:#1e293b"><table align="center" width="100%" style="max-width:600px;background:#fff;border:1px solid #dbeafe;border-radius:8px"><tr><td style="background:#0284c7;padding:24px;color:#fff"><h1 style="margin:0;font-size:20px">Solicitação de suporte</h1></td></tr><tr><td style="padding:32px"><p>Olá, time <strong>${escapeHtml(equipe.nome)}</strong>!</p><p>Um técnico mencionou sua equipe no ticket <strong>${escapeHtml(ticketInfo.titulo)}</strong>.</p><h2 style="font-size:16px;color:#0369a1">Relatório do técnico — motivo do acionamento</h2><div style="white-space:pre-wrap;background:#f8fafc;padding:16px;border-radius:6px">${relatorioSeguro}</div><p><strong>Projeto:</strong> ${escapeHtml(ticketInfo.projeto.nome)}<br><strong>Categoria:</strong> ${escapeHtml(ticketInfo.categoria)}<br><strong>Prioridade:</strong> ${escapeHtml(ticketInfo.prioridade)}<br><strong>Status:</strong> ${escapeHtml(ticketInfo.status)}<br><strong>Data/Hora:</strong> ${dataAtribuicao}</p><p>Acesse o sistema para mais detalhes.</p></td></tr></table></body></html>`;

    try {
      const info = await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: destinatarios,
        subject: `Time ${equipe.nome} mencionado no ticket ${ticketInfo.titulo}`,
        text,
        html,
      });
      console.log(`E-mail enviado para ${destinatarios.length} membros. ID: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("Erro ao enviar e-mail:", error);
      return { success: false, error };
    }
  }
}
