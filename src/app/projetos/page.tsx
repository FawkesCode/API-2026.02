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

export default function ProjectsPage() {
  const [projects, setProjects] = React.useState<Project[]>([])
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  // Contador monotônico: não volta atrás se um projeto for removido.
  // TODO: o código definitivo deve ser gerado pelo backend.
  const nextCode = React.useRef(1)

  function handleCreateProject(data: ProjectFormValues) {
    // TODO: substituir por chamada ao endpoint (POST /projetos) quando disponível.
    const newProject: Project = {
      id: crypto.randomUUID(),
      codigo: `PRJ-${String(nextCode.current++).padStart(3, "0")}`,
      ...data,
    }
    setProjects((prev) => [newProject, ...prev])
  }

  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-2xl font-bold text-blue-950 italic">
            Todos os projetos
          </h2>
          <Button
            variant="default"
            className="bg-accent text-white hover:bg-cyan-400 rounded-xl"
            onClick={() => setDialogOpen(true)}
          >
            <Plus />
            Criar Novo
          </Button>
        </div>
        <div className="h-px w-full bg-gradient-to-r from-cyan-300 to-cyan-300/10" />
      </div>

      <ProjectFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        hideTrigger
        onSubmitProject={handleCreateProject}
      />

      {projects.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhum projeto cadastrado ainda. Clique em &quot;Criar Novo&quot; para começar.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              codigo={project.codigo}
              nome={project.nomeProjeto}
              cliente={project.cliente}
              localInstalacao={project.localInstalacao}
              descricao={project.descricao}
              selected={project.id === selectedId}
              onClick={() =>
                setSelectedId((prev) => (prev === project.id ? null : project.id))
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}