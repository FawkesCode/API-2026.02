import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PATCH } from "@/app/api/clientes/[id]/route";
import { criarTokenDeSessao } from "@/auth/sessao";
import { Prisma } from "@/lib/generated/prisma/client";
import {
  ErroClienteNaoEncontrado,
  ErroClientePossuiProjetosAtivos,
  ErroCnpjJaCadastrado,
  ErroNomeClienteJaCadastrado,
  servicoCliente,
} from "@/services/cliente.service";
import { servicoUsuario } from "@/services/usuario.service";

process.env.SESSION_SECRET = "segredo-de-teste-com-32-caracteres";

const comercialId = "550e8400-e29b-41d4-a716-446655440005";
const clientId = "550e8400-e29b-41d4-a716-446655440100";
const updatedClient = {
  id: clientId,
  nome: "Acme Ltda",
  cnpj: "11222333000181",
  localizacao: "Rio de Janeiro - RJ",
  ativo: true,
  criadoEm: new Date("2026-01-01T00:00:00.000Z"),
  atualizadoEm: new Date("2026-01-02T00:00:00.000Z"),
};

function patch(
  body: unknown,
  options?: { authenticated?: boolean; id?: string },
) {
  const id = options?.id ?? clientId;
  const token = criarTokenDeSessao({
    usuarioId: comercialId,
    exp: Math.floor(Date.now() / 1000) + 60,
  });
  return PATCH(
    new Request(`http://localhost/api/clientes/${id}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        ...(options?.authenticated === false
          ? {}
          : { authorization: `Bearer ${token}` }),
      },
      body: typeof body === "string" ? body : JSON.stringify(body),
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

describe("PATCH /api/clientes/:id", () => {
  it("atualiza só o campo enviado e devolve 200", async () => {
    const update = vi
      .spyOn(servicoCliente, "updateClient")
      .mockResolvedValue(updatedClient as never);

    const response = await patch({ localizacao: " Rio de Janeiro - RJ " });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      id: clientId,
      localizacao: "Rio de Janeiro - RJ",
    });
    expect(update).toHaveBeenCalledWith(clientId, {
      localizacao: "Rio de Janeiro - RJ",
    });
  });

  it("aceita todos os campos juntos e normaliza o CNPJ", async () => {
    const update = vi
      .spyOn(servicoCliente, "updateClient")
      .mockResolvedValue(updatedClient as never);

    await patch({
      nome: "Acme Ltda",
      cnpj: "11.222.333/0001-81",
      localizacao: "SP",
      ativo: false,
    });

    expect(update).toHaveBeenCalledWith(clientId, {
      nome: "Acme Ltda",
      cnpj: "11222333000181",
      localizacao: "SP",
      ativo: false,
    });
  });

  it.each([true, false])("aceita só ativo=%s", async (ativo) => {
    const update = vi
      .spyOn(servicoCliente, "updateClient")
      .mockResolvedValue({ ...updatedClient, ativo } as never);

    const response = await patch({ ativo });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ativo });
    expect(update).toHaveBeenCalledWith(clientId, { ativo });
  });

  it("descarta campos desconhecidos", async () => {
    const update = vi
      .spyOn(servicoCliente, "updateClient")
      .mockResolvedValue(updatedClient as never);

    await patch({ nome: "Acme Ltda", id: "outro-id", criadoEm: "2020-01-01" });

    expect(update).toHaveBeenCalledWith(clientId, { nome: "Acme Ltda" });
  });

  it.each([
    ["body vazio", {}],
    ["só campos desconhecidos", { foo: "bar" }],
  ])("devolve 400 com %s", async (_case, body) => {
    const update = vi.spyOn(servicoCliente, "updateClient");

    const response = await patch(body);

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      erro: "Informe ao menos um campo para atualizar.",
      codigo: "DADOS_INVALIDOS",
    });
    expect(update).not.toHaveBeenCalled();
  });

  it.each([
    ["nome vazio", { nome: "  " }, "nome"],
    ["localização vazia", { localizacao: "" }, "localizacao"],
    ["CNPJ inválido", { cnpj: "11.222.333/0001-82" }, "cnpj"],
    ["ativo como texto", { ativo: "false" }, "ativo"],
    ["nome nulo", { nome: null }, "nome"],
  ])("devolve 400 para %s", async (_case, body, field) => {
    const update = vi.spyOn(servicoCliente, "updateClient");

    const response = await patch(body);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.codigo).toBe("DADOS_INVALIDOS");
    expect(json.detalhes).toHaveProperty(field);
    expect(update).not.toHaveBeenCalled();
  });

  it("devolve 400 para JSON inválido", async () => {
    const response = await patch("{nome:");

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ codigo: "JSON_INVALIDO" });
  });

  it("devolve 400 para id que não é UUID, sem chamar o serviço", async () => {
    const update = vi.spyOn(servicoCliente, "updateClient");

    const response = await patch({ nome: "Acme" }, { id: "abc" });

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ codigo: "ID_INVALIDO" });
    expect(update).not.toHaveBeenCalled();
  });

  it("devolve 401 sem sessão", async () => {
    const response = await patch({ nome: "Acme" }, { authenticated: false });

    expect(response.status).toBe(401);
  });

  it.each(["SUPORTE_INTERNO", "GESTOR"] as const)(
    "devolve 403 para o cargo %s",
    async (cargo) => {
      mockSession(cargo);
      const update = vi.spyOn(servicoCliente, "updateClient");

      const response = await patch({ nome: "Acme" });

      expect(response.status).toBe(403);
      expect(await response.json()).toMatchObject({ codigo: "SEM_PERMISSAO" });
      expect(update).not.toHaveBeenCalled();
    },
  );

  it("devolve 404 quando o cliente não existe", async () => {
    vi.spyOn(servicoCliente, "updateClient").mockRejectedValue(
      new ErroClienteNaoEncontrado(),
    );

    const response = await patch({ nome: "Acme" });

    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ codigo: "CLIENTE_NAO_ENCONTRADO" });
  });

  it.each([
    [new ErroCnpjJaCadastrado(), "CNPJ_JA_CADASTRADO"],
    [new ErroNomeClienteJaCadastrado(), "NOME_CLIENTE_JA_CADASTRADO"],
    [
      new Prisma.PrismaClientKnownRequestError("Unique constraint", {
        code: "P2002",
        clientVersion: "test",
      }),
      "CLIENTE_JA_CADASTRADO",
    ],
  ])("devolve 400 em duplicidade (%#)", async (error, codigo) => {
    vi.spyOn(servicoCliente, "updateClient").mockRejectedValue(error);

    const response = await patch({ nome: "Acme" });

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ codigo });
  });

  it("devolve 400 ao inativar cliente com projetos ativos", async () => {
    vi.spyOn(servicoCliente, "updateClient").mockRejectedValue(
      new ErroClientePossuiProjetosAtivos(),
    );

    const response = await patch({ ativo: false });

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      codigo: "CLIENTE_POSSUI_PROJETOS_ATIVOS",
    });
  });

  it("devolve 500 em erro inesperado", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(servicoCliente, "updateClient").mockRejectedValue(new Error("boom"));

    const response = await patch({ nome: "Acme" });

    expect(response.status).toBe(500);
    expect(await response.json()).toMatchObject({
      erro: "Erro interno ao atualizar cliente.",
      codigo: "ERRO_INTERNO",
    });
  });
});
