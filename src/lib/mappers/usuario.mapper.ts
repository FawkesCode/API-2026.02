import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { UsuarioListaRegistro } from "@/services/usuario.service";
import {
  CARGO_UI,
  CARGO_UI_PADRAO,
  type UsuarioListaItem,
} from "@/types/usuario";

function capitalizar(texto: string) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** Registro do banco -> modelo pronto para a tabela ("12 Out, 2026"). */
export function toUsuarioListaItem(registro: UsuarioListaRegistro): UsuarioListaItem {
  const ui = CARGO_UI[registro.cargo] ?? CARGO_UI_PADRAO;
  const mes = capitalizar(format(registro.criadoEm, "MMM", { locale: ptBR }));

  return {
    id: registro.id,
    nome: registro.nome,
    inicial: registro.nome.trim().charAt(0).toUpperCase(),
    email: registro.email,
    cargoLabel: ui.label,
    cor: ui.cor,
    ativo: registro.ativo,
    adicionadoEm: `${format(registro.criadoEm, "dd")} ${mes}, ${format(registro.criadoEm, "yyyy")}`,
    equipe: registro.equipe?.nome ?? null,
    adicionadoPor: registro.criadoPor
  ? `${registro.criadoPor.nome} (${registro.criadoPor.email})`
  : null,
  };
}