import { PriorityBadge } from "@/components/priority-badge";


export default async function LogsTicket({params}: PageProps<"/tickets/[id]">) {
  const { id } = await params;
  return (
    <section>
      <PriorityBadge priority="critical">
        Ticket #{id}
      </PriorityBadge>
    </section>
  )
}
