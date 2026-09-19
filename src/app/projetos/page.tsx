import { servicoProjeto } from "@/lib/services/projeto.service";
import PageHeader from "@/components/page-header";
import ProjectsView, { ProjectInfo } from "@/components/projects/projects-view";

export default async function Projects() {
  const projects = await servicoProjeto.listarAtivos();
  // console.log(
  //   await servicoProjeto.buscarDetalhePorId(
  //     "55a5d73f-254c-411f-8a5b-da7b19f23b1e",
  //   ),
  // );

  const initialProjects: ProjectInfo[] = projects.map((p) => ({
    id: p.id,
    title: p.nome,
    client: p.cliente.nome,
    location: p.localInstalacao,
    description: "nada",
    ticketCount: 0,
    createdBy: "-",
  }));

  return (
    <>
      <PageHeader>Projetos</PageHeader>
      <ProjectsView initialProjects={initialProjects} />
    </>
  );
}
