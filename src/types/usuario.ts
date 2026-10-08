import type { Cargo } from "@/types/ticket-enums";

export interface UsuarioAtual {
  id: string;
  nome: string;
  email: string;
  cargo: Cargo;
  equipeId: string | null;
}
