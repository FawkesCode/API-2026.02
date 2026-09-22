import { z } from "zod";
import { Categoria, Prioridade } from "@/lib/ticket-enums";
import { SLA_OPTIONS } from "@/lib/sla-options";

const slaValues = SLA_OPTIONS.map((opcao) => opcao.value) as [
  string,
  ...string[],
];

/**
 * Validação do formulário exibido na tela (mockup). Note que ela é mais
 * rígida que `criarTicketSchema` do backend em dois pontos:
 * - `categoria` e `prioridade` são obrigatórios aqui (o mockup marca os
 *   dois com "*"), embora `prioridade` seja opcional no backend.
 * - `slaPreset` substitui `slaEm`; a conversão para uma data futura
 *   acontece no submit (ver `calcularSlaEm`).
 * "Equipes" não faz parte deste schema pois não existe no model Ticket
 * (ver nota em access-control.ts / no componente do diálogo).
 */
export const ticketFormSchema = z.object({
  projetoId: z.uuid("Selecione um projeto válido."),
  titulo: z
    .string()
    .trim()
    .min(1, "Título é obrigatório.")
    .max(180, "Título deve ter no máximo 180 caracteres."),
  descricao: z
    .string()
    .trim()
    .min(1, "Descrição do problema é obrigatória.")
    .max(10_000, "Descrição excede o limite de 10.000 caracteres."),
  categoria: z.enum(Categoria, { error: "Selecione o tipo do ticket." }),
  prioridade: z.enum(Prioridade, { error: "Selecione a prioridade." }),
  slaPreset: z.enum(slaValues, { error: "Selecione o SLA estimado." }),
});

export type TicketFormValues = z.infer<typeof ticketFormSchema>;
