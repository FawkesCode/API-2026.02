import PageHeader from "@/components/page-header";
import MyTeamTickets from "@/components/tickets/my-team-tickets";
import { GerenciarEquipeDialog } from "@/components/equipe/gerenciar-equipe-dialog";
import DefaultPagination from "@/components/default-pagination";
import { getTeamsTickets } from "@/lib/data/my-team";
import { getEquipeParaEdicao } from "@/lib/data/equipe";
import { podeEditarEquipe, podeVerMinhaEquipe } from "@/lib/access-control";
import { connection } from "next/server";
import { getUsuarioAtual } from "@/lib/data/sessao";
import { notFound } from "next/navigation";

interface PageProps {
  searchParams: Promise<{
    pagina?: string;
    itensPorPagina?: string;
  }>;
}

export default async function Team({ searchParams }: PageProps) {
  await connection();

  const filters = await searchParams;
  const paginaAtual = Number(filters.pagina) || 1;
  const itensPorPaginaAtual = Number(filters.itensPorPagina) || 5;

  const usuario = await getUsuarioAtual();
  if (!podeVerMinhaEquipe(usuario?.cargo)) notFound();

  const [
    { equipeNome, itens, total, pagina, totalPaginas, itensPorPagina },
    dadosEdicao,
  ] = await Promise.all([
    usuario
      ? getTeamsTickets(usuario.id, {
          pagina: paginaAtual,
          itensPorPagina: itensPorPaginaAtual,
        })
      : {
          equipeNome: "Sem equipe",
          itens: [],
          total: 0,
          pagina: paginaAtual,
          totalPaginas: 0,
          itensPorPagina: itensPorPaginaAtual,
        },
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

      <div className=" flex flex-col h-full justify-between pb-8">
        <section className="flex flex-col gap-4 pb-8">
          <MyTeamTickets tickets={itens} />
        </section>
        {itens.length !== 0 && (
          <DefaultPagination
            page={pagina}
            totalPages={totalPaginas}
            total={total}
            itensPerPage={itensPorPagina}
          />
        )}
      </div>
    </>
  );
}
