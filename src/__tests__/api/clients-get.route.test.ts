import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET as getClientById } from "@/app/api/clientes/[id]/route";
import { GET as listDetailed } from "@/app/api/clientes/detalhado/route";
import { GET as listForSelect } from "@/app/api/clientes/route";
import { criarTokenDeSessao } from "@/auth/sessao";
import { servicoCliente } from "@/services/cliente.service";
import { servicoUsuario } from "@/services/usuario.service";

process.env.SESSION_SECRET = "segredo-de-teste-com-32-caracteres";

const comercialId = "550e8400-e29b-41d4-a716-446655440005";
const clientId = "550e8400-e29b-41d4-a716-446655440100";
const client = {
  id: clientId,
  nome: "Acme Ltda",
  cnpj: "11222333000181",
  localizacao: "São Paulo - SP",
  ativo: true,
  criadoEm: new Date("2026-01-01T00:00:00.000Z"),
  atualizadoEm: new Date("2026-01-01T00:00:00.000Z"),
};
const inactiveClient = {
  ...client,
  id: "550e8400-e29b-41d4-a716-446655440101",
  nome: "Beta S.A.",
  cnpj: "45016372000144",
  ativo: false,
};

type Cargo = "COMERCIAL" | "SUPORTE_INTERNO" | "GESTOR" | "TECNICO";

function request(url: string, options?: { authenticated?: boolean }) {
  const token = criarTokenDeSessao({
    usuarioId: comercialId,
    exp: Math.floor(Date.now() / 1000) + 60,
  });
  return new Request(url, {
    headers:
      options?.authenticated === false ? {} : { authorization: `Bearer ${token}` },
  });
}

function getById(id: string, options?: { authenticated?: boolean }) {
  return getClientById(request(`http://localhost/api/clientes/${id}`, options), {
    params: Promise.resolve({ id }),
  });
}

function getDetailed(options?: { authenticated?: boolean }) {
  return listDetailed(request("http://localhost/api/clientes/detalhado", options));
}

function mockSession(cargo: Cargo = "COMERCIAL") {
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

describe("GET /api/clientes/detalhado", () => {
  it("lista ativos e inativos com todos os campos", async () => {
    vi.spyOn(servicoCliente, "listDetailed").mockResolvedValue([
      client,
      inactiveClient,
    ] as never);

    const response = await getDetailed();

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveLength(2);
    expect(body[0]).toMatchObject({
      id: clientId,
      cnpj: "11222333000181",
      localizacao: "São Paulo - SP",
      ativo: true,
    });
    expect(body[1]).toMatchObject({ ativo: false });
  });

  it("devolve lista vazia quando não há clientes", async () => {
    vi.spyOn(servicoCliente, "listDetailed").mockResolvedValue([]);

    const response = await getDetailed();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([]);
  });

  it("devolve 401 sem sessão", async () => {
    const response = await getDetailed({ authenticated: false });

    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ codigo: "NAO_AUTENTICADO" });
  });

  it.each(["SUPORTE_INTERNO", "GESTOR", "TECNICO"] as const)(
    "devolve 403 para o cargo %s",
    async (cargo) => {
      mockSession(cargo);
      const list = vi.spyOn(servicoCliente, "listDetailed");

      const response = await getDetailed();

      expect(response.status).toBe(403);
      expect(await response.json()).toMatchObject({ codigo: "SEM_PERMISSAO" });
      expect(list).not.toHaveBeenCalled();
    },
  );

  it("devolve 500 em erro inesperado", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(servicoCliente, "listDetailed").mockRejectedValue(new Error("boom"));

    const response = await getDetailed();

    expect(response.status).toBe(500);
    expect(await response.json()).toMatchObject({ codigo: "ERRO_INTERNO" });
  });
});

describe("GET /api/clientes/:id", () => {
  it("devolve o cliente com todos os campos", async () => {
    const find = vi
      .spyOn(servicoCliente, "getClientById")
      .mockResolvedValue(client as never);

    const response = await getById(clientId);

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      id: clientId,
      nome: "Acme Ltda",
      cnpj: "11222333000181",
      localizacao: "São Paulo - SP",
    });
    expect(find).toHaveBeenCalledWith(clientId);
  });

  it("devolve cliente inativo também", async () => {
    vi.spyOn(servicoCliente, "getClientById").mockResolvedValue(
      inactiveClient as never,
    );

    const response = await getById(inactiveClient.id);

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ativo: false });
  });

  it("devolve 404 quando o cliente não existe", async () => {
    vi.spyOn(servicoCliente, "getClientById").mockResolvedValue(null);

    const response = await getById(clientId);

    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({
      codigo: "CLIENTE_NAO_ENCONTRADO",
    });
  });

  it("devolve 400 para id que não é UUID, sem consultar o banco", async () => {
    const find = vi.spyOn(servicoCliente, "getClientById");

    const response = await getById("abc");

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ codigo: "ID_INVALIDO" });
    expect(find).not.toHaveBeenCalled();
  });

  it("devolve 401 sem sessão", async () => {
    const response = await getById(clientId, { authenticated: false });

    expect(response.status).toBe(401);
  });

  it("devolve 403 para cargo diferente de COMERCIAL", async () => {
    mockSession("GESTOR");
    const find = vi.spyOn(servicoCliente, "getClientById");

    const response = await getById(clientId);

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ codigo: "SEM_PERMISSAO" });
    expect(find).not.toHaveBeenCalled();
  });

  it("devolve 500 em erro inesperado", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(servicoCliente, "getClientById").mockRejectedValue(new Error("boom"));

    const response = await getById(clientId);

    expect(response.status).toBe(500);
    expect(await response.json()).toMatchObject({ codigo: "ERRO_INTERNO" });
  });
});

describe("GET /api/clientes (seleção)", () => {
  it("continua liberado para qualquer cargo logado, só com id e nome", async () => {
    mockSession("GESTOR");
    vi.spyOn(servicoCliente, "listarParaSelecao").mockResolvedValue([
      { id: clientId, nome: "Acme Ltda" },
    ]);

    const response = await listForSelect(request("http://localhost/api/clientes"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([{ id: clientId, nome: "Acme Ltda" }]);
  });
});
