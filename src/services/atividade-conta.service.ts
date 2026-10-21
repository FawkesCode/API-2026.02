import { prisma } from "@/lib/prisma";

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
      tipo: item.evento.startsWith("PRIORIDADE") ? "TICKET" : "LOG",
      descricao: `${item.descricao} — ticket ${item.ticket.titulo}`,
      criadoEm: item.criadoEm,
    })),
  ].sort((a, b) => b.criadoEm.getTime() - a.criadoEm.getTime()).slice(0, 20);
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
