import type { SelectInterface } from "@/lib/data/dropdown";

/** Técnico exibido na lista do modal (e enviado no formulário). */
export interface TecnicoEquipe extends SelectInterface {
  /** ISO. Só existe para quem foi adicionado nesta edição (ver nota no PR). */
  adicionadoEm?: string;
}

/** Formato que vem do banco (DTO) para a leitura da equipe. */
export interface EquipeComUsuariosDTO {
  id: string;
  nome: string;
  descricao: string | null;
  usuarios: { id: string; nome: string; cargo: string }[];
}

/** Modelo consumido pela UI do modal "Gerenciar equipe". */
export interface EquipeEdicao {
  id: string;
  nome: string;
  descricao: string;
  responsavel: string;
  tecnicos: TecnicoEquipe[];
}