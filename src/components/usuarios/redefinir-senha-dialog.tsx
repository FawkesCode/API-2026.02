"use client";

import { useRef, useState, type FormEvent } from "react";
import { Check, Circle } from "lucide-react";
import { FormPassword } from "@/components/form/form-field";
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
import { toast } from "@/components/ui/toast";
import {
  redefinirSenhaTecnico,
  validarRedefinicaoSenha,
  type ErrosRedefinicaoSenha,
} from "@/lib/redefinicao-senha-client";
import { REGRAS_SENHA } from "@/schemas/usuario-form.schema";
import type { UsuarioListaItem } from "@/types/usuario";

interface RedefinirSenhaDialogProps {
  usuario: UsuarioListaItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RedefinirSenhaDialog({
  usuario,
  open,
  onOpenChange,
}: RedefinirSenhaDialogProps) {
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erros, setErros] = useState<ErrosRedefinicaoSenha>({});
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const pendente = useRef(false);

  function fechar(aberto: boolean) {
    if (pendente.current) return;
    if (!aberto) {
      setNovaSenha("");
      setConfirmacao("");
      setErros({});
      setErroEnvio(null);
    }
    onOpenChange(aberto);
  }

  async function submeter(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (pendente.current) return;

    setErroEnvio(null);
    const novosErros = validarRedefinicaoSenha(novaSenha, confirmacao);
    setErros(novosErros);
    if (novosErros.novaSenha || novosErros.confirmacao) return;

    pendente.current = true;
    setEnviando(true);
    try {
      const resultado = await redefinirSenhaTecnico(usuario.id, novaSenha);
      if (!resultado.sucesso) {
        if (resultado.erroSenha) {
          setErros({ novaSenha: resultado.erroSenha });
        } else {
          setErroEnvio(resultado.erro);
        }
        return;
      }

      pendente.current = false;
      fechar(false);
      toast.add({
        type: "success",
        title: "Senha redefinida",
        description: resultado.mensagem,
      });
    } finally {
      pendente.current = false;
      setEnviando(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={fechar}>
      <DialogContent className="flex max-h-[90vh] w-[calc(100vw-2rem)] flex-col gap-5 overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Redefinir senha</DialogTitle>
          <DialogDivider />
          <DialogDescription className="mb-0">
            Defina uma senha provisória para{" "}
            <strong className="break-words font-medium text-foreground">
              {usuario.nome}
            </strong>
            . O técnico deverá alterá-la no próximo acesso.
          </DialogDescription>
        </DialogHeader>

        {!usuario.ativo && (
          <p
            role="note"
            className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
          >
            Esta conta está inativa. A redefinição será recusada enquanto ela
            não for reativada.
          </p>
        )}

        <form
          onSubmit={submeter}
          className="flex min-w-0 flex-col"
          noValidate
          aria-busy={enviando}
        >
          <DialogBody>
            <FormPassword
              label="Nova senha"
              required
              autoComplete="new-password"
              placeholder="Digite a nova senha..."
              value={novaSenha}
              disabled={enviando}
              error={erros.novaSenha}
              onChange={(evento) => {
                setNovaSenha(evento.target.value);
                setErros({});
                setErroEnvio(null);
              }}
            />

            <div className="rounded-lg bg-muted/50 px-4 py-3 text-sm">
              <p className="mb-2 font-medium text-foreground">
                A senha deve conter:
              </p>
              <ul className="grid gap-x-4 gap-y-1.5 sm:grid-cols-2">
                {REGRAS_SENHA.map((regra) => {
                  const atende = regra.validar(novaSenha);
                  return (
                    <li
                      key={regra.id}
                      className="flex items-start gap-2 text-muted-foreground"
                    >
                      {atende ? (
                        <Check
                          aria-hidden="true"
                          className="mt-0.5 size-4 shrink-0 text-emerald-700"
                        />
                      ) : (
                        <Circle
                          aria-hidden="true"
                          className="mt-0.5 size-4 shrink-0"
                        />
                      )}
                      <span className={atende ? "text-foreground" : undefined}>
                        <span className="sr-only">
                          {atende ? "Atendida: " : "Pendente: "}
                        </span>
                        {regra.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>

            <FormPassword
              label="Confirmar nova senha"
              required
              autoComplete="new-password"
              placeholder="Confirme a nova senha..."
              value={confirmacao}
              disabled={enviando}
              error={erros.confirmacao}
              onChange={(evento) => {
                setConfirmacao(evento.target.value);
                setErros((atual) => ({ ...atual, confirmacao: undefined }));
                setErroEnvio(null);
              }}
            />
          </DialogBody>

          {erroEnvio && (
            <p role="alert" className="mt-4 text-sm font-medium text-destructive">
              {erroEnvio}
            </p>
          )}
          <DialogFooter className="flex-col-reverse sm:flex-row">
            <Button
              type="button"
              variant="outline"
              disabled={enviando}
              onClick={() => fechar(false)}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={enviando}
              className="w-full bg-accent text-white sm:w-auto"
            >
              {enviando ? "Redefinindo..." : "Redefinir senha"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
