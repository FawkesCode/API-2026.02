"use client";

/**
 * PREMISSA A CONFERIR: `Dialog`/`Select` deste projeto embrulham
 * primitivos do Base UI (@base-ui/react), não Radix — vi isso em
 * priority-button.tsx. Não tive acesso a ui/dialog.tsx nem
 * ui/select.tsx, então usei a API "shadcn clássica"
 * (Dialog/DialogContent/DialogHeader/DialogTitle/DialogFooter e
 * Select/SelectTrigger/SelectValue/SelectContent/SelectItem), que é a
 * convenção mais comum mesmo sobre Base UI. Se os wrappers reais
 * exportarem nomes/props diferentes, ajuste só os imports e o JSX
 * desses dois blocos — o resto (validação, submit, estados de erro)
 * não muda.
 */
import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FormInput, FormTextarea } from "@/components/form/form-field";
import { FormLabel } from "@/components/form/form-label";
import { PrioritySelectField } from "@/components/tickets/priority-select-field";
import { EquipesMultiSelect } from "@/components/tickets/equipes-multi-select";
import { useProjetosDisponiveis } from "@/hooks/use-projetos-disponiveis";
import { useEquipes } from "@/hooks/use-equipes";
import { useCurrentUser } from "@/hooks/use-current-user";
import { SLA_OPTIONS, calcularSlaEm } from "@/lib/sla-options";
import { ticketFormSchema } from "@/schemas/ticket-form.schema";
import { Categoria, Prioridade } from "@/lib/ticket-enums";

const CATEGORIA_LABELS: Record<Categoria, string> = {
  [Categoria.INSTALACAO]: "Instalação",
  [Categoria.MANUTENCAO]: "Manutenção",
};

interface CamposFormulario {
  projetoId: string;
  titulo: string;
  descricao: string;
  categoria: Categoria | "";
  prioridade: Prioridade | "";
  slaPreset: string;
}

const CAMPOS_VAZIOS: CamposFormulario = {
  projetoId: "",
  titulo: "",
  descricao: "",
  categoria: "",
  prioridade: "",
  slaPreset: "",
};

interface AbrirTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Vem do passo de busca de projeto (project-search-select). */
  projetoInicialId?: string;
}

