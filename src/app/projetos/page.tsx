import PageHeader from "@/components/page-header";
import ProjectCard from "@/components/project-card";

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
  const data: Array<ProjectInfo> = [
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

  return (
    <>
      <PageHeader title="Projetos" />
      <section className="grid grid-cols-1 md:grid-cols-2  xl:grid-cols-4  gap-4 pb-8">
        {data.length !== 0 ? (
          data.map((project) => (
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
