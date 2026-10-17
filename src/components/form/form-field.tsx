"use client";

import {
  forwardRef,
  useId,
  useState,
  type ComponentProps,
} from "react";
import { Eye, EyeOff } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormLabel } from "@/components/form/form-label";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { SelectInterface } from "@/lib/data/dropdown";

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-xs font-medium text-destructive">
      {message}
    </p>
  );
}
export interface FormInputProps extends ComponentProps<typeof Input> {
  label: string;
  error?: string;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, required, error, id, className, type, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const errorId = `${inputId}-error`;
    const isPassword = type === "password";
    const [senhaVisivel, setSenhaVisivel] = useState(false);

    return (
      <div className="flex flex-col gap-1.5 w-full">
        <FormLabel htmlFor={inputId} required={required}>
          {label}
        </FormLabel>
        {isPassword ? (
          <InputGroup className="rounded-xl hover:border-accent">
            <InputGroupInput
              id={inputId}
              ref={ref}
              type={senhaVisivel ? "text" : "password"}
              className={className}
              aria-invalid={!!error}
              aria-describedby={error ? errorId : undefined}
              aria-required={required || undefined}
              required={required}
              {...props}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                aria-label={senhaVisivel ? "Ocultar senha" : "Mostrar senha"}
                title={senhaVisivel ? "Ocultar senha" : "Mostrar senha"}
                size="icon-xs"
                type="button"
                className="cursor-pointer text-muted-foreground hover:bg-transparent hover:text-foreground"
                onClick={() => setSenhaVisivel((atual) => !atual)}
              >
                {senhaVisivel ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        ) : (
          <Input
            id={inputId}
            ref={ref}
            type={type}
            className={`w-full ${className}`}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            aria-required={required || undefined}
            required={required}
            {...props}
          />
        )}
        <FieldError id={errorId} message={error} />
      </div>
    );
  },
);
FormInput.displayName = "FormInput";

export interface FormSelectProps {
  label: string;
  options?: SelectInterface[];
  value?: SelectInterface | null;
  onChange?: (value: SelectInterface | null) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  id?: string;
  disabled?: boolean;
}

export const FormSelect = forwardRef<HTMLButtonElement, FormSelectProps>(
  (
    {
      label,
      options,
      value,
      onChange,
      placeholder = "Selecione uma opção",
      required,
      error,
      id,
      disabled,
    },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const errorId = `${inputId}-error`;

    return (
      <div className="flex flex-col gap-1.5 w-full">
        <FormLabel htmlFor={inputId} required={required}>
          {label}
        </FormLabel>
        <Select
          value={value?.value ?? ""}
          onValueChange={(val) => {
            const selectedItem =
              options?.find((item) => item.value === val) ?? null;
            onChange?.(selectedItem);
          }}
          disabled={disabled}
        >
          <SelectTrigger
            className="rounded-xl w-full"
            id={inputId}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            aria-required={required || undefined}
            ref={ref}
          >
            <SelectValue placeholder={placeholder}>{value?.label}</SelectValue>
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false} className="rounded-xl">
            <SelectGroup>
              {options?.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <FieldError id={errorId} message={error} />
      </div>
    );
  },
);
FormSelect.displayName = "FormSelect";

export interface FormTextareaProps extends ComponentProps<typeof Textarea> {
  label: string;
  required?: boolean;
  error?: string;
}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ label, required, error, id, rows = 4, ...props }, ref) => {
    const generatedId = useId();
    const textareaId = id ?? generatedId;
    const errorId = `${textareaId}-error`;
    return (
      <div className="flex flex-col gap-1.5">
        <FormLabel htmlFor={textareaId} required={required}>
          {label}
        </FormLabel>
        <Textarea
          id={textareaId}
          ref={ref}
          rows={rows}
          className="bg-white shadow-2xs focus:border-accent!"
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          aria-required={required || undefined}
          {...props}
        />
        <FieldError id={errorId} message={error} />
      </div>
    );
  },
);
FormTextarea.displayName = "FormTextarea";
