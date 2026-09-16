import DatePicker from "./datepicker";
import { Field, FieldError, FieldLabel } from "./ui/field";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface selectItems {
  label: string;
  value: string | null;
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
  const items: Array<selectItems> = [
    { label: "Selecione uma opção", value: null },
  ];
  opts?.forEach((opt) => items.push({ label: opt[0], value: opt[1] }));

  const renderInput = () => {
    switch (type) {
      case "date":
        return <DatePicker id={id} />;
      case "select":
        return (
          <Select items={items}>
            <SelectTrigger className="rounded-xl p-5 h-auto">
              <SelectValue placeholder="Theme" />
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
            className="rounded-xl peer pl-5 placeholder-transparent! h-auto p-3"
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
          className="text-muted text-xs absolute top-[-8] left-3 bg-white max-w-min pl-2 pr-2 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-placeholder-shown:text-muted-foreground peer-placeholder-shown:top-3 peer-placeholder-shown:bg-transparent transition-all 
          peer-focus:text-muted
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

export default FilterInput;
