"use client"

import * as React from "react"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { FormLabel } from "@/components/form/form-label"

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-xs font-medium text-destructive">{message}</p>
}

export interface FormInputProps extends React.ComponentProps<typeof Input> {
  label: string
  required?: boolean
  error?: string
}

/** Input de texto com label, estado de erro e hover/focus já resolvidos. Usar em conjunto com register() do react-hook-form. */
export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, required, error, id, ...props }, ref) => {
    const inputId = id ?? React.useId()
    return (
      <div className="flex flex-col gap-1.5">
        <FormLabel htmlFor={inputId} required={required}>
          {label}
        </FormLabel>
        <Input id={inputId} ref={ref} aria-invalid={!!error} {...props} />
        <FieldError message={error} />
      </div>
    )
  }
)
FormInput.displayName = "FormInput"

export interface FormTextareaProps extends React.ComponentProps<typeof Textarea> {
  label: string
  required?: boolean
  error?: string
}

/** Textarea com o mesmo padrão visual do FormInput, para descrições e campos longos. */
export const FormTextarea = React.forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ label, required, error, id, rows = 4, ...props }, ref) => {
    const textareaId = id ?? React.useId()
    return (
      <div className="flex flex-col gap-1.5 ">
        <FormLabel htmlFor={textareaId} required={required}>
          {label}
        </FormLabel>
        <Textarea id={textareaId} ref={ref} rows={rows} aria-invalid={!!error} {...props} />
        <FieldError message={error} />
      </div>
    )
  }
)
FormTextarea.displayName = "FormTextarea"