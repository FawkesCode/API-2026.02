import { servicoProjeto } from "@/lib/services/projeto.service";
import PageHeader from "@/components/page-header";
import ProjectsView, { ProjectInfo } from "@/components/projects/projects-view";

export default async function Projects() {
  const projects = await servicoProjeto.listarAtivos();
  if (!projects) return;

  const initialProjects: ProjectInfo[] = projects.map((p) => ({
    id: p.id,
    title: p.nome,
    client: p.cliente.nome,
    location: p.localInstalacao,
    description: "Sem descrição cadastrada",
    ticketCount: p._count.tickets,
    createdBy: p.gestor.nome,
  }));

  return (
    <>
      <PageHeader>Projetos</PageHeader>
      <ProjectsView initialProjects={initialProjects} />
    </>
  );
}
