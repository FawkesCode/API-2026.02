import PageHeader from "@/components/page-header";
import TicketCard from "@/components/ticket-card";
import TicketFilter from "@/components/ticket-filter";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function page({ params }: PageProps) {
  const { id } = await params;

  // TODO: Validação da url a partir dos ids disponíveis no banco

  // Mock temporário apenas para testar visibilidade dos componentes | TODO: Substituir para os dados verdadeiros quando os endpoints estiverem concluídos
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
      <PageHeader title={`Projeto COD ${id} > Tickets`} />

      <section className="flex flex-col gap-4 pb-8">
        <TicketFilter />
        {data.length !== 0 ? (
          data.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} projectId={id} />
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
