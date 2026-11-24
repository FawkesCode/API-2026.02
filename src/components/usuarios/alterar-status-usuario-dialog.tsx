"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
  alterarStatusUsuario,
  MENSAGEM_ERRO_STATUS_USUARIO,
} from "@/lib/usuarios-client";
import type { UsuarioListaItem } from "@/types/usuario";

export interface AcoesAlteracaoStatusUsuario {
  setEnviando: (enviando: boolean) => void;
  setErro: (erro: string | null) => void;
  fechar: () => void;
  atualizarLista: () => void;
  notificarSucesso?: () => void;
  enviar?: typeof alterarStatusUsuario;
}

/**
 * Inverte o status do usuário (ativo -> inativo e vice-versa) chamando o
 * PATCH. Separada do componente para poder ser testada sem renderizar.
 */
export async function processarAlteracaoStatusUsuario(
  usuario: Pick<UsuarioListaItem, "id" | "nome" | "ativo">,
  acoes: AcoesAlteracaoStatusUsuario,
): Promise<void> {
  acoes.setErro(null);
  acoes.setEnviando(true);

  const novoStatus = !usuario.ativo;

  try {
    const resultado = await (acoes.enviar ?? alterarStatusUsuario)(
      usuario.id,
      novoStatus,
    );

    if (resultado.sucesso) {
      acoes.fechar();
      if (acoes.notificarSucesso) {
        acoes.notificarSucesso();
      } else {
        toast.add({
          type: "success",
          title: novoStatus ? "Usuário reativado" : "Usuário inativado",
          description: novoStatus
            ? `${usuario.nome} foi reativado com sucesso.`
            : `${usuario.nome} foi inativado com sucesso.`,
        });
      }
      acoes.atualizarLista();
      return;
    }

    // Inclui o ALTERAR_PROPRIO_STATUS: o backend não deixa o usuário
    // inativar a própria conta, e a mensagem dele é exibida no modal.
    acoes.setErro(resultado.erro);
  } catch {
    acoes.setErro(MENSAGEM_ERRO_STATUS_USUARIO);
  } finally {
    acoes.setEnviando(false);
  }
}

interface AlterarStatusUsuarioDialogProps {
  usuario: UsuarioListaItem;
  aberto: boolean;
  onAbertoChange: (aberto: boolean) => void;
}

export function AlterarStatusUsuarioDialog({
  usuario,
  aberto,
  onAbertoChange,
}: AlterarStatusUsuarioDialogProps) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Usuário ativo -> a ação é inativar; usuário inativo -> reativar.
  const inativando = usuario.ativo;
  const titulo = inativando ? "Inativar usuário" : "Reativar usuário";
  const rotuloConfirmar = inativando ? "Inativar" : "Reativar";
  const rotuloEnviando = inativando ? "Inativando..." : "Reativando...";

  function aoMudarAbertura(valor: boolean) {
    // Não deixa fechar no meio da requisição.
    if (enviando) return;
    if (!valor) setErro(null);
    onAbertoChange(valor);
  }

  async function aoConfirmar() {
    await processarAlteracaoStatusUsuario(usuario, {
      setEnviando,
      setErro,
      fechar: () => onAbertoChange(false),
      atualizarLista: () => router.refresh(),
    });
  }

  return (
    <Dialog open={aberto} onOpenChange={aoMudarAbertura}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-5 overflow-y-auto">
        <DialogHeader className="h-fit">
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDivider />
          <DialogDescription>
            {inativando
              ? "Confirme a inativação desta conta."
              : "Confirme a reativação desta conta."}
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          <div className="flex flex-col gap-1 text-sm">
            <p className="font-semibold text-card-foreground">{usuario.nome}</p>
            <p className="text-muted-foreground">{usuario.email}</p>
          </div>

          <p className="text-sm text-muted-foreground">
            {inativando
              ? "O usuário ficará com o status Inativo. Você poderá reativá-lo depois."
              : "O usuário ficará com o status Ativo."}
          </p>
        </DialogBody>

        {erro && (
          <p role="alert" className="text-sm font-medium text-destructive">
            {erro}
          </p>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={enviando}
            onClick={() => aoMudarAbertura(false)}
            className="cursor-pointer rounded-md px-6"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={enviando}
            onClick={aoConfirmar}
            className={
              inativando
                ? "cursor-pointer rounded-md bg-destructive px-6 text-white hover:bg-destructive/90"
                : "cursor-pointer rounded-md bg-accent px-6 text-white hover:bg-cyan-400"
            }
          >
            {enviando ? rotuloEnviando : rotuloConfirmar}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}