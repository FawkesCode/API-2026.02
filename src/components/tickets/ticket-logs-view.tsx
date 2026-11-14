import { PriorityBadge } from "@/components/priority-badge";
import { PriorityEditor } from "@/components/tickets/priority-editor";
import { Badge } from "@/components/ui/badge";
import TicketLogs from "@/components/tickets/ticket-logs";
import { GerenciarEquipesTicket } from "@/components/tickets/gerenciar-equipes-ticket";
import { getTicket } from "@/lib/data/project-ticket";
import { TicketView } from "@/types/ticket";
import { getTicketLogs } from "@/lib/data/ticket-logs";
import { getUsuarioLogado } from "@/lib/data/sessao";
import { toAutor } from "@/lib/mappers/historico.mapper";
import { Cargo } from "@/lib/generated/prisma/client";
type PriorityLevel = "critical" | "high" | "medium" | "low";

const TicketPriorityMap: Record<string, PriorityLevel> = {
  Baixa: "low",
  Média: "medium",
  Alta: "high",
  Crítica: "critical",
};

export default async function TicketsLogsView({ id }: { id: string }) {
  const ticket: TicketView = await getTicket(id);

  const [logs, usuarioLogado] = await Promise.all([
    getTicketLogs(id),
    getUsuarioLogado(),
  ]);
  const equipeDoUsuarioId = usuarioLogado?.equipeId ?? null;
  const daEquipe = !!equipeDoUsuarioId && ticket.teams.some((team) => team.id === equipeDoUsuarioId);
  const podeAlterarPrioridade = daEquipe && usuarioLogado?.cargo === Cargo.GESTOR;
  // Ticket encerrado fica só para leitura: sem trocar prioridade nem equipes.
  const podeEditarTicket = podeAlterarPrioridade && ticket.status !== "Encerrado";
  // Sai dos logs já carregados, sem consulta extra.
  const equipeIniciou =
    daEquipe &&
    logs.some((log) => log.tipo === "aviso" && log.inicioEquipeId === equipeDoUsuarioId);

  return (
    <>
      <section className="shrink-0 rounded-t-xl border -mt-6 border-gray-200 bg-white p-6">
        {ticket ? (
          <>
            <div className="flex justify-between">
              <h2 className="text-lg font-bold text-card-foreground">
                {ticket.title} {ticket.type !== "" && "|"} {ticket.type}
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground underline">
                  {ticket.status}
                </span>
                {podeEditarTicket ? (
                  <PriorityEditor ticketId={id} priority={ticket.priority} />
                ) : (
                  <PriorityBadge priority={TicketPriorityMap[ticket.priority]}>
                    {ticket.priority}
                  </PriorityBadge>
                )}
              </div>
            </div>
            <div className="flex items-start gap-2">
              {ticket.teams.length !== 0 ? (
                ticket.teams.map((team) => (
                  <Badge
                    key={team.id}
                    className="border-muted-foreground bg-transparent text-xs text-muted-foreground"
                  >
                    {team.nome}
                  </Badge>
                ))
              ) : (
                <span>Times ainda não atribuídos.</span>
              )}
              {podeEditarTicket && (
                <GerenciarEquipesTicket
                  ticketId={id}
                  equipesDoTicket={ticket.teams}
                  equipeDoUsuarioId={usuarioLogado?.equipeId}
                />
              )}
            </div>
          </>
        ) : null}
      </section>



      <TicketLogs ticketId={id} logsIniciais={logs} autor={usuarioLogado ? toAutor(usuarioLogado) : null}
        status={ticket.status} podeRegistrar={daEquipe} podeDecidir={podeAlterarPrioridade}
        equipeIniciou={equipeIniciou} />
    </>
  );
}