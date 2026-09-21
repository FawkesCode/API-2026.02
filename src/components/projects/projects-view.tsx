"use client";

import { useState } from "react";
import { ProjectFormDialog, ProjectFormValues } from "./project-form-dialog";
import ProjectCard from "./project-card";

export interface ProjectInfo {
  id: string;
  title: string;
  client: string;
  location: string;
  description: string;
  ticketCount: number;
  createdBy: string;
}

interface ProjectsClientProps {
  initialProjects: ProjectInfo[];
}

function ProjectsView({ initialProjects }: ProjectsClientProps) {
  const [projects, setProjects] = useState<Array<ProjectInfo>>(initialProjects);

  function handleCreateProject(id: string, data: ProjectFormValues) {
    setProjects((prev) => [
      {
        id: id,
        title: data.nomeProjeto,
        client: data.cliente,
        location: data.localInstalacao,
        description: data.descricao,
        ticketCount: 0,
        createdBy: "—",
      },
      ...prev,
    ]);
  }

  return (
    <>
      <div className="flex justify-end pb-4">
        <ProjectFormDialog onSubmitProject={handleCreateProject} />
      </div>
      <section className="grid grid-cols-1 md:grid-cols-2  xl:grid-cols-4  gap-4 pb-8">
        {projects.length !== 0 ? (
          projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))
        ) : (
          <p className="col-span-full text-sm text-muted-foreground">
            Nenhum projeto registrado ainda. Realize o cadastro de um para
            começar a gerenciar os tickets atribuídos a ele.
          </p>
        )}
      </section>
    </>
  );
}
export default ProjectsView;
