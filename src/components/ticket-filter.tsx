"use client";

import { useEffect, useState } from "react";
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

interface SelectItemsOptions {
  label: string;
  value: string;
}

const CLEAR_BUTTON_CLASS =
  "!absolute !right-2 !top-1/2 !-translate-y-1/2 !w-auto !inline-flex !items-center !justify-center rounded-full p-0.5 bg-transparent hover:bg-transparent text-muted-foreground hover:text-foreground cursor-pointer z-10 border-0 outline-none appearance-none";

export default function TicketFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const prioridade = searchParams.get("prioridade") ?? "";
  const status = searchParams.get("status") ?? "";
  const titulo = searchParams.get("titulo") ?? "";
  const dataParam = searchParams.get("data");
  const data = dataParam ? new Date(`${dataParam}T00:00:00`) : undefined;

  const [tituloInput, setTituloInput] = useState(titulo);

  useEffect(() => {
    setTituloInput(titulo);
  }, [titulo]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (tituloInput !== titulo) {
        updateParam("titulo", tituloInput || undefined);
      }
    }, 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tituloInput]);

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
    router.replace(pathname, { scroll: false });
  }

  const algumFiltroAtivo = !!(prioridade || status || titulo || dataParam);

  return (
    <Card className="col-span-full  gap-4!">
      <CardHeader>
        <CardTitle>
          <p className="text-sm text-foreground">Filtrar por:</p>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-row flex-wrap items-center justify-center xl:flex-nowrap ">
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
          selectOptions="Não iniciado,ABERTO|Em andamento,EM_ANDAMENTO|Encerrado,ENCERRADO"
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
            className="rounded-xl cursor-pointer"
          >
            Limpar Filtros
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

interface FilterInputProps {
  title?: string;
  id: string;
  type?: string;
  selectOptions?: string;
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
  value,
  onChange,
  onValueChange,
  onClear,
}: FilterInputProps) {
  const optArr = selectOptions?.split("|");
  const opts = optArr?.map((opt) => opt.split(","));
  const items: Array<SelectItemsOptions> = [];
  opts?.forEach((opt) => items.push({ label: opt[0], value: opt[1] }));

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
            placeholder="Título"
            value={value}
            onChange={onChange}
          />
        );
    }
  };

  return (
    <Field className="relative">
      {renderInput()}{" "}
      <FieldLabel
        htmlFor={id}
        className="text-gray-500 text-xs absolute top-[-8] left-3 bg-white max-w-min pl-2 pr-2 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-placeholder-shown:text-muted-foreground peer-placeholder-shown:top-3 peer-placeholder-shown:bg-transparent transition-all 
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