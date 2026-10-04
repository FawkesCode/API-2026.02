import "dotenv/config";
import { prisma } from "../lib/prisma";
import {
  Cargo,
  Categoria,
  Prioridade,
  StatusTicket,
} from "../lib/generated/prisma/enums";

const projetos = [
  {
    nome: "Instalação de Câmeras",
    localInstalacao: "Sede do Cliente Demonstração",
    descricao: "Instalação e configuração do sistema de câmeras da sede.",
    categoria: Categoria.INSTALACAO,
    titulos: [
      "Organizar cabos das câmeras",
      "Instalar câmera na recepção",
      "Configurar gravador de vídeo",
      "Instalar câmera na entrada principal",
    ],
  },
  {
    nome: "Monitoramento",
    localInstalacao: "Centro de Monitoramento do Cliente Demonstração",
    descricao: "Manutenção dos equipamentos e do sistema de monitoramento.",
    categoria: Categoria.MANUTENCAO,
    titulos: [
      "Limpar lentes das câmeras",
      "Atualizar firmware dos equipamentos",
      "Corrigir alertas do monitoramento",
      "Restabelecer conexão da câmera principal",
    ],
  },
];

const prioridades = [
  Prioridade.BAIXA,
  Prioridade.MEDIA,
  Prioridade.ALTA,
  Prioridade.CRITICA,
];
const diasDeSla = [7, 3, 2, 1];

async function main() {
  const resultado = await prisma.$transaction(async (tx) => {
    const equipe = await tx.equipe.upsert({
      where: { nome: "Equipe Massa" },
      create: {
        nome: "Equipe Massa",
        descricao: "Equipe de instalação e manutenção do Massa.",
      },
      update: {},
    });

    const email = "fernando@massanori.japa";
    const massa = await tx.usuario.upsert({
      where: { email },
      create: {
        nome: "Fernando",
        email,
        senhaHash: "hirosh-ima",
        cargo: Cargo.TECNICO,
        equipeId: equipe.id,
      },
      update: { ativo: true, equipeId: equipe.id },
    });

    const gestor = await tx.usuario.upsert({
      where: { email: "gestor.seed@example.com" },
      create: {
        nome: "Kami-sama",
        email: "gestor.seed@example.com",
        senhaHash: "senha-fake-para-teste",
        cargo: Cargo.GESTOR,
        equipeId: equipe.id,
      },
      update: { ativo: true, cargo: Cargo.GESTOR, equipeId: equipe.id },
    });

    const cliente = await tx.cliente.upsert({
      where: { nome: "Cliente Demonstração" },
      create: { nome: "Cliente Demonstração" },
      update: {},
    });

    const agora = Date.now();
    const ticketsIds: string[] = [];

    for (const [projetoIndex, dados] of projetos.entries()) {
      const projeto = await tx.projeto.upsert({
        where: {
          clienteId_nome: { clienteId: cliente.id, nome: dados.nome },
        },
        create: {
          nome: dados.nome,
          localInstalacao: dados.localInstalacao,
          descricao: dados.descricao,
          clienteId: cliente.id,
          equipeId: equipe.id,
          gestorId: gestor.id,
        },
        update: { equipeId: equipe.id, gestorId: gestor.id },
      });

      for (const [ticketIndex, titulo] of dados.titulos.entries()) {
        // IDs estáveis permitem repetir o seed sem duplicar ou resetar tickets.
        const numero = projetoIndex * prioridades.length + ticketIndex + 1;
        const id = `d10c0000-0000-4000-8000-${String(numero).padStart(12, "0")}`;

        const ticket = await tx.ticket.upsert({
          where: { id },
          create: {
            id,
            titulo,
            descricao: `${titulo} no projeto ${dados.nome}, sob responsabilidade do Massa.`,
            categoria: dados.categoria,
            prioridade: prioridades[ticketIndex],
            status: ticketIndex < 2
              ? StatusTicket.NAO_INICIADO
              : StatusTicket.EM_ANDAMENTO,
            slaEm: new Date(agora + diasDeSla[ticketIndex] * 24 * 60 * 60 * 1000),
            projetoId: projeto.id,
            abertoPorId: gestor.id,
            responsavelId: massa.id,
          },
          update: {},
        });

        await tx.ticketEquipe.upsert({
          where: {
            ticketId_equipeId: { ticketId: ticket.id, equipeId: equipe.id },
          },
          create: { ticketId: ticket.id, equipeId: equipe.id },
          update: {},
        });

        ticketsIds.push(ticket.id);
      }
    }

    return { massa, gestor, equipe, cliente, ticketsIds };
  });

  console.log("Seed concluído: 1 equipe, 1 cliente, 2 projetos e 8 tickets.");
  console.log("Massa:", resultado.massa.email, "— ID:", resultado.massa.id);
  console.log("Gestor:", resultado.gestor.email, "— ID:", resultado.gestor.id);
  console.log("Equipe:", resultado.equipe.nome, "— ID:", resultado.equipe.id);
  console.log("Cliente:", resultado.cliente.nome, "— ID:", resultado.cliente.id);
  console.log("Tickets:", resultado.ticketsIds);
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
