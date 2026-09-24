"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { X } from "lucide-react";
import DatePicker from "./datepicker";
import { Field, FieldLabel } from "./ui/field";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  useProjetosDisponiveis,
  type ProjetoResumo,
} from "@/hooks/use-projetos-disponiveis";
import { useEquipes } from "@/hooks/use-equipes";

interface SelectItemsOptions {
  label: string;
  value: string;
}

const CLEAR_BUTTON_CLASS =
  "!absolute !right-2 !top-1/2 !-translate-y-1/2 !w-auto !inline-flex !items-center !justify-center rounded-full p-0.5 bg-transparent hover:bg-transparent text-muted-foreground hover:text-foreground cursor-pointer z-10 border-0 outline-none appearance-none";

interface TicketFilterProps {
  /**
   * "tickets" mostra os filtros extras de ticket (Tipo, Projeto, Time,
   * Local de instalação) além dos filtros base.
   * "projetos" mostra só os filtros base (Prioridade, Status, Título, Data),
   * mantendo o comportamento original da tela de projetos.
   * Se não for passado, é detectado automaticamente pela URL atual
   * (rotas que começam com /tickets usam "tickets", o resto usa "projetos").
   */
  variant?: "tickets" | "projetos";
}

interface ProjetoFilterComboboxProps {
  projetos: ProjetoResumo[];
  value: string;
  onSelect: (id: string) => void;
  onClear: () => void;
}

/**
 * Mesma lógica de busca do ProjectSearchSelect (nome/cliente, projetos já
 * filtrados por equipe via useProjetosDisponiveis), só que compacta pra
 * caber como um campo de filtro em vez de uma tela cheia de seleção.
 */
