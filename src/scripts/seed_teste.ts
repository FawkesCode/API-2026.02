import "dotenv/config";
import { prisma } from "@/lib/prisma";
import { Cargo, Categoria, Prioridade, StatusTicket } from "@/lib/generated/prisma/client";

async function main() {
  const equipe = await prisma.equipe.create({
    data: { nome: "Equipe Suporte" },
  });

  const cliente = await prisma.cliente.create({
    data: { nome: "Empresa Teste LTDA" },
  });

  const gestor = await prisma.usuario.create({
    data: {
      nome: "Gestor Teste",
      email: "vbomfimcunha@gmail.com",
      senhaHash: "senha-fake-para-teste",
      cargo: Cargo.GESTOR,
      equipeId: equipe.id,
    },
  });

  const projeto = await prisma.projeto.create({
    data: {
      nome: "Projeto Teste",
      localInstalacao: "Sede Empresa Teste",
      clienteId: cliente.id,
      equipeId: equipe.id,
      gestorId: gestor.id,
    },
  });

  const ticketsData = Array.from({ length: 10 }).map((_, index) => ({
    titulo: `Ticket de Teste ${index + 1}`,
    descricao: `Descrição detalhada do problema ou instalação para o ticket de teste ${index + 1}.`,
    categoria: index % 2 === 0 ? Categoria.MANUTENCAO : Categoria.INSTALACAO,
    prioridade: [Prioridade.BAIXA, Prioridade.MEDIA, Prioridade.ALTA, Prioridade.CRITICA][index % 4],
    status: StatusTicket.NAO_INICIADO,
    slaEm: new Date(Date.now() + 1000 * 60 * 60 * 24 * (index + 1)),
    projetoId: projeto.id,
    abertoPorId: gestor.id,
  }));

  const ticketsCriados = [];
  for (const dados of ticketsData) {
    const ticket = await prisma.ticket.create({
      data: {
        ...dados,
        equipesAlocadas: {
          create: { equipeId: equipe.id },
        },
      },
      select: { id: true },
    });
    ticketsCriados.push(ticket);
  }

  console.log("=== SEED REALIZADO COM SUCESSO ===");
  console.log("gestorId:", gestor.id);
  console.log("Tickets IDs:");
  for (const [i, t] of ticketsCriados.entries()) {
    console.log(`  Ticket ${i + 1}: "${t.id}",`);
  }
  console.log("clienteId:", cliente.id);
  console.log("equipeId:", equipe.id);
  console.log("gestorId:", gestor.id);
  console.log("projetoId:", projeto.id);
  console.log("10 Tickets criados associados ao projeto e abertos pelo gestor!");
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());