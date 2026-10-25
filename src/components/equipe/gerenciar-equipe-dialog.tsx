"use client";

import { useEffect, useMemo, useState } from "react";
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
import {
  equipeFormSchema,
  type EquipeFormValues,
} from "@/schemas/equipe-form.schema";
import type { EquipeEdicao, TecnicoDisponivelEquipe } from "@/types/equipe";

/**
 * Contrato do endpoint (BACK #1): PATCH /api/equipes/:id, validado por
 * `updateTeamSchema` em schemas/team.schema.ts.
 *   body: { nome: string; descricao: string; tecnicosIds: string[] }
 *   sucesso: 200 | erro: { erro: string; codigo: string } (`erro` aparece no modal)
 */
const urlEquipe = (id: string) => `/api/equipes/${id}`;

const MENSAGEM_ERRO_PADRAO =
  "Não foi possível salvar as alterações. Tente novamente.";

interface GerenciarEquipeDialogProps {
  equipe: EquipeEdicao;
  tecnicosDisponiveis: TecnicoDisponivelEquipe[];
}

export function GerenciarEquipeDialog({
  equipe,
  tecnicosDisponiveis,
}: GerenciarEquipeDialogProps) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);
  const [avisoTecnico, setAvisoTecnico] = useState<string | null>(null);

  // Referência estável: só muda quando a equipe vinda do servidor muda.
  const valoresIniciais = useMemo<EquipeFormValues>(
    () => ({
      nome: equipe.nome,
      descricao: equipe.descricao,
      tecnicos: equipe.tecnicos,
    }),
    [equipe.nome, equipe.descricao, equipe.tecnicos],
  );

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EquipeFormValues>({
    resolver: zodResolver(equipeFormSchema),
    defaultValues: valoresIniciais,
  });

  // Depois do router.refresh() a equipe chega atualizada: ressincroniza o
  // formulário (e o ponto de retorno do reset ao fechar o modal).
  useEffect(() => {
    reset(valoresIniciais);
  }, [reset, valoresIniciais]);

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

    const transferencias = data.tecnicos.flatMap((tecnico) => {
      const disponivel = tecnicosDisponiveis.find(
        (opcao) => opcao.value === tecnico.value,
      );
      if (!disponivel?.equipeId || disponivel.equipeId === equipe.id) return [];
      return [
        {
          nome: tecnico.label,
          equipe: disponivel.equipeNome ?? "outra equipe",
        },
      ];
    });

    if (transferencias.length > 0) {
      const resumo = transferencias
        .map(
          ({ nome, equipe: equipeAtual }) =>
            `• ${nome} (atualmente em ${equipeAtual})`,
        )
        .join("\n");
      const confirmar = window.confirm(
        `Os seguintes técnicos já pertencem a outra equipe:\n\n${resumo}\n\nSe continuar, eles serão transferidos para ${equipe.nome}. Deseja prosseguir?`,
      );
      if (!confirmar) return;
    }

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
      mensagem = corpo?.erro ?? mensagem;
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
            className="grid size-9 place-items-center rounded-xl border border-muted-foreground/40 bg-muted/50 text-muted-foreground transition-colors hover:text-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 roundex-xl cursor-pointer"
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
            Você pode editar os técnicos que fazem parte da sua equipe, o nome e
            a descrição da mesma.
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
