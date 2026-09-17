import "dotenv/config";
import { prisma } from "@/lib/prisma";
import { Cargo } from "@/lib/generated/prisma/client";

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
      email: "gestor.teste@example.com",
      senhaHash: "senha-fake-para-teste",
      cargo: Cargo.GESTOR,
      equipeId: equipe.id,
    },
  });

  console.log("clienteId:", cliente.id);
  console.log("equipeId:", equipe.id);
  console.log("gestorId:", gestor.id);
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());