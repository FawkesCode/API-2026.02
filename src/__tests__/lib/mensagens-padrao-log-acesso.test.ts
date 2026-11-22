import { describe, expect, it } from "vitest";
import { Cargo } from "@/types/ticket-enums";
import { podeCadastrarMensagensLog } from "@/lib/access-control";

// O botão "Mensagens padrão" do ticket só aparece para quem o endpoint
// /api/mensagens-log aceita (cargosComLogs no controller); os demais levariam 403.
describe("mensagens padrão no log do ticket: filtro de cargo", () => {
  it.each([Cargo.TECNICO, Cargo.GESTOR, Cargo.SUPORTE])("mostra para %s", (cargo) => {
    expect(podeCadastrarMensagensLog(cargo)).toBe(true);
  });

  it.each([Cargo.SUPORTE_INTERNO, Cargo.COMERCIAL])("esconde para %s", (cargo) => {
    expect(podeCadastrarMensagensLog(cargo)).toBe(false);
  });

  it.each([null, undefined])("esconde sem usuário (%s)", (cargo) => {
    expect(podeCadastrarMensagensLog(cargo)).toBe(false);
  });
});
