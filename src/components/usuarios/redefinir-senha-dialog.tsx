"use client";

import { useState, type FormEvent } from "react";
import { FormPassword } from "@/components/form/form-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
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
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function fechar(aberto: boolean) {
    onOpenChange(aberto);
    if (!aberto) {
      setNovaSenha("");
      setConfirmacao("");
      setErro(null);
    }
  }

  async function submeter(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro(null);
    if (novaSenha !== confirmacao) {
      setErro("As senhas não coincidem.");
      return;
    }

    setEnviando(true);
    try {
      const resposta = await fetch(`/api/usuarios/${usuario.id}/senha`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ novaSenha }),
      });
      const corpo = (await resposta.json().catch(() => null)) as {
        erro?: string;
        mensagem?: string;
      } | null;

      if (!resposta.ok) {
        setErro(corpo?.erro ?? "Não foi possível redefinir a senha.");
        return;
      }

      fechar(false);
      toast.add({
        type: "success",
        title: "Senha redefinida",
        description: corpo?.mensagem ?? "A senha foi redefinida com sucesso.",
      });
    } catch {
      setErro("Falha de conexão ao redefinir a senha. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={fechar}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-5 overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Redefinir senha</DialogTitle>
          <DialogDescription>
            Defina uma nova senha para {usuario.nome}. Ela será provisória e o
            usuário deverá alterá-la no próximo acesso.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submeter} className="flex flex-col gap-4" noValidate>
          <DialogBody>
            <FormPassword
              label="Nova senha"
              required
              autoComplete="new-password"
              placeholder="Digite a nova senha..."
              value={novaSenha}
              onChange={(evento) => setNovaSenha(evento.target.value)}
            />
            <FormPassword
              label="Confirmar nova senha"
              required
              autoComplete="new-password"
              placeholder="Confirme a nova senha..."
              value={confirmacao}
              onChange={(evento) => setConfirmacao(evento.target.value)}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Mínimo de 8 caracteres, com letras maiúsculas e minúsculas, um
              número e um caractere especial.
            </p>
          </DialogBody>
          {erro && (
            <p role="alert" className="text-sm font-medium text-destructive">
              {erro}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => fechar(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={enviando} className="bg-accent text-white">
              {enviando ? "Redefinindo..." : "Redefinir senha"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
