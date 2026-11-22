"use client";

import { useForm } from "react-hook-form";
import { ZodError } from "zod";
import { FormInput } from "@/components/form/form-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogDivider,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ErroClientesApi, salvarCliente, type CamposCliente, type Cliente } from "@/lib/clientes-client";

export function ClienteFormDialog({ cliente, onClose, onSaved }: {
  cliente?: Cliente;
  onClose: () => void;
  onSaved: (cliente: Cliente) => void;
}) {
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<CamposCliente>({
    defaultValues: {
      nome: cliente?.nome ?? "",
      cnpj: cliente?.cnpj ?? "",
      localizacao: cliente?.localizacao ?? "",
      ativo: cliente?.ativo ?? true,
    },
  });

  async function enviar(campos: CamposCliente) {
    clearErrors();
    try {
      onSaved(await salvarCliente(campos, cliente));
    } catch (erro) {
      function informar(campo: unknown, message: string) {
        if (campo === "nome" || campo === "cnpj" || campo === "localizacao" || campo === "ativo") {
          setError(campo, { message });
          return true;
        }
        return false;
      }

      if (erro instanceof ZodError) {
        for (const issue of erro.issues) {
          if (!informar(issue.path[0], issue.message)) {
            setError("root", { message: issue.message });
          }
        }
        return;
      }
      let informouCampo = false;
      if (erro instanceof ErroClientesApi) {
        for (const [campo, mensagens] of Object.entries(erro.detalhes ?? {})) {
          if (typeof mensagens?.[0] === "string" && informar(campo, mensagens[0])) informouCampo = true;
        }
      }
      if (!informouCampo) {
        setError("root", { message: erro instanceof Error ? erro.message : "Não foi possível salvar o cliente." });
      }
    }
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !isSubmitting) onClose(); }}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto" showCloseButton={!isSubmitting}>
        <DialogHeader>
          <DialogTitle>{cliente ? "Editar cliente" : "Cadastrar cliente"}</DialogTitle>
          <DialogDivider />
          <DialogDescription>Os campos com (*) são obrigatórios.</DialogDescription>
        </DialogHeader>
        <form noValidate onSubmit={handleSubmit(enviar)}>
          <DialogBody>
            <FormInput label="Nome" required disabled={isSubmitting} error={errors.nome?.message} {...register("nome")} />
            <FormInput label="CNPJ" placeholder="00.000.000/0000-00" required disabled={isSubmitting} error={errors.cnpj?.message} {...register("cnpj")} />
            <FormInput label="Localização" required disabled={isSubmitting} error={errors.localizacao?.message} {...register("localizacao")} />
            {cliente && (
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" disabled={isSubmitting} {...register("ativo")} />
                Cliente ativo
                {errors.ativo && <span role="alert" className="text-destructive">{errors.ativo.message}</span>}
              </label>
            )}
            {errors.root && <p role="alert" className="text-sm text-destructive">{errors.root.message}</p>}
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={isSubmitting} onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
