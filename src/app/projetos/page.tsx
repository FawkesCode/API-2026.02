"use client"

import * as React from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProjectFormDialog, ProjectFormValues } from "@/components/project-form-dialog"
import { ProjectCard } from "@/components/project-card"

interface Project extends ProjectFormValues {
  id: string
  codigo: string
}

export default function ProjectsPage() {
  const [projects, setProjects] = React.useState<Project[]>([])
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = React.useState(false)

  function handleCreateProject(data: ProjectFormValues) {
    // TODO: substituir por chamada ao endpoint (POST /projetos) quando disponível.
    const newProject: Project = {
      id: crypto.randomUUID(),
      codigo: `PRJ-${String(projects.length + 1).padStart(3, "0")}`,
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