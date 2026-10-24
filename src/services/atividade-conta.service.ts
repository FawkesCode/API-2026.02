import { prisma } from "@/lib/prisma";

function formatarPrioridade(valor: string) {
  const nomes: Record<string, string> = {
    CRITICA: "Crítica",
    ALTA: "Alta",
    MEDIA: "Média",
    BAIXA: "Baixa",
  };
  return nomes[valor] ?? valor;
}

function formatarEventoHistorico(item: {
  evento: string;
  descricao: string;
  ticket: { titulo: string };
}) {
  const titulo = item.ticket.titulo;
  switch (item.evento) {
    case "ATIVIDADE_INICIADA":
      return {
        tipo: "LOG",
        descricao: `Enviou "Equipe iniciou trabalhos" para o ticket ${titulo}.`,
      };
    case "ENCERRAMENTO_SOLICITADO":
      return {
        tipo: "LOG",
        descricao: `Enviou "Solicitação de encerramento" para o ticket ${titulo}.`,
      };
    case "ENCERRAMENTO_APROVADO":
      return {
        tipo: "LOG",
        descricao: `Aprovou solicitação de encerramento do ticket ${titulo}.`,
      };
    case "ENCERRAMENTO_NEGADO":
      return {
        tipo: "LOG",
        descricao: `Recusou solicitação de encerramento do ticket ${titulo}.`,
      };
    case "PRIORIDADE_ALTERADA": {
      const match = item.descricao.match(/de\s+([A-Z_]+)\s+para\s+([A-Z_]+)/i);
      const antes = match
        ? formatarPrioridade(match[1].toUpperCase())
        : "desconhecida";
      const depois = match
        ? formatarPrioridade(match[2].toUpperCase())
        : "desconhecida";
      return {
        tipo: "TICKET",
        descricao: `Atualizou o status de prioridade do ticket ${titulo}. ${antes} → ${depois}`,
      };
    }
    default:
      return { tipo: "LOG", descricao: `Enviou log de título ${item.evento} para o ticket ${titulo}.` };
  }
}

export async function registrarAtividadeConta(
  usuarioId: string,
  tipo: string,
  descricao: string,
) {
  return prisma.atividadeConta.create({
    data: { usuarioId, tipo, descricao },
  });
}

export async function buscarPerfilComAtividades(usuarioId: string) {
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: {
      id: true,
      nome: true,
      email: true,
      cargo: true,
      ativo: true,
      criadoEm: true,
      atividadesConta: { orderBy: { criadoEm: "desc" }, take: 20 },
      eventosHistorico: {
        orderBy: { criadoEm: "desc" },
        take: 20,
        select: {
          id: true,
          evento: true,
          descricao: true,
          criadoEm: true,
          ticket: { select: { titulo: true } },
        },
      },
    },
  });
  if (!usuario) return null;
  const atividades = [
    ...usuario.atividadesConta.map((item) => ({
      id: item.id,
      tipo: item.tipo,
      descricao: item.descricao,
      criadoEm: item.criadoEm,
    })),
    ...usuario.eventosHistorico.map((item) => ({
      id: item.id,
      ...formatarEventoHistorico(item),
      criadoEm: item.criadoEm,
    })),
  ]
    .sort((a, b) => b.criadoEm.getTime() - a.criadoEm.getTime())
    .slice(0, 20);
  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    cargo: usuario.cargo,
    ativo: usuario.ativo,
    criadoEm: usuario.criadoEm,
    atividades,
  };
}
