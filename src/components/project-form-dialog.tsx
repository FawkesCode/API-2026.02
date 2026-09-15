"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDivider,
  DialogDescription,
  DialogBody,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { FormInput, FormTextarea } from "@/components/form/form-field"
import { Plus } from "lucide-react"

export interface ProjectFormValues {
  nomeProjeto: string
  cliente: string
  localInstalacao: string
  descricao: string
}

interface ProjectFormDialogProps {
  /** Chamado com os dados validados quando o formulário é enviado com sucesso. */
  onSubmitProject?: (data: ProjectFormValues) => Promise<void> | void
  /** Controle externo (opcional) do dialog. Se omitido, o componente controla seu próprio estado. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** Esconde o botão de gatilho interno quando o dialog é aberto de fora. */
  hideTrigger?: boolean
}

export function ProjectFormDialog({
  onSubmitProject,
  open,
  onOpenChange,
  hideTrigger,
}: ProjectFormDialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const isControlled = open !== undefined
  const dialogOpen = isControlled ? open : internalOpen

  function setDialogOpen(value: boolean) {
    if (isControlled) {
      onOpenChange?.(value)
    } else {
      setInternalOpen(value)
    }
  }

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormValues>({
    defaultValues: {
      nomeProjeto: "",
      cliente: "",
      localInstalacao: "",
      descricao: "",
    },
  })

  async function onSubmit(data: ProjectFormValues) {
    // Endpoint ainda não integrado: por enquanto só repassa os dados
    // validados pra quem estiver escutando (ex.: adicionar à lista local).
    await onSubmitProject?.(data)
    reset()
    setDialogOpen(false)
  }

  return (
    <Dialog
      open={dialogOpen}
      onOpenChange={(value) => {
        setDialogOpen(value)
        if (!value) reset()
      }}
    >
      {!hideTrigger && (
        <DialogTrigger
          render={<Button variant="default" className="bg-cyan-300 text-blue-950 hover:bg-cyan-400" />}
        >
          <Plus />
          Cadastrar Projeto
        </DialogTrigger>
      )}

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cadastrar novo Projeto</DialogTitle>
        </DialogHeader>
        <DialogDivider />
        <DialogDescription>Os campos com (*) são obrigatórios.</DialogDescription>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogBody>
            <FormInput
              label="Nome do Projeto:"
              placeholder="Digite o que o input pede..."
              required
              error={errors.nomeProjeto?.message}
              {...register("nomeProjeto", {
                required: "Informe o nome do projeto.",
              })}
            />

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 ">
              <FormInput
                label="Cliente:"
                placeholder="Digite o que o input pede..."
                required
                error={errors.cliente?.message}
                {...register("cliente", {
                  required: "Informe o cliente.",
                })}
              />
              <FormInput
                label="Local de Instalação:"
                placeholder="Digite o que o input pede..."
                required
                error={errors.localInstalacao?.message}
                {...register("localInstalacao", {
                  required: "Informe o local de instalação.",
                })}
              />
            </div>

            <FormTextarea
              label="Descrição"
              placeholder="Digite o que o input pede..."
              required
              error={errors.descricao?.message}
              {...register("descricao", {
                required: "Informe uma descrição.",
              })}
            />
          </DialogBody>

          <DialogFooter>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-accent text-white hover:bg-cyan-400 rounded-xl"
            >
              {isSubmitting ? "Cadastrando..." : "Cadastrar Projeto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}