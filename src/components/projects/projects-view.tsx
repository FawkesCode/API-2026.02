"use client";

import { ProjectFormDialog } from "./project-form-dialog";
import ProjectCard from "./project-card";
import { useRouter } from "next/navigation";
import { SelectInterface } from "@/lib/data/dropdown";
import PageHeader from "../page-header";
import DefaultPagination from "../default-pagination";

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
  podeCriar: boolean;
  page: number;
  totalPages: number;
  total: number;
  shown?: number;
  itensPerPage: number;
}

function ProjectsView({
  projects,
  clients,
  supervisors,
  podeCriar,
  page,
  totalPages,
  total,
  itensPerPage,
}: ProjectsClientProps) {
  const router = useRouter();

  function handleSuccess() {
    router.refresh();
  }

  return (
    <>
      <PageHeader
        other={
          podeCriar ? (
            <div className="justify-self-end">
              <ProjectFormDialog
                onSuccess={handleSuccess}
                clientsData={clients}
                supervisorsData={supervisors}
              />
            </div>
          ) : undefined
        }
      >
        Projetos
      </PageHeader>

      <div className=" flex flex-col h-full justify-between pb-8">
        <section className="grid grid-cols-1 md:grid-cols-2  xl:grid-cols-4  gap-4 pb-4">
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
        {projects.length !== 0 && projects.length > 8 && (
          <DefaultPagination
            page={page}
            totalPages={totalPages}
            total={total}
            itensPerPage={itensPerPage}
          />
        )}
      </div>
    </>
  );
}
export default ProjectsView;
