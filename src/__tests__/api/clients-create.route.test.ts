import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/clientes/route";
import { criarTokenDeSessao } from "@/auth/sessao";
import { Prisma } from "@/lib/generated/prisma/client";
import {
  ErroCnpjJaCadastrado,
  ErroNomeClienteJaCadastrado,
  servicoCliente,
} from "@/services/cliente.service";
import { servicoUsuario } from "@/services/usuario.service";

process.env.SESSION_SECRET = "segredo-de-teste-com-32-caracteres";

const comercialId = "550e8400-e29b-41d4-a716-446655440005";
const createdClient = {
  id: "550e8400-e29b-41d4-a716-446655440100",
  nome: "Acme Ltda",
  cnpj: "11222333000181",
  localizacao: "São Paulo - SP",
  ativo: true,
  criadoEm: new Date("2026-01-01T00:00:00.000Z"),
  atualizadoEm: new Date("2026-01-01T00:00:00.000Z"),
};
const validBody = {
  nome: "Acme Ltda",
  cnpj: "11.222.333/0001-81",
  localizacao: "São Paulo - SP",
};

function post(body: unknown, options?: { authenticated?: boolean }) {
  const token = criarTokenDeSessao({
    usuarioId: comercialId,
    exp: Math.floor(Date.now() / 1000) + 60,
  });
  return POST(
    new Request("http://localhost/api/clientes", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(options?.authenticated === false
          ? {}
          : { authorization: `Bearer ${token}` }),
      },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
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

describe("POST /api/clientes", () => {
  it("cadastra o cliente e devolve 201 com o CNPJ só em dígitos", async () => {
    const create = vi
      .spyOn(servicoCliente, "createClient")
      .mockResolvedValue(createdClient as never);

    const response = await post(validBody);

    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({
      id: createdClient.id,
      cnpj: "11222333000181",
      ativo: true,
    });
    expect(create).toHaveBeenCalledWith({
      nome: "Acme Ltda",
      cnpj: "11222333000181",
      localizacao: "São Paulo - SP",
    });
  });

  it("aceita CNPJ sem máscara e remove espaços das pontas", async () => {
    const create = vi
      .spyOn(servicoCliente, "createClient")
      .mockResolvedValue(createdClient as never);

    await post({ nome: "  Acme Ltda ", cnpj: "11222333000181", localizacao: " SP " });

    expect(create).toHaveBeenCalledWith({
      nome: "Acme Ltda",
      cnpj: "11222333000181",
      localizacao: "SP",
    });
  });

  it("devolve 401 sem sessão", async () => {
    const response = await post(validBody, { authenticated: false });

    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ codigo: "NAO_AUTENTICADO" });
  });

  it.each(["SUPORTE_INTERNO", "GESTOR"] as const)(
    "devolve 403 para o cargo %s",
    async (cargo) => {
      mockSession(cargo);
      const create = vi.spyOn(servicoCliente, "createClient");

      const response = await post(validBody);

      expect(response.status).toBe(403);
      expect(await response.json()).toMatchObject({ codigo: "SEM_PERMISSAO" });
      expect(create).not.toHaveBeenCalled();
    },
  );

  it("devolve 400 para JSON inválido", async () => {
    const response = await post("{nome:");

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ codigo: "JSON_INVALIDO" });
  });

  it("devolve 400 com os campos obrigatórios faltando", async () => {
    const create = vi.spyOn(servicoCliente, "createClient");

    const response = await post({ nome: " ", localizacao: "" });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.codigo).toBe("DADOS_INVALIDOS");
    expect(Object.keys(body.detalhes)).toEqual(
      expect.arrayContaining(["nome", "cnpj", "localizacao"]),
    );
    expect(create).not.toHaveBeenCalled();
  });

  it.each([
    ["dígito verificador errado", "11.222.333/0001-82"],
    ["tamanho errado", "1122233300018"],
    ["dígitos repetidos", "11111111111111"],
    ["caracteres inválidos", "11.222.333/0001-8a"],
  ])("devolve 400 para CNPJ com %s", async (_case, cnpj) => {
    const response = await post({ ...validBody, cnpj });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.codigo).toBe("DADOS_INVALIDOS");
    expect(body.detalhes).toHaveProperty("cnpj");
  });

  it("devolve 400 quando o CNPJ já está cadastrado", async () => {
    vi.spyOn(servicoCliente, "createClient").mockRejectedValue(
      new ErroCnpjJaCadastrado(),
    );

    const response = await post(validBody);

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      codigo: "CNPJ_JA_CADASTRADO",
      detalhes: { cnpj: ["Este CNPJ já está cadastrado."] },
    });
  });

  it("devolve 400 quando o nome já está cadastrado", async () => {
    vi.spyOn(servicoCliente, "createClient").mockRejectedValue(
      new ErroNomeClienteJaCadastrado(),
    );

    const response = await post(validBody);

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      codigo: "NOME_CLIENTE_JA_CADASTRADO",
    });
  });

  it("devolve 400 quando o banco acusa duplicidade (P2002)", async () => {
    vi.spyOn(servicoCliente, "createClient").mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint", {
        code: "P2002",
        clientVersion: "test",
      }),
    );

    const response = await post(validBody);

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ codigo: "CLIENTE_JA_CADASTRADO" });
  });

  it("devolve 500 em erro inesperado", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(servicoCliente, "createClient").mockRejectedValue(new Error("boom"));

    const response = await post(validBody);

    expect(response.status).toBe(500);
    expect(await response.json()).toMatchObject({ codigo: "ERRO_INTERNO" });
  });
});
