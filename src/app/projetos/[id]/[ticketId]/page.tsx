import PageHeader from "@/components/page-header";

interface PageProps {
  params: Promise<{ id: number; ticketId: number }>;
}

async function page({ params }: PageProps) {
  const { id, ticketId } = await params;

  return (
    <>
      <PageHeader title={` Projeto COD ${id} > Ticket #${ticketId}`} />
    </>
  );
}

export default page;
