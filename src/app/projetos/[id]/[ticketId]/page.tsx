import PageHeader from "@/components/page-header";

interface PageProps {
  params: Promise<{ id: string; ticketId: string }>;
}

async function page({ params }: PageProps) {
  const { id, ticketId } = await params;

  //TODO preencher a tela com os componentes de log
  // TODO: Validação da url a partir dos ids disponíveis no banco

  return (
    <>
      <PageHeader title={` Projeto COD ${id} > Ticket #${ticketId}`} />
      <section>
        <p className="text-muted-foreground">Logs dos tickets</p>
      </section>
    </>
  );
}

export default page;
