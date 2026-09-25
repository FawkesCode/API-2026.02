import { Cargo } from "@/lib/ticket-enums";

/** Identidade compartilhada do usuário de suporte usado no protótipo. */
export interface UsuarioAtual {
  id: string;
  nome: string;
  email: string;
  cargo: Cargo;
  equipeId: string | null;
}

export const USUARIO_MOCK: UsuarioAtual = {
  id: "3c14cfc8-b3ae-11f1-9aeb-0ea8acf6b539",
  nome: "Admin",
  email: "admin@gmail.com",
  cargo: Cargo.SUPORTE,
  equipeId: "5a41e662-101b-4176-abdb-d755f05213d1",
};
