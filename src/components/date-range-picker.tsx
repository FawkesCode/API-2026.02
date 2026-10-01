"use client";

import { useState } from "react";
import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Button } from "./ui/button";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

export interface IntervaloData {
  inicio?: Date;
  fim?: Date;
}

interface DateRangePickerProps {
  value: IntervaloData;
  onChange: (intervalo: IntervaloData) => void;
  placeholder?: string;
}

function formatarIntervalo({ inicio, fim }: IntervaloData, placeholder: string) {
  if (!inicio) return placeholder;
  if (!fim || isSameDay(inicio, fim)) return format(inicio, "dd/MM/yyyy");
  return `${format(inicio, "dd/MM/yyyy")} – ${format(fim, "dd/MM/yyyy")}`;
}

export default function DateRangePicker({
  value,
  onChange,
  placeholder = "Data de abertura",
}: DateRangePickerProps) {
  const [aberto, setAberto] = useState(false);
  const [rascunho, setRascunho] = useState<DateRange | undefined>();

  function aoMudarAberto(novoEstado: boolean) {
    if (novoEstado) {
      setRascunho(
        value.inicio ? { from: value.inicio, to: value.fim } : undefined,
      );
    }
    setAberto(novoEstado);
  }

  function aplicar() {
    onChange({ inicio: rascunho?.from, fim: rascunho?.to });
    setAberto(false);
  }

  const temValor = !!value.inicio;

  return (
    <Popover open={aberto} onOpenChange={aoMudarAberto}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className="min-h-11 w-full justify-start gap-2 rounded-xl p-3 pr-8 font-normal"
          />
        }
      >
        <CalendarIcon className="size-4 text-muted-foreground" />
        <span className={temValor ? "" : "text-muted-foreground"}>
          {formatarIntervalo(value, placeholder)}
        </span>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="range"
          locale={ptBR}
          numberOfMonths={2}
          selected={rascunho}
          onSelect={setRascunho}
          defaultMonth={rascunho?.from}
        />
        <div className="flex items-center justify-between gap-4 border-t p-3">
          <p className="text-xs text-muted-foreground">
            Um clique = data específica. Dois cliques = período.
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() => setRascunho(undefined)}
            >
              Limpar
            </Button>
            <Button
              type="button"
              size="sm"
              className="rounded-xl"
              onClick={aplicar}
            >
              Aplicar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}