import { servicoProjeto } from "@/lib/services/projeto.service";
import PageHeader from "@/components/page-header";
import ProjectsView from "@/components/projects/projects-view";
import { notFound } from "next/navigation";
import { getClients, getUsers } from "@/lib/data/dropdown";

async function getProjects() {
  let data;

  try {
    data = await servicoProjeto.listarAtivos();
  } catch (error) {
    console.error(`[getProjects] Erro ao buscar os projetos: ${error}`);
    throw new Error("Não foi possível carregar a lista de projetos.");
  }

  if (!data) {
    notFound();
  }

  return data.map((d) => ({
    id: d.id,
    title: d.nome,
    client: d.cliente?.nome ?? "Cliente não informado",
    location: d.localInstalacao,
    description: d.descricao ?? "",
    ticketCount: d._count?.tickets ?? 0,
    createdBy: d.gestor?.nome ?? "Sistema",
  }));
}

export default async function Projects() {
  const initialProjects = await getProjects();
  const clients = await getClients();
  const supervisors = await getUsers();

  return (
    <ProjectsView
      projects={initialProjects}
      clients={clients}
      supervisors={supervisors}
    />
  );
}
