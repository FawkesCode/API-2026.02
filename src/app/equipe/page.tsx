import { PriorityButton } from "@/components/priority-button";
import { PriorityBadge } from "@/components/priority-badge";
import PageHeader from "@/components/page-header";

export default function Team() {
  return (
    <>
      <PageHeader>Minha Equipe</PageHeader>
      <h2>Página de Minha Equipe</h2>
      <PriorityButton priority="low" selected={true}>
        Salve
      </PriorityButton>
      <PriorityBadge priority="medium">cso</PriorityBadge>
    </>
  );
}
