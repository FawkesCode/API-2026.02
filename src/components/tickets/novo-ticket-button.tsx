"use client";

import { NovoTicketFlow } from "@/components/tickets/novo-ticket-flow";
import { useCurrentUser } from "@/hooks/use-current-user";
import { podeAbrirTicket } from "@/lib/access-control";

export function NovoTicketButton() {
  const usuario = useCurrentUser();

  if (!podeAbrirTicket(usuario.cargo)) {
    return null;
  }

  return <NovoTicketFlow />;
}