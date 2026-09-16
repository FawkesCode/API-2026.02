import { prisma } from "@/lib/prisma";
import { Categoria, Prioridade, StatusTicket } from "@/lib/generated/prisma/client";
import type { CriarProjetoSchema } from "@/schemas/projeto.schema";

// TODO: substituir por regra oficial de SLA quando a US #11 (Indicador de SLA
// nos tickets) for implementada. Por ora, apenas garante um valor válido para
// a coluna `slaEm`, que é obrigatória no model Ticket.
const DIAS_SLA_INSTALACAO_PADRAO = 7;

function calcularSlaPadrao() {
  const sla = new Date();
  sla.setDate(sla.getDate() + DIAS_SLA_INSTALACAO_PADRAO);
  return sla;
}

export class ServicoProjeto {
  /**
   * Cria o projeto e, na mesma transação, o ticket de instalação (categoria
   * INSTALACAO) referente a ele, conforme US #1 / subtasks BACK #2 e BACK #3.
   */
  async criarComTicketDeInstalacao(dados: CriarProjetoSchema) {
    return prisma.$transaction(async (tx) => {
      const projeto = await tx.projeto.create({
        data: {
          nome: dados.nome,
          localInstalacao: dados.localInstalacao,
          clienteId: dados.clienteId,
          equipeId: dados.equipeId,
          gestorId: dados.gestorId,
        },
      });

      const ticketInstalacao = await tx.ticket.create({
        data: {
          titulo: `Instalação — ${dados.nome}`,
          descricao:
            dados.descricao?.trim() ||
            `Ticket de instalação gerado automaticamente para o projeto "${dados.nome}" (local: ${dados.localInstalacao}).`,
          categoria: Categoria.INSTALACAO,
          prioridade: Prioridade.MEDIA,
          status: StatusTicket.ABERTO,
          slaEm: calcularSlaPadrao(),
          projetoId: projeto.id,
          // TODO: revisar autoria quando houver usuário autenticado / usuário
          // de suporte padrão. Por ora, o gestor do projeto é o autor.
          abertoPorId: dados.gestorId,
        },
      });

      return { projeto, ticketInstalacao };
    });
  }

  /**
   * Busca o projeto e o ticket de instalação associado a ele (US #1 /
   * subtask BACK #3). Retorna `projeto: null` se o projeto não existir e
   * `ticketInstalacao: null` se o projeto existir mas ainda não tiver um
   * ticket de instalação.
   */
  async buscarProjetoComTicketDeInstalacao(projetoId: string) {
    const projeto = await prisma.projeto.findUnique({ where: { id: projetoId } });
    if (!projeto) {
      return { projeto: null, ticketInstalacao: null };
    }

    const ticketInstalacao = await prisma.ticket.findFirst({
      where: { projetoId, categoria: Categoria.INSTALACAO },
      orderBy: { criadoEm: "asc" },
    });

    return { projeto, ticketInstalacao };
  }
}

export const servicoProjeto = new ServicoProjeto();