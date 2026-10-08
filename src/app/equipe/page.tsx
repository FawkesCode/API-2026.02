import PageHeader from "@/components/page-header";
import MyTeamTickets from "@/components/tickets/my-team-tickets";
import { getTeamsTickets } from "@/lib/data/my-team";
import { connection } from "next/server";
import { USUARIO_MOCK } from "@/lib/auth/mock-user";

export default async function Team() {
  // A equipe depende do usuário da requisição e não deve ser renderizada no build.
  await connection();

  const { equipeNome, tickets } = await getTeamsTickets(USUARIO_MOCK.id);

  return (
    <>
      <PageHeader>
        Minha Equipe: <span className="font-light!">{equipeNome}</span>
      </PageHeader>
      <MyTeamTickets tickets={tickets} />
    </>
  );
}
