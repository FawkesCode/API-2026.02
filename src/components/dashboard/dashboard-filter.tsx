"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { endOfMonth, format, isValid, startOfMonth } from "date-fns";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import DateRangePicker, { type IntervaloData } from "../date-range-picker";
import { Field } from "../ui/field";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { useProjetosDisponiveis } from "@/hooks/use-available-projects";
import { useEquipes } from "@/hooks/use-equipes";
import { useClientes } from "@/hooks/use-clientes";
import { useUsuarios } from "@/hooks/use-usuarios";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import { FilterInput, ProjetoFilterCombobox } from "../tickets/ticket-filter";

interface SelectItemsOptions {
  label: string;
  value: string;
}

export const CLEAR_BUTTON_CLASS =
  "!absolute !right-2 !top-1/2 !-translate-y-1/2 !w-auto !inline-flex !items-center !justify-center rounded-full p-0.5 bg-transparent hover:bg-transparent text-muted-foreground hover:text-foreground cursor-pointer z-10 border-0 outline-none appearance-none";

export default function DashboardFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { projetos } = useProjetosDisponiveis();
  const { equipes, indisponivel: equipesIndisponivel } = useEquipes();
  const { clientes, indisponivel: clientesIndisponivel } = useClientes();
  const { usuarios, indisponivel: usuariosIndisponivel } = useUsuarios();

  // --- Data: um dia específico (?data=) ou um período (?dataInicio=&dataFim=) ---
  const dataParam = searchParams.get("data");
  const inicioParam = searchParams.get("dataInicio");
  const fimParam = searchParams.get("dataFim");

  // Mesmo com parâmetros de data inválidos na URL (ex.: só dataFim), o botão
  // de limpar precisa aparecer para o usuário conseguir remover o filtro.
  const temDataNaUrl = !!(dataParam || inicioParam || fimParam);

  // Parâmetros da URL podem vir inválidos (link antigo, edição manual):
  // datas inválidas são ignoradas para não quebrar a renderização.
  const paraData = (valor: string | null) => {
    if (!valor) return undefined;

    const data = new Date(`${valor}T00:00:00`);
    return isValid(data) ? data : undefined;
  };

  // Sem data na URL, a página filtra o mês vigente; o picker mostra isso.
  const hoje = new Date();
  const intervaloPadrao: IntervaloData = {
    inicio: startOfMonth(hoje),
    fim: endOfMonth(hoje),
  };

  const intervalo: IntervaloData = !temDataNaUrl
    ? intervaloPadrao
    : inicioParam
      ? { inicio: paraData(inicioParam), fim: paraData(fimParam) }
      : { inicio: paraData(dataParam) };

  // --- Demais filtros ---
  const projetoId = searchParams.get("projetoId") ?? "";
  const equipeId = searchParams.get("equipeId") ?? "";
  const clienteId = searchParams.get("clienteId") ?? "";
  const usuarioId = searchParams.get("usuarioId") ?? "";

  // Atualiza vários parâmetros de uma vez (chamar updateParam em sequência
  // perderia a primeira alteração, pois ambas partem do mesmo searchParams).
  function updateParams(alteracoes: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(alteracoes).forEach(([chave, valor]) => {
      if (valor) {
        params.set(chave, valor);
      } else {
        params.delete(chave);
      }
    });

    params.delete("pagina");

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function updateParam(chave: string, valor: string | undefined) {
    updateParams({ [chave]: valor });
  }

  // Um dia só -> ?data=...   |   Período -> ?dataInicio=...&dataFim=...
  function aplicarIntervalo({ inicio, fim }: IntervaloData) {
    const fmt = (d: Date) => format(d, "yyyy-MM-dd");
    const diaUnico = !!inicio && (!fim || fmt(inicio) === fmt(fim));
    const periodo = !!inicio && !!fim && !diaUnico;

    updateParams({
      data: diaUnico && inicio ? fmt(inicio) : undefined,
      dataInicio: periodo && inicio ? fmt(inicio) : undefined,
      dataFim: periodo && fim ? fmt(fim) : undefined,
    });
  }

  // Limpar a data volta ao padrão (mês vigente).
  function limparData() {
    updateParams({
      data: undefined,
      dataInicio: undefined,
      dataFim: undefined,
    });
  }

  function limparFiltros() {
    router.replace(pathname, { scroll: false });
  }

  const algumFiltroAtivo = !!(
    temDataNaUrl ||
    projetoId ||
    equipeId ||
    clienteId ||
    usuarioId
  );

  const equipeItems: SelectItemsOptions[] = equipes.map((equipe) => ({
    label: equipe.nome,
    value: equipe.id,
  }));

  const clienteItems: SelectItemsOptions[] = clientes.map((cliente) => ({
    label: cliente.nome,
    value: cliente.id,
  }));

  const usuarioItems: SelectItemsOptions[] = usuarios.map((usuario) => ({
    label: usuario.nome,
    value: usuario.id,
  }));

  // Campo de data (dia específico ou período).
  const filtroData = (
    <Field className="relative min-w-[10rem] flex-1">
      <DateRangePicker value={intervalo} onChange={aplicarIntervalo} />
      {temDataNaUrl && (
        <button
          type="button"
          onClick={limparData}
          aria-label="Limpar filtro de data"
          className={CLEAR_BUTTON_CLASS}
        >
          <X className="size-3.5" />
        </button>
      )}
    </Field>
  );

  const filtrosEscondidosAtivos = [projetoId, temDataNaUrl, equipeId].filter(
    Boolean,
  ).length;

  const [aberto, setAberto] = useState(filtrosEscondidosAtivos > 0);

  return (
    <Card className="col-span-full gap-4! overflow-visible relative">
      <CardHeader>
        <CardTitle>
          <p className="text-sm text-muted-foreground absolute -top-3 bg-muted p-1 pl-3 pr-3 rounded-xl border border-gray-200">
            Filtros
          </p>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        <Collapsible open={aberto} onOpenChange={setAberto}>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-5">
            {!clientesIndisponivel && (
              <FilterInput
                title="Cliente"
                id="cliente"
                type="select"
                value={clienteId}
                onValueChange={(valor) =>
                  updateParam("clienteId", valor || undefined)
                }
                onClear={() => updateParam("clienteId", undefined)}
                items={clienteItems}
              />
            )}
            {!usuariosIndisponivel && (
              <FilterInput
                title="Usuário"
                id="usuario"
                type="select"
                value={usuarioId}
                onValueChange={(valor) =>
                  updateParam("usuarioId", valor || undefined)
                }
                onClear={() => updateParam("usuarioId", undefined)}
                items={usuarioItems}
              />
            )}

            <CollapsibleTrigger className="inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-input px-4 text-sm transition-colors hover:bg-muted">
              <SlidersHorizontal className="size-4" />
              {aberto ? "Menos Filtros" : "Mais Filtros"}
              {filtrosEscondidosAtivos > 0 && (
                <span className="flex size-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  {filtrosEscondidosAtivos}
                </span>
              )}
              <ChevronDown
                className={`size-4 transition-transform ${aberto ? "rotate-180" : ""}`}
              />
            </CollapsibleTrigger>

            {algumFiltroAtivo && (
              <Button
                type="button"
                onClick={limparFiltros}
                className="shrink-0 cursor-pointer rounded-xl"
              >
                Limpar filtros
              </Button>
            )}
          </div>

          <CollapsibleContent>
            <div className="grid grid-cols-1 gap-x-4 gap-y-5 pt-5 sm:grid-cols-2 lg:grid-cols-3">
              <ProjetoFilterCombobox
                projetos={projetos}
                value={projetoId}
                onSelect={(id) => updateParam("projetoId", id)}
                onClear={() => updateParam("projetoId", undefined)}
              />
              {filtroData}
              {!equipesIndisponivel && (
                <FilterInput
                  title="Time"
                  id="equipe"
                  type="select"
                  value={equipeId}
                  onValueChange={(valor) =>
                    updateParam("equipeId", valor || undefined)
                  }
                  onClear={() => updateParam("equipeId", undefined)}
                  items={equipeItems}
                />
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}