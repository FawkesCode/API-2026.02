"use client";

import { ProjectFormDialog } from "./project-form-dialog";
import ProjectCard from "./project-card";
import { useRouter } from "next/navigation";
import { SelectInterface } from "@/lib/data/dropdown";
import { use } from "react";

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
  projects: ProjectInfo[];
  clients: SelectInterface[];
  supervisors: SelectInterface[];
}

function ProjectsView({ projects, clients, supervisors }: ProjectsClientProps) {
  const router = useRouter();

  function handleSuccess() {
    router.refresh();
  }

  return (
    <>
      <div className="flex justify-end pb-4">
        <ProjectFormDialog
          onSuccess={handleSuccess}
          clientsData={clients}
          supervisorsData={supervisors}
        />
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
