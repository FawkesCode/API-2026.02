"use client";

import { useState } from "react";
import { MessageSquareText } from "lucide-react";
import { LogSuggestion } from "@/components/tickets/log-suggestions";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useMensagensPadraoLog } from "@/hooks/use-mensagens-padrao-log";

interface MensagensPadraoLogProps {
  /** Recebe o texto da mensagem escolhida; não envia o log. */
  onInserir: (mensagem: string) => void;
  disabled?: boolean;
}

export function MensagensPadraoLog({ onInserir, disabled }: MensagensPadraoLogProps) {
  const [aberto, setAberto] = useState(false);
  // A lista só é buscada na primeira abertura, não ao montar o editor.
  const [jaAbriu, setJaAbriu] = useState(false);
  const { mensagens, carregando, erro, recarregar } =
    useMensagensPadraoLog(jaAbriu);

  function aoMudarAbertura(proximo: boolean) {
    setAberto(proximo);
    if (proximo && !jaAbriu) {
      setJaAbriu(true);
      return;
    }
    // Reabrir depois de uma falha tenta carregar de novo.
    if (proximo && erro) recarregar();
  }

  return (
    <Popover open={aberto} onOpenChange={aoMudarAbertura}>
      <PopoverTrigger
        render={
          <LogSuggestion
            disabled={disabled}
            className="inline-flex items-center gap-1.5"
            data-testid="mensagens-padrao-trigger"
          >
            <MessageSquareText className="size-3.5" aria-hidden />
            Mensagens padrão
          </LogSuggestion>
        }
      />

      <PopoverContent align="start" side="top" className="w-80 gap-3 p-3">
        <PopoverHeader>
          <PopoverTitle>Mensagens padrão</PopoverTitle>
          <PopoverDescription className="text-xs">
            Clique em uma mensagem para inseri-la no log.
          </PopoverDescription>
        </PopoverHeader>

        {carregando ? (
          <p className="text-xs text-muted-foreground" aria-live="polite">
            Carregando mensagens...
          </p>
        ) : erro ? (
          <div className="flex flex-col items-start gap-2">
            <p role="alert" className="text-xs font-medium text-destructive">
              {erro}
            </p>
            <LogSuggestion onClick={recarregar}>Tentar novamente</LogSuggestion>
          </div>
        ) : mensagens.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Você ainda não tem mensagens padrão cadastradas.
          </p>
        ) : (
          <ul
            aria-label="Mensagens padrão"
            className="-mx-1 flex max-h-64 flex-col gap-1 overflow-y-auto"
          >
            {mensagens.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  title={item.mensagem}
                  onClick={() => {
                    onInserir(item.mensagem);
                    setAberto(false);
                  }}
                  className="w-full cursor-pointer rounded-md px-2 py-1.5 text-left text-xs text-foreground transition-colors hover:bg-gray-100 focus-visible:bg-gray-100 focus-visible:outline-none"
                >
                  <span className="line-clamp-2 whitespace-pre-line break-words">
                    {item.mensagem}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
