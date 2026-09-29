"use client";

import { cn } from "cn";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { FieldLabel } from "./ui/field";
import { useState } from "react";
import { ptBR } from "date-fns/locale";

interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
}

export default function DatePicker({ value, onChange }: DatePickerProps) {
  // Suporta uso controlado (via `value`/`onChange`, ex: TicketFilter) e
  // não controlado (estado interno), pra não quebrar quem já usa
  // <DatePicker /> sem props.
  const [internalDate, setInternalDate] = useState<Date | undefined>();
  const date = value !== undefined ? value : internalDate;
  const [isOpen, setIsOpen] = useState<boolean>(false);

  function handleSelect(selectedDate: Date | undefined) {
    if (onChange) {
      onChange(selectedDate);
    } else {
      setInternalDate(selectedDate);
    }
    setIsOpen(false);
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            data-empty={!date}
            className={cn(
              "justify-start text-left font-normal data-[empty=true]:text-muted-foreground rounded-xl bg-white p-3 min-h-11 hover:bg-transparent",
              { "bg-transparent!": isOpen },
            )}
          />
        }
      >
        <CalendarIcon aria-hidden={true} />
        <FieldLabel
          className={cn(
            "text-sm left-7 font-normal text-muted-foreground top-3 bg-transparent absolute max-w-min pl-2 pr-2  transition-all peer-focus:text-muted peer-focus:top-[-8] peer-focus:bg-white peer-focus:text-xs peer-focus:font-medium",
            {
              "text-gray-500 text-xs top-[-8] left-3 bg-white font-medium":
                date,
              "group-focus:text-xs group-focus:top-[-8] group-focus:left-3 group-focus:bg-white group-focus:font-medium":
                !date,
              "text-gray-500 text-xs top-[-8] left-3 bg-white font-medium ":
                isOpen,
            },
          )}
        >
          Data
        </FieldLabel>
        <span>{date && format(date, "PPP", { locale: ptBR })}</span>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          locale={ptBR}
          mode="single"
          selected={date}
          onSelect={handleSelect}
        />
      </PopoverContent>
    </Popover>
  );
}