function ProjetoFilterCombobox({
  projetos,
  value,
  onSelect,
  onClear,
}: ProjetoFilterComboboxProps) {
  const [busca, setBusca] = useState("");
  const [aberto, setAberto] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const projetoSelecionado = projetos.find((projeto) => projeto.id === value);

  useEffect(() => {
    setBusca(projetoSelecionado ? projetoSelecionado.nome : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    function aoClicarFora(evento: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(evento.target as Node)
      ) {
        setAberto(false);
      }
    }
    document.addEventListener("mousedown", aoClicarFora);
    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, []);

  const termo = busca.trim().toLowerCase();
  const projetosFiltrados = projetos.filter((projeto) => {
    if (!termo) return true;
    return (
      projeto.nome.toLowerCase().includes(termo) ||
      projeto.cliente?.nome?.toLowerCase().includes(termo)
    );
  });

  const temValor = !!value;

  return (
    <div ref={containerRef} className="relative min-w-[10rem] flex-1">
      <Input
        id="projeto"
        autoComplete="off"
        className="rounded-xl peer pl-5 placeholder-transparent! min-h-11 p-3 pr-8"
        placeholder="Projeto"
        value={busca}
        onFocus={() => setAberto(true)}
        onChange={(evento) => {
          setBusca(evento.target.value);
          setAberto(true);
          if (value) onClear();
        }}
      />
      <FieldLabel
        htmlFor="projeto"
        className="text-gray-500 text-xs absolute top-[-8] left-3 bg-white max-w-min whitespace-nowrap pl-2 pr-2 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-placeholder-shown:text-muted-foreground peer-placeholder-shown:top-3 peer-placeholder-shown:bg-transparent transition-all
        peer-focus:text-gray-500
        peer-focus:top-[-8]
        peer-focus:bg-white
        peer-focus:text-xs
        peer-focus:font-medium"
      >
        Projeto
      </FieldLabel>
      {temValor && (
        <button
          type="button"
          onClick={() => {
            onClear();
            setBusca("");
          }}
          aria-label="Limpar filtro de projeto"
          className={CLEAR_BUTTON_CLASS}
        >
          <X className="size-3.5" />
        </button>
      )}
      {aberto && (
        <ul className="absolute top-full left-0 z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-input bg-white p-1 shadow-md">
          {projetosFiltrados.length === 0 && (
            <li className="px-3 py-2 text-sm text-muted-foreground">
              Nenhum projeto encontrado.
            </li>
          )}
          {projetosFiltrados.map((projeto) => (
            <li key={projeto.id}>
              <button
                type="button"
                onClick={() => {
                  onSelect(projeto.id);
                  setBusca(projeto.nome);
                  setAberto(false);
                }}
                className="w-full rounded-md border border-transparent px-3 py-2 text-left text-sm transition-colors hover:border-accent hover:bg-sky-50"
              >
                <span className="font-semibold">{projeto.nome}</span>
                {projeto.cliente?.nome && (
                  <span className="ml-1 text-muted-foreground">
                    — {projeto.cliente.nome}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function TicketFilter({ variant }: TicketFilterProps = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const variantResolvida = variant ?? (pathname.startsWith("/tickets") ? "tickets" : "projetos");
  const mostrarFiltrosDeTicket = variantResolvida === "tickets";

  const { projetos } = useProjetosDisponiveis();
  const { equipes, indisponivel: equipesIndisponivel } = useEquipes();

  const prioridade = searchParams.get("prioridade") ?? "";
  const status = searchParams.get("status") ?? "";
  const titulo = searchParams.get("titulo") ?? "";
  const dataParam = searchParams.get("data");
  const data = dataParam ? new Date(`${dataParam}T00:00:00`) : undefined;

  // --- Filtros exclusivos da tela de tickets ---
  const tipo = mostrarFiltrosDeTicket ? searchParams.get("tipo") ?? "" : "";
  const projetoId = mostrarFiltrosDeTicket
    ? searchParams.get("projetoId") ?? ""
    : "";
  const equipeId = mostrarFiltrosDeTicket
    ? searchParams.get("equipeId") ?? ""
    : "";
  const localInstalacao = mostrarFiltrosDeTicket
    ? searchParams.get("localInstalacao") ?? ""
    : "";

  const [tituloInput, setTituloInput] = useState(titulo);
  const [localInput, setLocalInput] = useState(localInstalacao);

  useEffect(() => {
    setTituloInput(titulo);
  }, [titulo]);

  useEffect(() => {
    setLocalInput(localInstalacao);
  }, [localInstalacao]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (tituloInput !== titulo) {
        updateParam("titulo", tituloInput || undefined);
      }
    }, 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tituloInput]);

  useEffect(() => {
    if (!mostrarFiltrosDeTicket) return;
    const timeout = setTimeout(() => {
      if (localInput !== localInstalacao) {
        updateParam("localInstalacao", localInput || undefined);
      }
    }, 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localInput]);

  function updateParam(chave: string, valor: string | undefined) {
    const params = new URLSearchParams(searchParams.toString());
    if (valor) {
      params.set(chave, valor);
    } else {
      params.delete(chave);
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function limparFiltros() {
    setTituloInput("");
    setLocalInput("");
    router.replace(pathname, { scroll: false });
  }

  const algumFiltroAtivo = !!(
    prioridade ||
    status ||
    titulo ||
    dataParam ||
    tipo ||
    projetoId ||
    equipeId ||
    localInstalacao
  );

  const equipeItems: SelectItemsOptions[] = equipes.map((equipe) => ({
    label: equipe.nome,
    value: equipe.id,
  }));

  return (
    <Card className="col-span-full gap-4! overflow-visible">
      <CardHeader>
        <CardTitle>
          <p className="text-sm text-foreground">Filtrar por:</p>
        </CardTitle>
      </CardHeader>
      {mostrarFiltrosDeTicket ? (
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
            <FilterInput
              title="Tipo"
              id="tipo"
              type="select"
              value={tipo}
              onValueChange={(valor) => updateParam("tipo", valor)}
              onClear={() => updateParam("tipo", undefined)}
              selectOptions="Instalação,INSTALACAO|Manutenção,MANUTENCAO"
            />
            <FilterInput
              title="Prioridade"
              id="priority"
              type="select"
              value={prioridade}
              onValueChange={(valor) => updateParam("prioridade", valor)}
              onClear={() => updateParam("prioridade", undefined)}
              selectOptions="Crítica,CRITICA|Alta,ALTA|Média,MEDIA|Baixa,BAIXA"
            />
            <FilterInput
              title="Status"
              id="status"
              type="select"
              value={status}
              onValueChange={(valor) => updateParam("status", valor)}
              onClear={() => updateParam("status", undefined)}
              selectOptions="Não iniciado,NAO_INICIADO|Em andamento,EM_ANDAMENTO|Encerrado,ENCERRADO"
            />
            <FilterInput
              title="Título"
              id="titulo"
              value={tituloInput}
              onChange={(evento) => setTituloInput(evento.target.value)}
              onClear={() => {
                setTituloInput("");
                updateParam("titulo", undefined);
              }}
            />
            <ProjetoFilterCombobox
              projetos={projetos}
              value={projetoId}
              onSelect={(id) => updateParam("projetoId", id)}
              onClear={() => updateParam("projetoId", undefined)}
            />
            {!equipesIndisponivel && (
              <FilterInput
                title="Time"
                id="equipe"
                type="select"
                value={equipeId}
                onValueChange={(valor) => updateParam("equipeId", valor)}
                onClear={() => updateParam("equipeId", undefined)}
                items={equipeItems}
              />
            )}
            <FilterInput
              title="Local de instalação"
              id="localInstalacao"
              value={localInput}
              onChange={(evento) => setLocalInput(evento.target.value)}
              onClear={() => {
                setLocalInput("");
                updateParam("localInstalacao", undefined);
              }}
            />
            <Field className="relative">
              <DatePicker
                value={data}
                onChange={(novaData) =>
                  updateParam(
                    "data",
                    novaData ? format(novaData, "yyyy-MM-dd") : undefined,
                  )
                }
              />
              <FieldLabel
                htmlFor="data-abertura"
                className="text-gray-500 text-xs absolute top-[-8] left-3 bg-white max-w-min whitespace-nowrap pl-2 pr-2"
              >
                Data de abertura
              </FieldLabel>
              {data && (
                <button
                  type="button"
                  onClick={() => updateParam("data", undefined)}
                  aria-label="Limpar filtro de data"
                  className={CLEAR_BUTTON_CLASS}
                >
                  <X className="size-3.5" />
                </button>
              )}
            </Field>
          </div>
          {algumFiltroAtivo && (
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={limparFiltros}
                className="rounded-xl cursor-pointer shrink-0"
              >
                Limpar Filtros
              </Button>
            </div>
          )}
        </CardContent>
      ) : (
        <CardContent className="flex flex-row flex-wrap items-center gap-x-4 gap-y-5 xl:flex-nowrap">
          <FilterInput
            title="Prioridade"
            id="priority"
            type="select"
            value={prioridade}
            onValueChange={(valor) => updateParam("prioridade", valor)}
            onClear={() => updateParam("prioridade", undefined)}
            selectOptions="Crítica,CRITICA|Alta,ALTA|Média,MEDIA|Baixa,BAIXA"
          />
          <FilterInput
            title="Status"
            id="status"
            type="select"
            value={status}
            onValueChange={(valor) => updateParam("status", valor)}
            onClear={() => updateParam("status", undefined)}
            selectOptions="Não iniciado,NAO_INICIADO|Em andamento,EM_ANDAMENTO|Encerrado,ENCERRADO"
          />
          <FilterInput
            title="Título"
            id="titulo"
            value={tituloInput}
            onChange={(evento) => setTituloInput(evento.target.value)}
            onClear={() => {
              setTituloInput("");
              updateParam("titulo", undefined);
            }}
          />
          <Field className="relative min-w-[10rem] flex-1">
            <DatePicker
              value={data}
              onChange={(novaData) =>
                updateParam(
                  "data",
                  novaData ? format(novaData, "yyyy-MM-dd") : undefined,
                )
              }
            />
            {data && (
              <button
                type="button"
                onClick={() => updateParam("data", undefined)}
                aria-label="Limpar filtro de data"
                className={CLEAR_BUTTON_CLASS}
              >
                <X className="size-3.5" />
              </button>
            )}
          </Field>
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
      )}
    </Card>
  );
}

interface FilterInputProps {
  title?: string;
  id: string;
  type?: string;
  selectOptions?: string;
  items?: SelectItemsOptions[];
  value?: string;
  onChange?: (evento: React.ChangeEvent<HTMLInputElement>) => void;
  onValueChange?: (valor: string) => void;
  onClear?: () => void;
}

function FilterInput({
  title,
  id,
  type,
  selectOptions,
  items: itemsProp,
  value,
  onChange,
  onValueChange,
  onClear,
}: FilterInputProps) {
  const optArr = selectOptions?.split("|");
  const opts = optArr?.map((opt) => opt.split(","));
  const parsedItems: SelectItemsOptions[] = [];
  opts?.forEach((opt) => parsedItems.push({ label: opt[0], value: opt[1] }));

  const items = itemsProp ?? parsedItems;

  const temValor = !!value;

  const renderInput = () => {
    switch (type) {
      case "select":
        return (
          <Select items={items} value={value} onValueChange={onValueChange}>
            <SelectTrigger
              className="rounded-xl p-3 min-h-11 h-auto w-full pr-8"
              id={id}
            >
              <SelectValue placeholder="Selecione uma opção" />
            </SelectTrigger>
            <SelectContent
              alignItemWithTrigger={false}
              className="rounded-xl"
            >
              <SelectGroup>
                {items.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        );
      default:
        return (
          <Input
            id={id}
            autoComplete="off"
            className="rounded-xl peer pl-5 placeholder-transparent! min-h-11 p-3 pr-8"
            placeholder={title ?? "Filtro"}
            value={value}
            onChange={onChange}
          />
        );
    }
  };

  return (
    <Field className="relative min-w-[10rem] flex-1">
      {renderInput()}{" "}
      <FieldLabel
        htmlFor={id}
        className="text-gray-500 text-xs absolute top-[-8] left-3 bg-white max-w-min whitespace-nowrap pl-2 pr-2 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-placeholder-shown:text-muted-foreground peer-placeholder-shown:top-3 peer-placeholder-shown:bg-transparent transition-all 
        peer-focus:text-gray-500
        peer-focus:top-[-8]
        peer-focus:bg-white
        peer-focus:text-xs
        peer-focus:font-medium"
      >
        {title}
      </FieldLabel>
      {temValor && onClear && (
        <button
          type="button"
          onClick={onClear}
          aria-label={`Limpar filtro de ${title ?? id}`}
          className={CLEAR_BUTTON_CLASS}
        >
          <X className="size-3.5" />
        </button>
      )}
    </Field>
  );
}