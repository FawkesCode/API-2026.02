import dotenv from 'dotenv';
import { prisma } from '../prisma';

import path from 'path';
import CreateTransporter from './default-classes/transporter';

dotenv.config({ path: path.resolve(process.cwd(), 'src', '.env') });
const transporter = CreateTransporter.transporter

export default class EmailManagerService{
    private managerId: string
    private ticketId: string

    constructor(managerId: string, ticketId: string){
        this.managerId= managerId
        this.ticketId=ticketId
    }
       
        public async sendMail(){
            const managerInfo = await prisma.usuario.findFirst({
                where:{
                    id:this.managerId,
                    cargo:"GESTOR",
                    ativo:true
                },
                select:{
                    nome:true,
                    email:true,
                    ativo:true,
                }
            })
            if (!managerInfo || !managerInfo.ativo) {
                throw new Error("Perfil inativo ou não encontrado.");
            }

            const ticketInfo = await prisma.ticket.findFirst({
                where: {
                    id: this.ticketId,
                },
                select: {
                    titulo: true,
                    categoria: true,
                    prioridade: true,
                    status: true,
                    projeto: {
                        select: {
                            nome: true
                        }
                    }
                },
            });

            if (!ticketInfo) {
                throw new Error("Ticket não encontrado.");
            }

            const dataAtribuicao = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

            const text = `Olá, ${managerInfo.nome}!

Um novo ticket foi atribuído ao seu time. Confira os detalhes abaixo:

--------------------------------------------------
Título:     ${ticketInfo.titulo}
Projeto:    ${ticketInfo.projeto.nome}
Categoria:  ${ticketInfo.categoria}
Prioridade: ${ticketInfo.prioridade}
Status:     ${ticketInfo.status}
Data/Hora:  ${dataAtribuicao}
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
          Olá, <strong>${managerInfo.nome}</strong>!
        </p>
        <p style="font-size: 14px; margin: 0 0 24px 0; color: #475569; line-height: 1.5;">
          Um novo ticket foi atribuído ao seu time. Abaixo estão as informações detalhadas:
        </p>

        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; margin-bottom: 24px;">
          <tbody>
            <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #0369a1; width: 30%;">Título</td>
              <td style="padding: 12px 16px; font-size: 14px; color: #0f172a; font-weight: 500;">${ticketInfo.titulo}</td>
            </tr>
            <tr style="background-color: #ffffff; border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #0369a1;">Projeto</td>
              <td style="padding: 12px 16px; font-size: 14px; color: #334155; font-weight: 500;">${ticketInfo.projeto.nome}</td>
            </tr>
            <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #0369a1;">Categoria</td>
              <td style="padding: 12px 16px; font-size: 14px; color: #334155;">${ticketInfo.categoria}</td>
            </tr><tr style="background-color: #ffffff; border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #0369a1;">Prioridade</td>
              <td style="padding: 12px 16px; font-size: 14px; color: #334155;">${ticketInfo.prioridade}</td>
            </tr>
            <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #0369a1;">Status</td>
              <td style="padding: 12px 16px; font-size: 14px; color: #334155; font-weight: 500;">${ticketInfo.status}</td>
            </tr>
            <tr style="background-color: #ffffff; border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #0369a1;">Atribuído em</td>
              <td style="padding: 12px 16px; font-size: 14px; color: #334155; font-weight: 500;">${dataAtribuicao}</td>
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
                to: managerInfo.email,
                subject: `Ticket atribuido ao seu time ${ticketInfo.titulo}`,
                text:text,
                html:html,
              });
          
              console.log(`E-mail enviado com sucesso! ID: ${info.messageId}`);
              return { success: true, messageId: info.messageId };
            } catch (error) {
              console.error('Erro ao enviar e-mail:', error);
              return { success: false, error };
            
}
        }                                       
   
}
