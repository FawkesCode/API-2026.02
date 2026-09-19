import PageHeader from "@/components/page-header";
import TicketCard from "@/components/ticket-card";
import TicketFilter from "@/components/ticket-filter";
import { servicoProjeto } from "@/lib/services/projeto.service";
import { formatTicket, TicketRaw, TicketView } from "@/utils/formatTickets";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PageProps {
  params: Promise<{ id: string }>;
}

// {
//       id: 101,
//       title: "Falha de Conexão no Switch",
//       type: "Manutenção",
//       openedAt: "14/05",
//       timeRemaining: "5",
//       createdBy: "Mariana",
//       teams: ["Redes", "Suporte N2"],
//       status: "Em Andamento",
//       priority: "Alta",
//       description:
//         "Portas 12 a 16 do rack principal sem sinal após oscilação elétrica.",
//       recentLogs: [
//         {
//           title: "Tentativa de reinicialização remota",
//           sentBy: "Mariana",
//           sentAt: "14h20",
//         },
//         {
//           title: "Aguardando equipe em campo",
//           sentBy: "Carlos",
//           sentAt: "14h45",
//         },
//       ],
//     },

async function page({ params }: PageProps) {
  const { id } = await params;
  const projectInfo = await servicoProjeto.buscarDetalhePorId(id);
  const projectWTicket =
    await servicoProjeto.buscarProjetoComTicketDeInstalacao(id);
  const ticket = projectWTicket?.ticketInstalacao;

  const formatedTicket = ticket ? formatTicket(ticket) : null;
  const tickets: TicketView[] = formatedTicket ? [formatedTicket] : [];

  return (
    <>
      <PageHeader>{`Projeto ${projectInfo?.nome} > Tickets`}</PageHeader>

      <section className="flex flex-col gap-4 pb-8">
        <TicketFilter />
        {tickets.length !== 0 ? (
          tickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              projectId={id}
              woLogs={ticket.recentLogs?.length === 0 ? true : false}
            />
          ))
        ) : (
          <p className="col-span-full text-sm text-muted-foreground">
            Nenhum ticket cadastrado para o projeto #{id} ainda!
          </p>
        )}
      </section>
    </>
  );
}

export default page;
