import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE } from "@/app/api/clientes/[id]/route";
import { criarTokenDeSessao } from "@/auth/sessao";
import { Prisma } from "@/lib/generated/prisma/client";
import {
  ErroClienteNaoEncontrado,
  ErroClientePossuiProjetos,
  servicoCliente,
} from "@/services/cliente.service";
import { servicoUsuario } from "@/services/usuario.service";

process.env.SESSION_SECRET = "segredo-de-teste-com-32-caracteres";

const comercialId = "550e8400-e29b-41d4-a716-446655440005";
const clientId = "550e8400-e29b-41d4-a716-446655440100";

function del(options?: { authenticated?: boolean; id?: string }) {
  const id = options?.id ?? clientId;
  const token = criarTokenDeSessao({
    usuarioId: comercialId,
    exp: Math.floor(Date.now() / 1000) + 60,
  });
  return DELETE(
    new Request(`http://localhost/api/clientes/${id}`, {
      method: "DELETE",
      headers:
        options?.authenticated === false ? {} : { authorization: `Bearer ${token}` },
    }),
    { params: Promise.resolve({ id }) },
  );
}

function mockSession(cargo: "COMERCIAL" | "SUPORTE_INTERNO" | "GESTOR" = "COMERCIAL") {
  vi.spyOn(servicoUsuario, "buscarPorId").mockResolvedValue({
    id: comercialId,
    nome: "Comercial",
    email: "comercial@example.com",
    cargo,
    ativo: true,
    equipeId: null,
    equipe: null,
    criadoEm: new Date(),
  } as never);
}

beforeEach(() => mockSession());
afterEach(() => vi.restoreAllMocks());

describe("DELETE /api/clientes/:id", () => {
  it("exclui o cliente e devolve 204 sem corpo", async () => {
    const remove = vi.spyOn(servicoCliente, "deleteClient").mockResolvedValue();

    const response = await del();

    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
    expect(remove).toHaveBeenCalledWith(clientId);
  });

  it("devolve 400 quando o cliente possui projetos", async () => {
    vi.spyOn(servicoCliente, "deleteClient").mockRejectedValue(
      new ErroClientePossuiProjetos(),
    );

    const response = await del();

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      codigo: "CLIENTE_POSSUI_PROJETOS",
    });
  });

  it("devolve 400 quando a FK do banco barra a exclusão (P2003)", async () => {
    vi.spyOn(servicoCliente, "deleteClient").mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Foreign key constraint", {
        code: "P2003",
        clientVersion: "test",
      }),
    );

    const response = await del();

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      codigo: "CLIENTE_POSSUI_PROJETOS",
    });
  });

  it("devolve 404 quando o cliente não existe", async () => {
    vi.spyOn(servicoCliente, "deleteClient").mockRejectedValue(
      new ErroClienteNaoEncontrado(),
    );

    const response = await del();

    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ codigo: "CLIENTE_NAO_ENCONTRADO" });
  });

  it("devolve 400 para id que não é UUID, sem chamar o serviço", async () => {
    const remove = vi.spyOn(servicoCliente, "deleteClient");

    const response = await del({ id: "abc" });

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ codigo: "ID_INVALIDO" });
    expect(remove).not.toHaveBeenCalled();
  });

  it("devolve 401 sem sessão", async () => {
    const remove = vi.spyOn(servicoCliente, "deleteClient");

    const response = await del({ authenticated: false });

    expect(response.status).toBe(401);
    expect(remove).not.toHaveBeenCalled();
  });

  it.each(["SUPORTE_INTERNO", "GESTOR"] as const)(
    "devolve 403 para o cargo %s",
    async (cargo) => {
      mockSession(cargo);
      const remove = vi.spyOn(servicoCliente, "deleteClient");

      const response = await del();

      expect(response.status).toBe(403);
      expect(await response.json()).toMatchObject({ codigo: "SEM_PERMISSAO" });
      expect(remove).not.toHaveBeenCalled();
    },
  );

  it("devolve 500 em erro inesperado", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(servicoCliente, "deleteClient").mockRejectedValue(new Error("boom"));

    const response = await del();

    expect(response.status).toBe(500);
    expect(await response.json()).toMatchObject({
      erro: "Erro interno ao excluir cliente.",
      codigo: "ERRO_INTERNO",
    });
  });
});
