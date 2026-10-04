import type { Cargo } from "@/lib/ticket-enums";

export interface UsuarioAtual {
  id: string;
  nome: string;
  email: string;
  cargo: Cargo;
  equipeId: string | null;
}
