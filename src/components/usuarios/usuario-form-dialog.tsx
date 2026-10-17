"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Controller,
  useForm,
  useWatch,
  type FieldErrors,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";

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
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { FormInput, FormSelect } from "@/components/form/form-field";
import { cn } from "@/lib/utils";
import {
  OPCOES_TIPO_CONTA,
  REGRAS_SENHA,
  usuarioFormSchema,
  type UsuarioFormInput,
  type UsuarioFormValues,
} from "@/schemas/usuario-form.schema";

const URL_USUARIOS = "/api/usuarios";

const MENSAGEM_ERRO_PADRAO =
  "Não foi possível cadastrar o usuário. Tente novamente.";

const VALORES_INICIAIS: UsuarioFormInput = {
  email: "",
  nome: "",
  tipoConta: null,
  senha: "",
  confirmarSenha: "",
};

export function UsuarioFormDialog() {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    resetField,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<UsuarioFormInput, unknown, UsuarioFormValues>({
    resolver: zodResolver(usuarioFormSchema),
    defaultValues: VALORES_INICIAIS,
  });

  const senhaDigitada =
    useWatch({ control, name: "senha", defaultValue: "" }) ?? "";
  const usuarioComecouADigitarSenha = senhaDigitada.length > 0;

  function aoMudarAbertura(valor: boolean) {
    setAberto(valor);
    if (!valor) {
      reset(VALORES_INICIAIS);
      setErroEnvio(null);
    }
  }

  function aoFalhar(errosValidacao: FieldErrors<UsuarioFormInput>) {
    if (errosValidacao.senha && senhaDigitada.length > 0) {
      resetField("senha", { keepError: true });
    }
  }

  async function aoEnviar(data: UsuarioFormValues) {
    setErroEnvio(null);

    try {
      const res = await fetch(URL_USUARIOS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: data.nome,
          email: data.email,
          cargo: data.tipoConta.value,
          senha: data.senha,
        }),
      });

      if (res.ok) {
        await res.json().catch(() => null);
        reset(VALORES_INICIAIS);
        setAberto(false);
        toast.add({
          type: "success",
          title: "Usuário cadastrado",
          description: "O novo usuário foi cadastrado com sucesso.",
        });
        router.refresh();
        return;
      }

      const corpo = await res.json().catch(() => null);

      if (corpo?.detalhes) {
        const detalhes = corpo.detalhes as Record<string, string[] | undefined>;
        if (detalhes.email?.[0]) {
          setError("email", { type: "server", message: detalhes.email[0] });
        }
        if (detalhes.nome?.[0]) {
          setError("nome", { type: "server", message: detalhes.nome[0] });
        }
        if (detalhes.cargo?.[0]) {
          setError("tipoConta", { type: "server", message: detalhes.cargo[0] });
        }
        if (detalhes.senha?.[0]) {
          resetField("senha");
          setError("senha", { type: "server", message: detalhes.senha[0] });
        }
      }

      const mensagem = corpo?.erro ?? corpo?.message ?? MENSAGEM_ERRO_PADRAO;
      setErroEnvio(mensagem);
    } catch {
      setErroEnvio(MENSAGEM_ERRO_PADRAO);
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={aoMudarAbertura}>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="default"
            className="cursor-pointer rounded-md bg-accent px-4 text-white hover:bg-cyan-400"
          />
        }
      >
        <Plus className="size-4" />
        Criar Novo
      </DialogTrigger>

      <DialogContent className="flex max-h-[90vh] flex-col gap-5 overflow-y-auto">
        <DialogHeader className="h-fit">
          <DialogTitle>Cadastrar novo Usuário</DialogTitle>
          <DialogDivider />
          <DialogDescription>
            Os campos com (*) são obrigatórios.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(aoEnviar, aoFalhar)}
          className="flex flex-1 flex-col"
          noValidate
        >
          <DialogBody>
            <FormInput
              label="Email:"
              type="email"
              placeholder="Digite o que o input pede..."
              error={errors.email?.message}
              {...register("email")}
            />

            <div className="flex flex-col gap-4 sm:flex-row">
              <FormInput
                label="Nome:"
                placeholder="Digite o que o input pede..."
                error={errors.nome?.message}
                {...register("nome")}
              />

              <Controller
                control={control}
                name="tipoConta"
                render={({ field }) => (
                  <FormSelect
                    label="Tipo de conta:"
                    placeholder="Selecione uma opção"
                    options={OPCOES_TIPO_CONTA}
                    error={errors.tipoConta?.message}
                    value={field.value}
                    onChange={field.onChange}
                    ref={field.ref}
                  />
                )}
              />
            </div>

            <FormInput
              label="Senha:"
              type="password"
              placeholder="Digite o que o input pede..."
              error={errors.senha?.message}
              {...register("senha")}
            />

            <FormInput
              label="Confirmar Senha:"
              type="password"
              placeholder="Digite o que o input pede..."
              error={errors.confirmarSenha?.message}
              {...register("confirmarSenha")}
            />

            <div className="flex flex-col gap-1.5 text-xs">
              <p className="font-semibold text-card-foreground">
                Senha deve conter:
              </p>
              <ul className="list-disc space-y-1 pl-5">
                {REGRAS_SENHA.map((regra) => {
                  const atendida = regra.validar(senhaDigitada);
                  return (
                    <li
                      key={regra.id}
                      data-testid={`regra-senha-${regra.id}`}
                      data-status={
                        !usuarioComecouADigitarSenha
                          ? "pending"
                          : atendida
                            ? "valid"
                            : "invalid"
                      }
                      className={cn(
                        "transition-colors",
                        !usuarioComecouADigitarSenha && "text-muted-foreground",
                        usuarioComecouADigitarSenha &&
                          atendida &&
                          "text-emerald-600",
                        usuarioComecouADigitarSenha &&
                          !atendida &&
                          "text-destructive",
                      )}
                    >
                      {regra.label}
                    </li>
                  );
                })}
              </ul>
            </div>
          </DialogBody>

          {erroEnvio && (
            <p
              role="alert"
              className="mt-3 text-sm font-medium text-destructive"
            >
              {erroEnvio}
            </p>
          )}

          <DialogFooter>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="cursor-pointer rounded-md bg-accent px-6 text-white hover:bg-cyan-400"
            >
              {isSubmitting ? "Cadastrando..." : "Cadastrar Usuário"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
