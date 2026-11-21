import PageHeader from "@/components/page-header";
import MyTeamTickets from "@/components/tickets/my-team-tickets";
import { GerenciarEquipeDialog } from "@/components/equipe/gerenciar-equipe-dialog";
import { getTeamsTickets } from "@/lib/data/my-team";
import { getEquipeParaEdicao } from "@/lib/data/equipe";
import { podeEditarEquipe, podeVerMinhaEquipe } from "@/lib/access-control";
import { connection } from "next/server";
import { getUsuarioAtual } from "@/lib/data/sessao";
import { notFound } from "next/navigation";

export default async function Team() {
  // A equipe depende do usuário da requisição e não deve ser renderizada no build.
  await connection();

  const usuario = await getUsuarioAtual();
  if (!podeVerMinhaEquipe(usuario?.cargo)) notFound();
  const [{ equipeNome, tickets }, dadosEdicao] = await Promise.all([
    usuario
      ? getTeamsTickets(usuario.id)
      : { equipeNome: "Sem equipe", tickets: [] },
    // Só o gestor edita a equipe: para os demais nem buscamos os dados do modal.
    podeEditarEquipe(usuario?.cargo) && usuario?.equipeId
      ? getEquipeParaEdicao(usuario.equipeId)
      : null,
  ]);

  return (
    <>
      <PageHeader
        other={
          dadosEdicao && (
            <GerenciarEquipeDialog
              equipe={dadosEdicao.equipe}
              tecnicosDisponiveis={dadosEdicao.tecnicosDisponiveis}
            />
          )
        }
      >
        Minha Equipe: <span className="font-light!">{equipeNome}</span>
      </PageHeader>
      <MyTeamTickets tickets={tickets} />
    </>
  );
}
