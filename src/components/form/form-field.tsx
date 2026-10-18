"use client";

import { ReactNode, Ref, useId, useState, type ComponentProps } from "react";
import { Eye, EyeOff, TriangleAlert } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Field, FieldError, FieldLabel } from "../ui/field";
import { cn } from "cn";

const formVariants = {
  default: {
    label: "",
    input: "rounded-xl hover:border-accent",
    group: "rounded-xl hover:border-accent",
    groupInput: "",
    toggle: "text-muted-foreground hover:bg-transparent hover:text-foreground",
  },
  login: {
    label: "text-xs sm:text-regular",
    input:
      "border-0 border-b-2 border-[#236588] py-6 text-xs sm:text-regular placeholder:text-[#9BAFC0]",
    group: "rounded-xl border-0 border-b-2 border-[#236588] py-6",
    groupInput: "text-xs sm:text-regular placeholder:text-[#9BAFC0]",
    toggle: "text-[#9BAFC0] hover:bg-transparent hover:text-primary-foreground",
  },
} as const;

export type FormVariant = keyof typeof formVariants;

const inputStyle = "rounded-xl hover:border-accent";

interface AccessibilityProps {
  id: string;
  "aria-invalid": boolean;
  "aria-describedby"?: string;
  "aria-required"?: true;
}

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  id?: string;
  className?: string;
  children: (a: AccessibilityProps) => ReactNode;
  variant?: FormVariant;
}

function FormField({
  variant = "default",
  label,
  required,
  error,
  id,
  children,
}: FormFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const errorId = `${fieldId}-error`;

  return (
    <Field className={formVariants[variant].label} data-invalid={!!error}>
      <FieldLabel>
        {label}
        {required && (
          <span aria-hidden className="ml-0.5 text-red-600">
            *
          </span>
        )}
      </FieldLabel>
      {children({
        id: fieldId,
        "aria-invalid": !!error,
        "aria-describedby": error ? errorId : undefined,
        "aria-required": required || undefined,
      })}

      {error && (
        <FieldError id={errorId} className="flex items-center gap-1 text-xs">
          <TriangleAlert size={15} /> {error}
        </FieldError>
      )}
    </Field>
  );
}

type BaseProps = { label: string; error?: string };
export type FormInputProps = BaseProps &
  ComponentProps<typeof Input> & { variant?: FormVariant };

export function FormInput({
  label,
  error,
  required,
  id,
  className,
  variant = "default",
  ...props
}: FormInputProps) {
  return (
    <FormField
      label={label}
      error={error}
      required={required}
      id={id}
      variant={variant}
    >
      {(inputProps) => (
        <Input
          {...inputProps}
          className={cn(formVariants[variant].input, className)}
          {...props}
        />
      )}
    </FormField>
  );
}

export type FormPasswordProps = BaseProps &
  Omit<ComponentProps<typeof InputGroupInput>, "type"> & {
    variant?: FormVariant;
  };

export function FormPassword({
  label,
  error,
  required,
  id,
  className,
  variant = "default",
  ...props
}: FormPasswordProps) {
  const [visible, setVisible] = useState(false);
  const toggleText = visible ? "Ocultar senha" : "Mostrar senha";
  const styles = formVariants[variant];

  return (
    <FormField label={label} error={error} required={required} id={id}>
      {(inputProps) => (
        <InputGroup className={cn(styles.group, className)}>
          <InputGroupInput
            {...inputProps}
            type={visible ? "text" : "password"}
            className={styles.groupInput}
            {...props}
          />
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              type="button"
              size="icon-xs"
              aria-label={toggleText}
              title={toggleText}
              aria-pressed={visible}
              className={cn("cursor-pointer", styles.toggle)}
              onClick={() => setVisible((v) => !v)}
            >
              {visible ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      )}
    </FormField>
  );
}

export type FormTextareaProps = BaseProps & ComponentProps<typeof Textarea>;

export function FormTextarea({
  label,
  error,
  required,
  id,
  rows = 4,
  className,
  ...props
}: FormTextareaProps) {
  return (
    <FormField label={label} error={error} required={required} id={id}>
      {(inputProps) => (
        <Textarea
          {...inputProps}
          rows={rows}
          className={cn(
            inputStyle,
            className,
            "bg-white shadow-2xs focus:border-accent!",
          )}
          {...props}
        />
      )}
    </FormField>
  );
}

export interface FormSelectProps extends BaseProps {
  options?: SelectInterface[];
  value?: SelectInterface | null;
  onChange?: (value: SelectInterface | null) => void;
  onBlur?: () => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  className?: string;
  ref?: Ref<HTMLButtonElement>;
}

export function FormSelect({
  label,
  error,
  required,
  id,
  options,
  value,
  onChange,
  onBlur,
  placeholder = "Selecione uma opção",
  disabled,
  className,
  ref,
}: FormSelectProps) {
  return (
    <FormField label={label} error={error} required={required} id={id}>
      {(inputProps) => (
        <Select
          value={value?.value ?? ""}
          onValueChange={(val) =>
            onChange?.(options?.find((o) => o.value === val) ?? null)
          }
          disabled={disabled}
        >
          <SelectTrigger
            {...inputProps}
            ref={ref}
            onBlur={onBlur}
            className={cn(inputStyle, "w-full", className)}
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
      )}
    </FormField>
  );
}
