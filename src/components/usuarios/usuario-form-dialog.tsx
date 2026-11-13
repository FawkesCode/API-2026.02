"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Controller,
  useForm,
  useWatch,
  type FieldErrors,
  type Resolver,
  type UseFormResetField,
  type UseFormSetError,
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
import {
  FormInput,
  FormPassword,
  FormSelect,
} from "@/components/form/form-field";
import {
  atualizarUsuario,
  cadastrarUsuario,
  mapearErrosCamposUsuario,
  MENSAGEM_ERRO_CADASTRO_USUARIO,
  MENSAGEM_ERRO_EDICAO_USUARIO,
} from "@/lib/usuarios-client";
import { cn } from "@/lib/utils";
import {
  OPCOES_TIPO_CONTA,
  REGRAS_SENHA,
  toUsuarioFormInput,
  usuarioEdicaoFormSchema,
  usuarioFormSchema,
  type UsuarioFormInput,
  type UsuarioFormValues,
} from "@/schemas/usuario-form.schema";
import type { UsuarioListaItem } from "@/types/usuario";

export const VALORES_INICIAIS_USUARIO_FORM: UsuarioFormInput = {
  email: "",
  nome: "",
  tipoConta: null,
  senha: "",
  confirmarSenha: "",
};

export interface AcoesSubmissaoUsuarioForm {
  reset: (values?: UsuarioFormInput) => void;
  resetField: UseFormResetField<UsuarioFormInput>;
  setError: UseFormSetError<UsuarioFormInput>;
  setAberto: (aberto: boolean) => void;
  setErroEnvio: (erro: string | null) => void;
  atualizarLista: () => void;
  notificarSucesso?: () => void;
  enviarCadastro?: typeof cadastrarUsuario;
  /** Presente => modo edição (PUT /api/usuarios/[id]). */
  usuarioId?: string;
  enviarEdicao?: typeof atualizarUsuario;
}

export function tratarFalhaValidacaoSenha(
  errosValidacao: FieldErrors<UsuarioFormInput>,
  senhaDigitada: string,
  resetField: UseFormResetField<UsuarioFormInput>,
): void {
  if (errosValidacao.senha && senhaDigitada.length > 0) {
    resetField("senha", { keepError: true });
  }
}

export async function processarEnvioCadastroUsuario(
  data: UsuarioFormValues,
  acoes: AcoesSubmissaoUsuarioForm,
): Promise<void> {
  acoes.setErroEnvio(null);

  const editando = Boolean(acoes.usuarioId);
  let resultado: Awaited<ReturnType<typeof cadastrarUsuario>>;

  try {
    resultado = editando
      ? await (acoes.enviarEdicao ?? atualizarUsuario)(acoes.usuarioId!, data)
      : await (acoes.enviarCadastro ?? cadastrarUsuario)(data);
  } catch {
    acoes.setErroEnvio(
      editando ? MENSAGEM_ERRO_EDICAO_USUARIO : MENSAGEM_ERRO_CADASTRO_USUARIO,
    );
    return;
  }

  if (resultado.sucesso) {
    acoes.reset(VALORES_INICIAIS_USUARIO_FORM);
    acoes.setAberto(false);
    if (acoes.notificarSucesso) {
      acoes.notificarSucesso();
    } else {
      toast.add({
        type: "success",
        title: editando ? "Usuário atualizado" : "Usuário cadastrado",
        description: editando
          ? "As alterações foram salvas com sucesso."
          : "O novo usuário foi cadastrado com sucesso.",
      });
    }
    acoes.atualizarLista();
    return;
  }

  // O backend bloqueia a troca do próprio cargo (resposta sem `detalhes`):
  // mostramos o erro direto no campo "Tipo de conta".
  if (resultado.codigo === "ALTERAR_PROPRIO_CARGO") {
    acoes.setError("tipoConta", { type: "server", message: resultado.erro });
    return;
  }

  const errosCampos = {
    ...mapearErrosCamposUsuario(resultado.detalhes),
    ...resultado.errosCampos,
  };
  const { email, nome, tipoConta, senha } = errosCampos;

  if (email) {
    acoes.setError("email", { type: "server", message: email });
  }
  if (nome) {
    acoes.setError("nome", { type: "server", message: nome });
  }
  if (tipoConta) {
    acoes.setError("tipoConta", { type: "server", message: tipoConta });
  }
  if (senha) {
    acoes.resetField("senha");
    acoes.setError("senha", { type: "server", message: senha });
  }

  acoes.setErroEnvio(resultado.erro);
}

