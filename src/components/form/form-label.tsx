import * as React from "react";

import { Label } from "@/components/ui/label";

interface FormLabelProps extends React.ComponentProps<typeof Label> {
  required?: boolean;
}

/** Label padrão de formulário, com o marcador (*) de obrigatório já resolvido. */
export function FormLabel({ required, children, ...props }: FormLabelProps) {
  return (
    <Label {...props}>
      {children}
      {required && <span className="ml-0.5 text-red-600">*</span>}
    </Label>
  );
}
