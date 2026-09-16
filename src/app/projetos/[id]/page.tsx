import PageHeader from "@/components/page-header";
import TicketCard from "@/components/ticket-card";

interface PageProps {
  params: Promise<{ id: number }>;
  searchParams: Promise<{ title?: string }>;
}

async function page({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { title } = await searchParams; // Acho que vale mais a pena pegar o title por meio de get ao invés de passar ele como query param. N página de ticket, ignorei o title, justamente para focar em tentar essa alternativa depois

  const data = [
    {
      id: 101,
      title: "Falha de Conexão no Switch",
      type: "Manutenção",
      openedAt: "14/05",
      createdBy: "Mariana",
      teams: ["Redes", "Suporte N2"],
      status: "Em Andamento",
      priority: "Alta",
      description:
        "Portas 12 a 16 do rack principal sem sinal após oscilação elétrica.",
      recentLogs: [
        {
          title: "Tentativa de reinicialização remota",
          sentBy: "Mariana",
          sentAt: "14h20",
        },
        {
          title: "Aguardando equipe em campo",
          sentBy: "Carlos",
          sentAt: "14h45",
        },
      ],
    },
    {
      id: 102,
      title: "Troca de Painel Solar A3",
      type: "Manutenção",
      openedAt: "15/05",
      createdBy: "Lucas",
      teams: ["Campo", "Elétrica"],
      status: "Disponível",
      priority: "Média",
      description:
        "Módulo fotovoltaico apresentando eficiência 40% abaixo da média.",
      recentLogs: [
        {
          title: "Ordem de serviço aberta",
          sentBy: "Lucas",
          sentAt: "09h10",
        },
      ],
    },
    {
      id: 103,
      title: "Ajuste no Sensor de Acesso",
      type: "Instalação",
      openedAt: "15/05",
      createdBy: "Beatriz",
      teams: ["Segurança"],
      status: "Fechada",
      priority: "Baixa",
      description:
        "Leitor biométrico da catraca 2 perdendo sincronia com a base local.",
      recentLogs: [
        {
          title: "Atualização de firmware aplicada",
          sentBy: "Beatriz",
          sentAt: "16h05",
        },
        {
          title: "Testes validados com sucesso",
          sentBy: "Rodrigo",
          sentAt: "16h30",
        },
      ],
    },
  ];

  return (
    <>
      <PageHeader title={`Projeto ${title} : COD ${id} > Tickets`} />
      <section className="flex flex-col gap-4">
        {data.length !== 0 ? (
          data.map((ticket) => (
            <TicketCard
              key={ticket.id}
              projectId={id}
              title={ticket.title}
              id={ticket.id}
              type={ticket.type}
              openedAt={ticket.openedAt}
              createdBy={ticket.createdBy}
              teams={ticket.teams}
              status={ticket.status}
              priority={ticket.priority}
              description={ticket.description}
              recentLogs={ticket.recentLogs}
            />
          ))
        ) : (
          <p className="col-span-full text-sm text-muted-foreground">
            Nenhum ticket cadastrado para o projeto {title} ainda!
          </p>
        )}
      </section>
    </>
  );
}

export default page;
