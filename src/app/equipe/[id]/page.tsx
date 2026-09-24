import TicketsLogsView from "@/components/tickets/ticket-logs-view";

async function page({ params }: PageProps<"/equipe/[id]">) {
  const { id } = await params;

  return <TicketsLogsView id={id} backPageUrl="equipe" />;
}

export default page;