export function AbrirTicketDialog({
  open,
  onOpenChange,
  projetoInicialId,
}: AbrirTicketDialogProps) {
  const router = useRouter();
  const usuario = useCurrentUser();
  const { projetos } = useProjetosDisponiveis();

  const [campos, setCampos] = React.useState<CamposFormulario>({
    ...CAMPOS_VAZIOS,
    projetoId: projetoInicialId ?? "",
  });
  const [erros, setErros] = React.useState<
    Partial<Record<keyof CamposFormulario, string>>
  >({});
  const [erroSubmissao, setErroSubmissao] = React.useState<string | null>(
    null,
  );
  const [enviando, setEnviando] = React.useState(false);
  const { equipes, indisponivel: equipesIndisponivel } = useEquipes();
  const [equipesSelecionadas, setEquipesSelecionadas] = React.useState<string[]>([]);

  // Reseta o formulário sempre que o diálogo é reaberto — mantém os
  // campos preenchidos apenas durante uma mesma tentativa de envio.
  React.useEffect(() => {
    if (open) {
      setCampos({ ...CAMPOS_VAZIOS, projetoId: projetoInicialId ?? "" });
      setErros({});
      setErroSubmissao(null);
      setEquipesSelecionadas([]);
    }
  }, [open, projetoInicialId]);

  const projetoSelecionado = projetos.find((p) => p.id === campos.projetoId);

  // Pré-marca a equipe do projeto assim que ele é selecionado/trocado.
  React.useEffect(() => {
    if (projetoSelecionado) {
      setEquipesSelecionadas((atual) =>
        atual.includes(projetoSelecionado.equipeId)
          ? atual
          : [...atual, projetoSelecionado.equipeId],
      );
    }
  }, [projetoSelecionado]);

  const opcoesDeEquipe = equipesIndisponivel
    ? projetoSelecionado
      ? [
        {
          id: projetoSelecionado.equipeId,
          nome: projetoSelecionado.equipe?.nome ?? "Equipe do projeto",
        },
      ]
      : []
    : equipes;

  function atualizarCampo<K extends keyof CamposFormulario>(
    campo: K,
    valor: CamposFormulario[K],
  ) {
    setCampos((atual) => ({ ...atual, [campo]: valor }));
    setErros((atual) => ({ ...atual, [campo]: undefined }));
  }

  async function aoSubmeter(evento: React.FormEvent) {
    evento.preventDefault();
    setErroSubmissao(null);

    // Validação de campo obrigatório / formato — critério de aceite:
    // "formulário não é enviado; mensagem de erro aparece; campos preenchidos são mantidos".
    const resultado = ticketFormSchema.safeParse(campos);
    if (!resultado.success) {
      const novosErros: Partial<Record<keyof CamposFormulario, string>> = {};
      for (const issue of resultado.error.issues) {
        const chave = issue.path[0] as keyof CamposFormulario;
        if (!novosErros[chave]) novosErros[chave] = issue.message;
      }
      setErros(novosErros);
      return;
    }

    const slaEm = calcularSlaEm(resultado.data.slaPreset);
    if (!slaEm) {
      setErros((atual) => ({ ...atual, slaPreset: "Selecione um SLA válido." }));
      return;
    }

    setEnviando(true);
    console.log("USUARIO ATUAL:", usuario);
    console.log("ID DO USUARIO:", usuario.id);
    console.log("payload ticket:", {
      projetoId: resultado.data.projetoId,
      abertoPorId: usuario.id,
    });
    try {
      // Payload no formato que criarTicketSchema (backend) espera.
      const resposta = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: resultado.data.titulo,
          descricao: resultado.data.descricao,
          categoria: resultado.data.categoria,
          prioridade: resultado.data.prioridade,
          slaEm: slaEm.toISOString(),
          projetoId: resultado.data.projetoId,
          abertoPorId: usuario.id,
          equipeIds: equipesSelecionadas,
        }),
      });

      if (!resposta.ok) {
        // Critério de aceite: falha ao salvar -> mensagem de erro,
        // campos mantidos, ticket não aparece na fila (não navegamos).
        const corpo = await resposta.json().catch(() => null);
        setErroSubmissao(
          corpo?.erro ?? "Não foi possível salvar o ticket. Tente novamente.",
        );
        return;
      }

      const ticketCriado = await resposta.json();
      onOpenChange(false);
      // Reaproveita a tela de tickets do projeto, com foco visual no
      // ticket recém-criado via query param `ticketCriado`.
      router.push(
        `/projetos/${resultado.data.projetoId}?ticketCriado=${ticketCriado.id}`,
      );
    } catch {
      setErroSubmissao(
        "Falha de conexão ao salvar o ticket. Verifique sua internet e tente novamente.",
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-accent">Abrir Ticket</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground">
          Os campos com (*) são obrigatórios.
        </p>

        <form onSubmit={aoSubmeter} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <FormLabel required>Vincular Projeto</FormLabel>
            <Select
              value={campos.projetoId}
              onValueChange={(valor: string) => atualizarCampo("projetoId", valor)}
            >
              <SelectTrigger aria-invalid={!!erros.projetoId}>
                <SelectValue placeholder="Selecione uma opção" />
              </SelectTrigger>
              <SelectContent>
                {projetos.map((projeto) => (
                  <SelectItem key={projeto.id} value={projeto.id}>
                    {projeto.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {erros.projetoId && (
              <p role="alert" className="text-xs font-medium text-destructive">
                {erros.projetoId}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Título"
              required
              placeholder="Digite o que o input pede..."
              value={campos.titulo}
              onChange={(evento) =>
                atualizarCampo("titulo", evento.target.value)
              }
              error={erros.titulo}
            />

            <div className="flex flex-col gap-1.5">
              <FormLabel required>SLA estimado</FormLabel>
              <Select
                value={campos.slaPreset}
                onValueChange={(valor: string) => atualizarCampo("slaPreset", valor)}
              >
                <SelectTrigger aria-invalid={!!erros.slaPreset}>
                  <SelectValue placeholder="Selecione uma opção" />
                </SelectTrigger>
                <SelectContent>
                  {SLA_OPTIONS.map((opcao) => (
                    <SelectItem key={opcao.value} value={opcao.value}>
                      {opcao.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {erros.slaPreset && (
                <p role="alert" className="text-xs font-medium text-destructive">
                  {erros.slaPreset}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <FormLabel required>Tipo</FormLabel>
            <Select
              value={campos.categoria}
              onValueChange={(valor) =>
                atualizarCampo("categoria", valor as Categoria)
              }
            >
              <SelectTrigger aria-invalid={!!erros.categoria}>
                <SelectValue placeholder="Selecione uma opção" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(Categoria).map((categoria) => (
                  <SelectItem key={categoria} value={categoria}>
                    {CATEGORIA_LABELS[categoria]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {erros.categoria && (
              <p role="alert" className="text-xs font-medium text-destructive">
                {erros.categoria}
              </p>
            )}
          </div>

          <PrioritySelectField
            value={campos.prioridade || undefined}
            onChange={(valor) => atualizarCampo("prioridade", valor)}
            error={erros.prioridade}
          />

          {/*
            "Equipes" agora é enviado como `equipeIds` no POST — mas só
            terá efeito depois que schema.prisma (relação
            equipesResponsaveis), a migration e lib/services/ticket.service.ts
            forem atualizados (ver backend-reference/). Até lá, o backend
            simplesmente ignora esse campo (é opcional no schema).
          */}
          <div className="flex flex-col gap-1.5">
            <FormLabel>Equipes Responsáveis</FormLabel>
            <EquipesMultiSelect
              opcoes={opcoesDeEquipe}
              selecionadas={equipesSelecionadas}
              onChange={setEquipesSelecionadas}
            />
          </div>

          <FormTextarea
            label="Descrição do Problema"
            required
            placeholder="Digite o que o input pede..."
            value={campos.descricao}
            onChange={(evento) =>
              atualizarCampo("descricao", evento.target.value)
            }
            error={erros.descricao}
          />

          {erroSubmissao && (
            <p role="alert" className="text-sm font-medium text-destructive">
              {erroSubmissao}
            </p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={enviando} className="bg-accent text-white">
              {enviando ? "Enviando..." : "Finalizar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
