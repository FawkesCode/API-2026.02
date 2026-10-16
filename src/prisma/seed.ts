import "dotenv/config";
import { hash } from "bcryptjs";
import { EMAIL_GESTOR_SEED, EMAIL_MASSA_SEED } from "../lib/dev-users";
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
  const seedDevelopmentUsers =
    process.env.NODE_ENV !== "production" && process.env.production !== "true";
  const senhaGestor = seedDevelopmentUsers
    ? await hash("Gestor@123", 12)
    : "senha-fake-para-teste";
  const senhaTecnico = seedDevelopmentUsers
    ? await hash("Tecnico@123", 12)
    : "hirosh-ima";

  const resultado = await prisma.$transaction(async (tx) => {
    const equipe = await tx.equipe.upsert({
      where: { nome: "Equipe Massa" },
      create: {
        nome: "Equipe Massa",
        descricao: "Equipe de instalação e manutenção do Massa.",
      },
      update: {},
    });

    const email = EMAIL_MASSA_SEED;
    const massa = await tx.usuario.upsert({
      where: { email },
      create: {
        nome: "Fernando",
        email,
        senhaHash: senhaTecnico,
        cargo: Cargo.TECNICO,
        senhaProvisoria: false,
        equipeId: equipe.id,
      },
      update: {
        ativo: true,
        cargo: Cargo.TECNICO,
        equipeId: equipe.id,
        ...(seedDevelopmentUsers
          ? { senhaHash: senhaTecnico, senhaProvisoria: false }
          : {}),
      },
    });

    const gestor = await tx.usuario.upsert({
      where: { email: EMAIL_GESTOR_SEED },
      create: {
        nome: "Kami-sama",
        email: EMAIL_GESTOR_SEED,
        senhaHash: senhaGestor,
        cargo: Cargo.GESTOR,
        senhaProvisoria: false,
        equipeId: equipe.id,
      },
      update: {
        ativo: true,
        cargo: Cargo.GESTOR,
        equipeId: equipe.id,
        ...(seedDevelopmentUsers
          ? { senhaHash: senhaGestor, senhaProvisoria: false }
          : {}),
      },
    });

    if (seedDevelopmentUsers) {
      const contasDeTeste = [
        {
          nome: "Usuário de Teste",
          email: "teste@gmail.com",
          senha: "teste123",
          cargo: Cargo.TECNICO,
          equipeId: equipe.id,
          senhaProvisoria: true,
        },
        {
          nome: "Suporte de Teste",
          email: "suporte.seed@example.com",
          senha: "Suporte@123",
          cargo: Cargo.SUPORTE,
          equipeId: null,
          senhaProvisoria: false,
        },
        {
          nome: "Comercial de Teste",
          email: "comercial.seed@example.com",
          senha: "Comercial@123",
          cargo: Cargo.COMERCIAL,
          equipeId: null,
          senhaProvisoria: false,
        },
      ];

      for (const conta of contasDeTeste) {
        await tx.usuario.upsert({
          where: { email: conta.email },
          create: {
            nome: conta.nome,
            email: conta.email,
            senhaHash: await hash(conta.senha, 12),
            cargo: conta.cargo,
            equipeId: conta.equipeId,
            senhaProvisoria: conta.senhaProvisoria,
          },
          update: {
            nome: conta.nome,
            ativo: true,
            cargo: conta.cargo,
            equipeId: conta.equipeId,
            senhaHash: await hash(conta.senha, 12),
            senhaProvisoria: conta.senhaProvisoria,
          },
        });
      }
    }

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
  if (seedDevelopmentUsers) {
    console.log("Credenciais locais: teste@gmail.com / teste123 (troca obrigatória)");
    console.log("Gestor: gestor.seed@example.com / Gestor@123");
    console.log("Suporte: suporte.seed@example.com / Suporte@123");
    console.log("Comercial: comercial.seed@example.com / Comercial@123");
    console.log("Técnico: fernando@massanori.japa / Tecnico@123");
  }
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
