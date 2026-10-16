"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { format, isValid } from "date-fns";
import { X } from "lucide-react";
import DateRangePicker, { type IntervaloData } from "../date-range-picker";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Field } from "../ui/field";
// Exporte CLEAR_BUTTON_CLASS e FilterInput em ticket-filter.tsx (hoje são
// internos). Ideal depois: mover os dois para components/filter-input.tsx.
import { CLEAR_BUTTON_CLASS, FilterInput } from "../tickets/ticket-filter";
import { CARGO_UI } from "@/types/usuario";

const STATUS_ITEMS = [
  { label: "Ativo", value: "ativo" },
  { label: "Inativo", value: "inativo" },
];

const CARGO_ITEMS = Object.entries(CARGO_UI).map(([valor, ui]) => ({
  label: ui.label,
  value: valor,
}));

const paraData = (valor: string | null) => {
  if (!valor) return undefined;
  const data = new Date(`${valor}T00:00:00`);
  return isValid(data) ? data : undefined;
};

export default function UsuariosFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const busca = searchParams.get("busca") ?? "";
  const status = searchParams.get("status") ?? "";
  const cargo = searchParams.get("cargo") ?? "";
  const dataParam = searchParams.get("data");
  const inicioParam = searchParams.get("dataInicio");
  const fimParam = searchParams.get("dataFim");

  const intervalo: IntervaloData = inicioParam
    ? { inicio: paraData(inicioParam), fim: paraData(fimParam) }
    : { inicio: paraData(dataParam) };

  const [buscaInput, setBuscaInput] = useState(busca);

  useEffect(() => {
    setBuscaInput(busca);
  }, [busca]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (buscaInput !== busca) updateParam("busca", buscaInput || undefined);
    }, 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buscaInput]);

  // Qualquer mudança de filtro volta para a página 1.
  function updateParams(alteracoes: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(alteracoes).forEach(([chave, valor]) => {
      if (valor) params.set(chave, valor);
      else params.delete(chave);
    });
    params.delete("pagina");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function updateParam(chave: string, valor: string | undefined) {
    updateParams({ [chave]: valor });
  }

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

  function limparData() {
    updateParams({ data: undefined, dataInicio: undefined, dataFim: undefined });
  }

  function limparFiltros() {
    setBuscaInput("");
    router.replace(pathname, { scroll: false });
  }

  const temDataNaUrl = !!(dataParam || inicioParam || fimParam);
  const algumFiltroAtivo = !!(busca || status || cargo || temDataNaUrl);

  return (
    <Card className="col-span-full gap-4! overflow-visible">
      <CardContent className="flex flex-row flex-wrap items-center gap-x-4 gap-y-5 xl:flex-nowrap">
        <FilterInput
          title="Pesquisa"
          id="busca"
          value={buscaInput}
          onChange={(evento) => setBuscaInput(evento.target.value)}
          onClear={() => {
            setBuscaInput("");
            updateParam("busca", undefined);
          }}
        />

        <Field className="relative min-w-[10rem] flex-1">
          <DateRangePicker
            value={intervalo}
            onChange={aplicarIntervalo}
            placeholder="Selecione uma data"
          />
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

        <FilterInput
          title="Status"
          id="status"
          type="select"
          value={status}
          onValueChange={(valor) => updateParam("status", valor || undefined)}
          onClear={() => updateParam("status", undefined)}
          items={STATUS_ITEMS}
        />
        <FilterInput
          title="Tipo de Conta"
          id="cargo"
          type="select"
          value={cargo}
          onValueChange={(valor) => updateParam("cargo", valor || undefined)}
          onClear={() => updateParam("cargo", undefined)}
          items={CARGO_ITEMS}
        />

        {algumFiltroAtivo && (
          <Button
            type="button"
            onClick={limparFiltros}
            className="rounded-xl cursor-pointer shrink-0"
          >
            Limpar Filtros
          </Button>
        )}
      </CardContent>
    </Card>
  );
}