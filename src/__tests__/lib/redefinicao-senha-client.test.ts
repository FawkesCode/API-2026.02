import { describe, expect, it, vi } from "vitest";
import {
  redefinirSenhaTecnico,
  validarRedefinicaoSenha,
} from "@/lib/redefinicao-senha-client";

const usuarioId = "550e8400-e29b-41d4-a716-446655440010";
const senha = "NovaSenha@123";

function resposta(corpo: unknown, status: number) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("validação da redefinição de senha", () => {
  it("aceita senha forte com confirmação idêntica", () => {
    expect(validarRedefinicaoSenha(senha, senha)).toEqual({
      novaSenha: undefined,
      confirmacao: undefined,
    });
  });

  it("informa a regra inválida e a confirmação ausente sem enviar dados", () => {
    expect(validarRedefinicaoSenha("abc", "")).toEqual({
      novaSenha: "Senha deve ter pelo menos 8 caracteres.",
      confirmacao: "Confirme a nova senha.",
    });
  });

  it("identifica confirmação divergente", () => {
    expect(validarRedefinicaoSenha(senha, "OutraSenha@123")).toEqual({
      novaSenha: undefined,
      confirmacao: "As senhas não coincidem.",
    });
  });
});

describe("PATCH /api/usuarios/:id/senha no cliente", () => {
  it("envia somente a nova senha e repassa a confirmação de sucesso", async () => {
    const fetchFn = vi.fn().mockResolvedValue(resposta({ mensagem: "Senha redefinida com sucesso." }, 200));

    expect(await redefinirSenhaTecnico(usuarioId, senha, fetchFn)).toEqual({
      sucesso: true,
      mensagem: "Senha redefinida com sucesso.",
    });
    expect(fetchFn).toHaveBeenCalledWith(`/api/usuarios/${usuarioId}/senha`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ novaSenha: senha }),
    });
  });

  it("exibe a recusa para usuário inativo sem converter erro em sucesso", async () => {
    const fetchFn = vi.fn().mockResolvedValue(resposta({
      codigo: "USUARIO_INATIVO",
      erro: "Não é possível redefinir a senha de um usuário inativo.",
    }, 400));

    expect(await redefinirSenhaTecnico(usuarioId, senha, fetchFn)).toEqual({
      sucesso: false,
      erro: "Não é possível redefinir a senha de um usuário inativo.",
    });
  });

  it("devolve erros de política de senha para o campo correto", async () => {
    const fetchFn = vi.fn().mockResolvedValue(resposta({
      erro: "Dados inválidos.",
      detalhes: { novaSenha: ["Senha deve conter ao menos um número."] },
    }, 400));

    expect(await redefinirSenhaTecnico(usuarioId, senha, fetchFn)).toEqual({
      sucesso: false,
      erro: "Dados inválidos.",
      erroSenha: "Senha deve conter ao menos um número.",
    });
  });

  it("trata respostas sem JSON e falhas de conexão", async () => {
    const erroServidor = vi.fn().mockResolvedValue(new Response("", { status: 500 }));
    const falhaRede = vi.fn().mockRejectedValue(new Error("offline"));

    expect(await redefinirSenhaTecnico(usuarioId, senha, erroServidor)).toEqual({
      sucesso: false,
      erro: "Não foi possível redefinir a senha. Tente novamente.",
    });
    expect(await redefinirSenhaTecnico(usuarioId, senha, falhaRede)).toEqual({
      sucesso: false,
      erro: "Falha de conexão ao redefinir a senha. Verifique sua conexão e tente novamente.",
    });
  });
});
