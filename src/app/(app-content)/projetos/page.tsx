import { servicoProjeto } from "@/services/projeto.service";
import ProjectsView from "@/components/projects/projects-view";
import { notFound } from "next/navigation";
import { getClients, getUsers } from "@/lib/data/dropdown";
import { getUsuarioAtual } from "@/lib/data/sessao";
import { podeCriarProjeto } from "@/lib/access-control";

async function getProjects(page?: number, itensPerPage?: number) {
  let itens, total, pagina, totalPaginas, itensPorPagina;

  try {
    ({ itens, total, pagina, totalPaginas, itensPorPagina } =
      await servicoProjeto.listarAtivosPaginado({
        pagina: page,
        itensPorPagina: itensPerPage,
      }));
  } catch (error) {
    console.error(`[getProjects] Erro ao buscar os projetos: ${error}`);
    throw new Error("Não foi possível carregar a lista de projetos.");
  }

  if (!itens) {
    notFound();
  }

  return {
    itens: itens.map((d) => ({
      id: d.id,
      title: d.nome,
      client: d.cliente?.nome ?? "Cliente não informado",
      location: d.localInstalacao,
      description: d.descricao ?? "",
      ticketCount: d._count?.tickets ?? 0,
      createdBy: d.gestor?.nome ?? "Sistema",
    })),
    total,
    pagina,
    totalPaginas,
    itensPorPagina,
  };
}

interface PageProps {
  searchParams: Promise<{ pagina?: string; itensPorPagina?: string }>;
}

export default async function Projects({ searchParams }: PageProps) {
  const {
    itens,
    total,
    pagina: paginaAtual,
    totalPaginas,
    itensPorPagina: tamanho,
  } = await getProjects();
  const { pagina, itensPorPagina } = await searchParams;
  const usuario = await getUsuarioAtual();
  const podeCriar = podeCriarProjeto(usuario?.cargo);
  const [clients, supervisors] = podeCriar
    ? await Promise.all([getClients(), getUsers()])
    : [[], []];

  return (
    <ProjectsView
      projects={itens}
      clients={clients}
      supervisors={supervisors}
      podeCriar={podeCriar}
      page={paginaAtual}
      totalPages={totalPaginas}
      total={total}
      itensPerPage={tamanho}
    />
  );
}
