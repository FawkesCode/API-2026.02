import { describe, expect, it } from "vitest";
import {
  podeCadastrarMensagensLog,
  podeVerMinhaEquipe,
  podeVerUsuarios,
} from "@/lib/access-control";
import { Cargo } from "@/types/ticket-enums";

const todosOsCargos = Object.values(Cargo);

describe("podeVerUsuarios", () => {
  it("libera a tela de usuários só para o Suporte Interno", () => {
    const liberados = todosOsCargos.filter((cargo) => podeVerUsuarios(cargo));

    expect(liberados).toEqual([Cargo.SUPORTE_INTERNO]);
  });

  it("nega quando não há usuário", () => {
    expect(podeVerUsuarios(null)).toBe(false);
    expect(podeVerUsuarios(undefined)).toBe(false);
  });
});

describe("podeVerMinhaEquipe", () => {
  it("libera a tela de equipe só para Técnico e Gestor", () => {
    const liberados = todosOsCargos.filter((cargo) => podeVerMinhaEquipe(cargo));

    expect(liberados.sort()).toEqual([Cargo.GESTOR, Cargo.TECNICO].sort());
  });

  it.each([Cargo.SUPORTE, Cargo.SUPORTE_INTERNO, Cargo.COMERCIAL])(
    "nega a tela de equipe para %s",
    (cargo) => {
      expect(podeVerMinhaEquipe(cargo)).toBe(false);
    },
  );
});

describe("podeCadastrarMensagensLog", () => {
  it("libera para os mesmos cargos que o endpoint de mensagens aceita", () => {
    const liberados = todosOsCargos.filter((cargo) => podeCadastrarMensagensLog(cargo));

    expect(liberados.sort()).toEqual([Cargo.GESTOR, Cargo.SUPORTE, Cargo.TECNICO].sort());
  });

  it("nega quando não há usuário", () => {
    expect(podeCadastrarMensagensLog(null)).toBe(false);
  });
});
