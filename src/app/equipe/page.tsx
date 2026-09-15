import { PriorityButton } from "@/components/priority-button";
import {PriorityBadge} from "@/components/priority-badge";
export default function Team() {
  return (
  <>
    <h2>Página de Minha Equipe</h2>
    <PriorityButton priority="low" selected={true}>Salve</PriorityButton>
    <PriorityBadge priority="medium">cso</PriorityBadge>

    <h1>We are using n8n babyyyyy!</h1>
  </>
  

  )
}
