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

interface SelectItemsOptions {
  label: string;
  value: string;
}

import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

//TODO: Fazer funcionalidades de filtragem (e limpagem dos campos) a partir do momento que os endpoints de GET para a lista de tickets tiver sido feito
export default function TicketFilter() {
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
          selectOptions="Crítico,critic|Alto,high|Médio,medium|Baixo,low"
        />
        <FilterInput
          title="Status"
          id="status"
          type="select"
          selectOptions="Não iniciado,available|Em andamento,inProgress|Solicitação de Encerramento,pendingRequest|Revisões a serem feitas,deniedRequest|Encerrado,aprovedRequest"
        />
        <FilterInput title="Título" id="titulo" />
        <FilterInput id="date" type="date" />
        <Button className="rounded-xl cursor-pointer">Limpar Filtros</Button>
      </CardContent>
    </Card>
  );
}

function FilterInput({
  title,
  id,
  type,
  selectOptions,
}: {
  title?: string;
  id: string;
  type?: string;
  selectOptions?: string;
}) {
  const optArr = selectOptions?.split("|");
  const opts = optArr?.map((opt) => opt.split(","));
  const items: Array<SelectItemsOptions> = [];
  opts?.forEach((opt) => items.push({ label: opt[0], value: opt[1] }));

  const renderInput = () => {
    switch (type) {
      case "date":
        return <DatePicker id={id} />;
      case "select":
        return (
          <Select items={items}>
            <SelectTrigger className="rounded-xl p-3  min-h-11 h-auto">
              <SelectValue placeholder="Selecione uma opção" />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false} className="rounded-xl">
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
            className="rounded-xl peer pl-5 placeholder-transparent! min-h-11  p-3"
            placeholder="Título"
          />
        );
    }
  };

  return (
    <Field className="relative">
      {renderInput()}{" "}
      {type === "date" ? null : (
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
      )}
    </Field>
  );
}