interface UsuarioFormDialogProps {
  /** Usuário selecionado na tabela: presente => modo edição. */
  usuario?: UsuarioListaItem | null;
  /** Controle externo de abertura (usado na edição, pela tabela). */
  aberto?: boolean;
  onAbertoChange?: (aberto: boolean) => void;
}

export function UsuarioFormDialog({
  usuario = null,
  aberto: abertoProp,
  onAbertoChange,
}: UsuarioFormDialogProps = {}) {
  const router = useRouter();
  const editando = usuario !== null;
  const [abertoInterno, setAbertoInterno] = useState(false);
  const aberto = abertoProp ?? abertoInterno;
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);

  const valoresIniciais = useMemo(
    () =>
      usuario ? toUsuarioFormInput(usuario) : VALORES_INICIAIS_USUARIO_FORM,
    [usuario],
  );

  const {
    register,
    control,
    handleSubmit,
    reset,
    resetField,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<UsuarioFormInput, unknown, UsuarioFormValues>({
    resolver: zodResolver(
      editando ? usuarioEdicaoFormSchema : usuarioFormSchema,
    ) as Resolver<UsuarioFormInput, unknown, UsuarioFormValues>,
    defaultValues: valoresIniciais,
  });

  const senhaDigitada =
    useWatch({ control, name: "senha", defaultValue: "" }) ?? "";
  const usuarioComecouADigitarSenha = senhaDigitada.length > 0;

  function definirAberto(valor: boolean) {
    setAbertoInterno(valor);
    onAbertoChange?.(valor);
  }

  function aoMudarAbertura(valor: boolean) {
    definirAberto(valor);
    if (!valor) {
      reset(valoresIniciais);
      setErroEnvio(null);
    }
  }

  function aoFalhar(errosValidacao: FieldErrors<UsuarioFormInput>) {
    tratarFalhaValidacaoSenha(errosValidacao, senhaDigitada, resetField);
  }

  async function aoEnviar(data: UsuarioFormValues) {
    await processarEnvioCadastroUsuario(data, {
      reset,
      resetField,
      setError,
      setAberto: definirAberto,
      setErroEnvio,
      atualizarLista: () => router.refresh(),
      usuarioId: usuario?.id,
    });
  }

  return (
    <Dialog open={aberto} onOpenChange={aoMudarAbertura}>
      {!editando && (
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
      )}

      <DialogContent className="flex max-h-[90vh] flex-col gap-5 overflow-y-auto">
        <DialogHeader className="h-fit">
          <DialogTitle>
            {editando ? "Editar Usuário" : "Cadastrar novo Usuário"}
          </DialogTitle>
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
              required
              placeholder="Digite o email..."
              error={errors.email?.message}
              {...register("email")}
            />

            <div className="flex flex-col gap-4 sm:flex-row">
              <FormInput
                label="Nome:"
                required
                placeholder="Digite o nome do usuário.."
                error={errors.nome?.message}
                {...register("nome")}
              />

              <Controller
                control={control}
                name="tipoConta"
                render={({ field }) => (
                  <FormSelect
                    label="Tipo de conta:"
                    required
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

            {!editando && (
              <>
                <FormPassword
                  label="Senha:"
                  required
                  placeholder="Digite a senha..."
                  error={errors.senha?.message}
                  {...register("senha")}
                />

                <FormPassword
                  label="Confirmar Senha:"
                  required
                  placeholder="Confirme a senha informada..."
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
                            !usuarioComecouADigitarSenha &&
                              "text-muted-foreground",
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
              </>
            )}
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
              {isSubmitting
                ? editando
                  ? "Salvando..."
                  : "Cadastrando..."
                : editando
                  ? "Salvar Alterações"
                  : "Cadastrar Usuário"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}