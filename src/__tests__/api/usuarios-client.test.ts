import { describe, expect, it, vi } from "vitest";
import {
  cadastrarUsuario,
  MENSAGEM_ERRO_CADASTRO_USUARIO,
} from "@/lib/usuarios-client";
import { OPCOES_TIPO_CONTA } from "@/schemas/usuario-form.schema";

const dadosFormularioValidos = {
  email: "novo.tecnico@altave.com",
  nome: "Novo Técnico",
  tipoConta: OPCOES_TIPO_CONTA[0],
  senha: "Senha@123",
  confirmarSenha: "Senha@123",
};

describe("cadastrarUsuario", () => {
  it("envia POST para /api/usuarios com payload mapeado e retorna sucesso", async () => {
    const usuarioCriado = {
      id: "550e8400-e29b-41d4-a716-446655440001",
      nome: "Novo Técnico",
      email: "novo.tecnico@altave.com",
      cargo: "TECNICO",
      ativo: true,
      senhaProvisoria: true,
      equipeId: null,
      criadoEm: "2026-10-17T00:00:00.000Z",
      atualizadoEm: "2026-10-17T00:00:00.000Z",
    };

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(usuarioCriado), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const resultado = await cadastrarUsuario(
      dadosFormularioValidos,
      fetchMock as unknown as typeof fetch,
    );

    expect(fetchMock).toHaveBeenCalledWith("/api/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: "Novo Técnico",
        email: "novo.tecnico@altave.com",
        cargo: "TECNICO",
        senha: "Senha@123",
      }),
    });

    expect(resultado).toEqual({
      sucesso: true,
      usuario: usuarioCriado,
    });
  });

  it("mapeia erros de campos vindos do backend (ex: e-mail já cadastrado)", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          erro: "Este e-mail já está cadastrado.",
          codigo: "EMAIL_JA_CADASTRADO",
          detalhes: {
            email: ["Este e-mail já está cadastrado."],
            cargo: ["Cargo inválido."],
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    const resultado = await cadastrarUsuario(
      dadosFormularioValidos,
      fetchMock as unknown as typeof fetch,
    );

    expect(resultado).toEqual({
      sucesso: false,
      erro: "Este e-mail já está cadastrado.",
      errosCampos: {
        email: "Este e-mail já está cadastrado.",
        tipoConta: "Cargo inválido.",
      },
    });
  });

  it("retorna mensagem de erro padrão quando ocorre falha de rede", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("Network error"));

    const resultado = await cadastrarUsuario(
      dadosFormularioValidos,
      fetchMock as unknown as typeof fetch,
    );

    expect(resultado).toEqual({
      sucesso: false,
      erro: MENSAGEM_ERRO_CADASTRO_USUARIO,
    });
  });
});
