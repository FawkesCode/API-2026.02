import PageHeader from "@/components/page-header";
import MyTeamTickets from "@/components/tickets/my-team-tickets";
import { getTeamsTickets } from "@/lib/data/my-team";
import { connection } from "next/server";
import { getUsuarioAtual } from "@/lib/data/sessao";

export default async function Team() {
  // A equipe depende do usuário da requisição e não deve ser renderizada no build.
  await connection();

  const usuario = await getUsuarioAtual();
  const { equipeNome, tickets } = usuario
    ? await getTeamsTickets(usuario.id)
    : { equipeNome: "Sem equipe", tickets: [] };

  return (
    <>
      <PageHeader>
        Minha Equipe: <span className="font-light!">{equipeNome}</span>
      </PageHeader>
      <MyTeamTickets tickets={tickets} />
    </>
  );
}
