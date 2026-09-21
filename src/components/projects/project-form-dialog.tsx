"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
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
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FormInput, FormTextarea } from "@/components/form/form-field";
import { Plus } from "lucide-react";

export interface ProjectFormValues {
  nomeProjeto: string;
  cliente: string;
  localInstalacao: string;
  descricao: string;
}

/** Regra compartilhada: rejeita string vazia ou só com espaços. */
function required(message: string) {
  return (value: string) => value.trim().length > 0 || message;
}

interface ProjectFormDialogBaseProps {
  /** Chamado com os dados validados quando o formulário é enviado com sucesso. */
  onSubmitProject?: (
    id: string,
    data: ProjectFormValues,
  ) => Promise<void> | void;
  /** Esconde o botão de gatilho interno quando o dialog é aberto de fora. */
  hideTrigger?: boolean;
  onSuccess: () => void;
}

// Se `open` for passado, `onOpenChange` passa a ser obrigatório — evita a
// configuração inválida de fornecer open sem forma de fechar o dialog.
type ProjectFormDialogProps =
  | (ProjectFormDialogBaseProps & {
      open: boolean;
      onOpenChange: (open: boolean) => void;
    })
  | (ProjectFormDialogBaseProps & {
      open?: undefined;
      onOpenChange?: undefined;
    });

export function ProjectFormDialog({
  onSubmitProject,
  open,
  onOpenChange,
  hideTrigger,
  onSuccess,
}: ProjectFormDialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = open !== undefined;
  const dialogOpen = isControlled ? open : internalOpen;

  const [submitError, setSubmitError] = React.useState<string | null>(null);

  function setDialogOpen(value: boolean) {
    if (isControlled) {
      onOpenChange?.(value);
    } else {
      setInternalOpen(value);
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
  });

  async function onSubmit(data: ProjectFormValues) {
    setSubmitError(null);
    try {
      // Fetch no lado do servidor n precisa da url completa
      const res = await fetch("/api/projetos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: data.nomeProjeto,
          localInstalacao: data.localInstalacao,
          clienteId: "588675ca-b3ae-11f1-9aeb-0ea8acf6b539",
          equipeId: "3c14cfc5-b3ae-11f1-9aeb-0ea8acf6b539",
          gestorId: "3c14cfc8-b3ae-11f1-9aeb-0ea8acf6b539",
        }),
      });

      if (!res.ok) {
        const errorServer = await res.json().catch(() => null);
        console.log(errorServer);
        throw new Error(
          errorServer?.message || "Falha na resposta do servidor",
        );
      }

      await res.json();

      reset();
      setDialogOpen(false);
      onSuccess?.();
    } catch (error) {
      setSubmitError("Não foi possível cadastrar o projeto. Tente novamente.");
    }
  }

  return (
    <Dialog
      open={dialogOpen}
      onOpenChange={(value) => {
        setDialogOpen(value);
        if (!value) {
          reset();
          setSubmitError(null);
        }
      }}
    >
      {!hideTrigger && (
        <DialogTrigger
          render={
            <Button
              variant="default"
              className="bg-cyan-300 text-blue-950 hover:bg-cyan-400"
            />
          }
        >
          <Plus />
          Cadastrar Projeto
        </DialogTrigger>
      )}

      <DialogContent className="h-[65vh] min-h-min  flex flex-col gap-5">
        <DialogHeader className="h-fit ">
          <DialogTitle>Cadastrar novo Projeto</DialogTitle>
          <DialogDivider />
          <DialogDescription>
            Os campos com (*) são obrigatórios.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex-1 flex flex-col"
          noValidate
        >
          <DialogBody className=" h-[80%]">
            <FormInput
              label="Nome do Projeto:"
              placeholder="Digite o nome do projeto..."
              required
              error={errors.nomeProjeto?.message}
              {...register("nomeProjeto", {
                required: "Informe o nome do projeto.",
                maxLength: { value: 150, message: "Máximo de 150 caracteres." },
                validate: required("Informe o nome do projeto."),
              })}
            />

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <FormInput
                label="Cliente:"
                placeholder="Digite o nome do cliente.."
                required
                error={errors.cliente?.message}
                {...register("cliente", {
                  required: "Informe o cliente.",
                  maxLength: {
                    value: 150,
                    message: "Máximo de 150 caracteres.",
                  },
                  validate: required("Informe o cliente."),
                })}
              />
              <FormInput
                label="Local de Instalação:"
                placeholder="Digite o local de instalação..."
                required
                error={errors.localInstalacao?.message}
                {...register("localInstalacao", {
                  required: "Informe o local de instalação.",
                  maxLength: {
                    value: 150,
                    message: "Máximo de 150 caracteres.",
                  },
                  validate: required("Informe o local de instalação."),
                })}
              />
            </div>

            <FormTextarea
              label="Descrição"
              placeholder="Digite uma descrição..."
              required
              error={errors.descricao?.message}
              {...register("descricao", {
                required: "Informe uma descrição.",
                maxLength: {
                  value: 1000,
                  message: "Máximo de 1000 caracteres.",
                },
                validate: required("Informe uma descrição."),
              })}
            />
          </DialogBody>

          {submitError && (
            <p
              role="alert"
              className="mt-3 text-sm font-medium text-destructive"
            >
              {submitError}
            </p>
          )}

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
  );
}
