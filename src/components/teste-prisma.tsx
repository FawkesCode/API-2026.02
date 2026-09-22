import { prisma } from "@/lib/prisma";

export default async function TesteUser() {
  const usuario = await prisma.usuario.findFirst({
    orderBy: {
      nome: "asc",
    },
    select: {
      nome: true,
      email: true,
    },
  });

  return (
    <section>
      <h1>Teste de conexão com o banco</h1>

      {usuario ? (
        <p>
          Primeiro usuário: {usuario.nome} ({usuario.email})
        </p>
      ) : (
        <p>Conexão realizada. Nenhum usuário cadastrado.</p>
      )}
    </section>
  );
}
