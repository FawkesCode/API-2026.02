"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogDivider,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import {
  FormInput,
  FormSelect,
  FormTextarea,
} from "@/components/form/form-field";
import { TecnicosSelecionados } from "@/components/equipe/tecnicos-selecionados";
import type { SelectInterface } from "@/lib/data/dropdown";
import {
  equipeFormSchema,
  type EquipeFormValues,
} from "@/schemas/equipe-form.schema";
import type { EquipeEdicao } from "@/types/equipe";

/**
 * CONEXÃO PENDENTE: contrato esperado do endpoint.
 *   PATCH /api/equipes/:id
 *   body: { nome: string; descricao: string; tecnicosIds: string[] }
 *   sucesso: 2xx | erro: { erro: string } (mensagem exibida no modal)
 */
const urlEquipe = (id: string) => `/api/equipes/${id}`;

const MENSAGEM_ERRO_PADRAO =
  "Não foi possível salvar as alterações. Tente novamente.";

interface GerenciarEquipeDialogProps {
  equipe: EquipeEdicao;
  tecnicosDisponiveis: SelectInterface[];
}

export function GerenciarEquipeDialog({
  equipe,
  tecnicosDisponiveis,
}: GerenciarEquipeDialogProps) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);
  const [avisoTecnico, setAvisoTecnico] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EquipeFormValues>({
    resolver: zodResolver(equipeFormSchema),
    // `values` mantém o formulário em sincronia com a equipe atualizada
    // depois do router.refresh().
    values: {
      nome: equipe.nome,
      descricao: equipe.descricao,
      tecnicos: equipe.tecnicos,
    },
  });

  function aoMudarAbertura(valor: boolean) {
    setAberto(valor);
    if (!valor) {
      reset();
      setErroEnvio(null);
      setAvisoTecnico(null);
    }
  }

  async function aoEnviar(data: EquipeFormValues) {
    setErroEnvio(null);

    let mensagem = MENSAGEM_ERRO_PADRAO;
    try {
      const res = await fetch(urlEquipe(equipe.id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: data.nome,
          descricao: data.descricao,
          tecnicosIds: data.tecnicos.map((t) => t.value),
        }),
      });

      if (res.ok) {
        setAberto(false);
        toast.add({
          type: "success",
          title: "Equipe atualizada",
          description: "As alterações da equipe foram salvas.",
        });
        router.refresh();
        return;
      }

      const corpo = await res.json().catch(() => null);
      mensagem = corpo?.erro ?? corpo?.message ?? mensagem;
    } catch {
      // Falha de rede: mantém a mensagem padrão.
    }

    setErroEnvio(mensagem);
  }

  return (
    <Dialog open={aberto} onOpenChange={aoMudarAbertura}>
      <DialogTrigger
        render={
          <button
            type="button"
            aria-label="Editar equipe"
            className="grid size-9 place-items-center rounded-md border border-muted-foreground/40 bg-muted/50 text-muted-foreground transition-colors hover:text-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          />
        }
      >
        <Pencil className="size-4" />
      </DialogTrigger>

      <DialogContent className="flex max-h-[90vh] max-w-[38rem] flex-col gap-5 overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Gerenciar equipe <span className="italic">{equipe.nome}</span>
          </DialogTitle>
          <DialogDivider />
          <DialogDescription>
            Você pode editar os técnicos que fazem parte da sua equipe, o nome
            e a descrição da mesma.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(aoEnviar)}
          className="flex flex-col"
          noValidate
        >
          <DialogBody>
            <div className="flex flex-col gap-4 sm:flex-row">
              <FormInput
                label="Nome:"
                placeholder="Digite o nome da equipe..."
                error={errors.nome?.message}
                {...register("nome")}
              />
              <FormInput
                label="Responsável:"
                value={equipe.responsavel}
                readOnly
                className="w-full cursor-not-allowed bg-muted/60 text-muted-foreground"
              />
            </div>

            <FormTextarea
              label="Descrição:"
              placeholder="Digite a descrição da equipe..."
              rows={5}
              error={errors.descricao?.message}
              {...register("descricao")}
            />

            <Controller
              control={control}
              name="tecnicos"
              render={({ field }) => (
                <div className="flex flex-col gap-4">
                  <FormSelect
                    label="Alterar técnicos da equipe:"
                    options={tecnicosDisponiveis}
                    value={null}
                    error={avisoTecnico ?? undefined}
                    onChange={(tecnico) => {
                      if (!tecnico) return;
                      const jaAdicionado = field.value.some(
                        (t) => t.value === tecnico.value,
                      );
                      if (jaAdicionado) {
                        setAvisoTecnico("Técnico já adicionado.");
                        return;
                      }
                      setAvisoTecnico(null);
                      field.onChange([
                        ...field.value,
                        { ...tecnico, adicionadoEm: new Date().toISOString() },
                      ]);
                    }}
                  />
                  <TecnicosSelecionados
                    tecnicos={field.value}
                    onRemover={(id) => {
                      setAvisoTecnico(null);
                      field.onChange(field.value.filter((t) => t.value !== id));
                    }}
                  />
                </div>
              )}
            />
          </DialogBody>

          {erroEnvio && (
            <p
              role="alert"
              className="mt-3 text-sm font-medium text-destructive"
            >
              {erroEnvio}
            </p>
          )}

          <DialogFooter>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-w-56 rounded-xl bg-accent text-white hover:bg-cyan-400"
            >
              {isSubmitting ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}