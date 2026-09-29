"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDivider,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ProjectSearchSelect } from "@/components/tickets/project-search-select";
import { AbrirTicketDialog } from "@/components/tickets/abrir-ticket-dialog";
import type { ProjetoResumo } from "@/hooks/use-projetos-disponiveis";

type Etapa = "buscar-projeto" | "formulario";

/**
 * Botão "+ Abrir Ticket" (só deve ser renderizado onde
 * podeAbrirTicket(usuario.cargo) for true — ver page.tsx). Ao clicar:
 * 1) abre a busca de projeto (barra de pesquisa + lista filtrada pela
 *    equipe do usuário);
 * 2) ao selecionar um projeto, troca para o formulário de abertura de
 *    ticket (mockup principal), já com o projeto vinculado.
 */
export function NovoTicketFlow() {
  const [aberto, setAberto] = React.useState(false);
  const [etapa, setEtapa] = React.useState<Etapa>("buscar-projeto");
  const [projeto, setProjeto] = React.useState<ProjetoResumo | null>(null);

  function abrirFluxo() {
    setEtapa("buscar-projeto");
    setProjeto(null);
    setAberto(true);
  }

  function aoSelecionarProjeto(projetoEscolhido: ProjetoResumo) {
    setProjeto(projetoEscolhido);
    setEtapa("formulario");
  }

  function fecharTudo(open: boolean) {
    setAberto(open);
    if (!open) {
      setEtapa("buscar-projeto");
      setProjeto(null);
    }
  }

  return (
    <>
      <Button onClick={abrirFluxo} className="bg-accent text-white">
        + Abrir Ticket
      </Button>

      {etapa === "buscar-projeto" && (
        <Dialog open={aberto} onOpenChange={fecharTudo}>
          <DialogContent className="min-h-fit flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle className="text-accent">
                Selecionar Projeto
              </DialogTitle>
            </DialogHeader>
            <ProjectSearchSelect onSelect={aoSelecionarProjeto} />
          </DialogContent>
        </Dialog>
      )}

      {etapa === "formulario" && (
        <AbrirTicketDialog
          open={aberto}
          onOpenChange={fecharTudo}
          projetoInicialId={projeto?.id}
        />
      )}
    </>
  );
}
