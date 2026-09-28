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
  id: "2f8faaf8-bb41-11f1-a26a-32c0198af045",
  nome: "Vitor",
  email: "vbomfimcunha@gmail.com",
  cargo: Cargo.GESTOR,
  equipeId: "5a41e662-101b-4176-abdb-d755f05213d1",
};
