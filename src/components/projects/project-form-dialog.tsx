"use client";

import * as React from "react";
import { Controller, useForm } from "react-hook-form";
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
import {
  FormInput,
  FormSelect,
  FormTextarea,
} from "@/components/form/form-field";
import { Plus } from "lucide-react";
import { SelectInterface } from "@/lib/data/dropdown";

export interface ProjectFormValues {
  nomeProjeto: string;
  gestor: SelectInterface | null;
  cliente: SelectInterface | null;
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
  clientsData: SelectInterface[];
  supervisorsData: SelectInterface[];
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
  open,
  onOpenChange,
  hideTrigger,
  onSuccess,
  clientsData,
  supervisorsData,
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
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormValues>({
    defaultValues: {
      nomeProjeto: "",
      gestor: null,
      cliente: null,
      localInstalacao: "",
      descricao: "",
    },
  });

  async function onSubmit(data: ProjectFormValues) {
    setSubmitError(null);
    try {
      const res = await fetch("/api/projetos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: data.nomeProjeto,
          gestorId: data.gestor?.value,
          localInstalacao: data.localInstalacao,
          clienteId: data.cliente?.value,
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
          <DialogBody className=" h-[85%]">
            <FormInput
              label="Nome do Projeto:"
              placeholder="Digite o nome do projeto..."
              required
              error={errors.nomeProjeto?.message}
              {...register("nomeProjeto", {
                required: "Informe o nome do projeto.",
                maxLength: {
                  value: 150,
                  message: "Máximo de 150 caracteres.",
                },
                validate: required("Informe o nome do projeto."),
              })}
            />

            <Controller
              control={control}
              name="gestor"
              rules={{ required: "Informe o gestor responsável." }}
              render={({ field }) => (
                <FormSelect
                  label="Gestor Responsável:"
                  options={supervisorsData}
                  required
                  error={errors.gestor?.message}
                  value={field.value}
                  onChange={field.onChange}
                  ref={field.ref}
                />
              )}
            />

            <div className="flex gap-2 w-full">
              <Controller
                control={control}
                name="cliente"
                rules={{ required: "Informe o cliente." }}
                render={({ field }) => (
                  <FormSelect
                    label="Cliente:"
                    options={clientsData}
                    required
                    error={errors.cliente?.message}
                    value={field.value}
                    onChange={field.onChange}
                    ref={field.ref}
                  />
                )}
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
