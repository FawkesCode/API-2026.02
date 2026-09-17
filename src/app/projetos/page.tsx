"use client";
import { useState } from "react";
import PageHeader from "@/components/page-header";
import ProjectCard from "@/components/project-card";
import {
  ProjectFormDialog,
  type ProjectFormValues,
} from "@/components/project-form-dialog";

interface ProjectInfo {
  id: number;
  title: string;
  client: string;
  location: string;
  description: string;
  ticketCount: number;
  createdBy: string;
}

export default function Projects() {
  // Mock temporário apenas para testar visibilidade dos componentes | TODO: Substituir para os dados verdadeiros quando os endpoints estiverem concluídos
  const mock: Array<ProjectInfo> = [
    {
      id: 10,
      title: "Expansão Solar",
      client: "Vortex Energia",
      location: "Campinas, SP",
      description:
        "Instalação de 450 novos painéis fotovoltaicos e comissionamento dos inversores centrais.",
      ticketCount: 8,
      createdBy: "Lucas",
    },
    {
      id: 11,
      title: "Modernização HVAC",
      client: "Hospital Santa Clara",
      location: "Belo Horizonte, MG",
      description:
        "Substituição de switches centrais, configuração de firewall e passagem de cabeamento Cat6a nos racks.",
      ticketCount: 14,
      createdBy: "Mariana",
    },
    {
      id: 12,
      title: "Acesso Biométrico",
      client: "Nova FinTech",
      location: "São Paulo, SP",
      description:
        "Instalação de sensores térmicos IoT, atuadores automáticos e integração com o sistema central BMS.",
      ticketCount: 5,
      createdBy: "Rodrigo",
    },
    {
      id: 13,
      title: "Acesso Biométrico",
      client: "Nova FinTech",
      location: "São Paulo, SP",
      description:
        "Instalação de sensores térmicos IoT, atuadores automáticos e integração com o sistema central BMS.",
      ticketCount: 5,
      createdBy: "Rodrigo",
    },
  ];

  const [projects, setProjects] = useState<Array<ProjectInfo>>(mock);

  function handleCreateProject(data: ProjectFormValues) {
    setProjects((prev) => [
      {
        id: Math.max(0, ...prev.map((p) => p.id)) + 1,
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
      <PageHeader>Projetos</PageHeader>
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
