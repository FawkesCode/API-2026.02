import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { podeGerenciarClientes } from "@/lib/access-control";
import {
  consultarCliente,
  excluirCliente,
  listarClientes,
  listarClientesParaSelecao,
  salvarCliente,
  type Cliente,
} from "@/lib/clientes-client";
import { Cargo } from "@/types/ticket-enums";

const cliente: Cliente = {
  id: "c992324b-3cae-4a9b-9016-464c15a90dc5",
  nome: "Cliente Teste",
  cnpj: "12345678000195",
  localizacao: "São José dos Campos",
  ativo: true,
  criadoEm: "2026-11-20T12:00:00.000Z",
  atualizadoEm: "2026-11-20T12:00:00.000Z",
};

const cadastro = { nome: cliente.nome, cnpj: cliente.cnpj, localizacao: cliente.localizacao };
const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe("integração do front com a API de clientes", () => {
  it("restringe a gestão a analistas comerciais", () => {
    for (const cargo of Object.values(Cargo)) {
      expect(podeGerenciarClientes(cargo)).toBe(cargo === Cargo.COMERCIAL);
    }
    expect(podeGerenciarClientes(null)).toBe(false);
    expect(podeGerenciarClientes(undefined)).toBe(false);
  });

  it.each([
    ["nome", "", /Nome é obrigatório/],
    ["nome", "  ", /Nome é obrigatório/],
    ["localizacao", "  ", /Localização é obrigatória/],
    ["cnpj", "  ", /CNPJ é obrigatório/],
    ["cnpj", "12.345.678/0001-96", /CNPJ inválido/],
    ["cnpj", "11.111.111/1111-11", /CNPJ inválido/],
    ["cnpj", "12.345.6780001/95", /14 dígitos ou no formato/],
    ["cnpj", "1234567800019x", /14 dígitos ou no formato/],
  ])("rejeita %s com valor %j antes de chamar a API", async (campo, valor, erro) => {
    await expect(salvarCliente({ ...cadastro, ativo: true, [campo]: valor })).rejects.toThrow(erro);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([cliente.cnpj, "12.345.678/0001-95"])("cadastra com CNPJ %s e consulta os clientes ativos sem cache", async (cnpj) => {
    const resumo = { id: cliente.id, nome: cliente.nome };
    fetchMock
      .mockResolvedValueOnce(Response.json(cliente, { status: 201 }))
      .mockResolvedValueOnce(Response.json([resumo]));

    await expect(salvarCliente({
      nome: ` ${cliente.nome} `,
      cnpj: ` ${cnpj} `,
      localizacao: ` ${cliente.localizacao} `,
      ativo: true,
    })).resolves.toEqual(cliente);
    expect(fetchMock).toHaveBeenNthCalledWith(1, "/api/clientes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cadastro),
    });
    await expect(listarClientesParaSelecao()).resolves.toEqual([resumo]);
    expect(fetchMock).toHaveBeenNthCalledWith(2, "/api/clientes", expect.objectContaining({ cache: "no-store" }));
  });

  it("carrega a lista detalhada (inclusive inativos) e consulta por ID", async () => {
    const inativo = { ...cliente, ativo: false };
    fetchMock.mockResolvedValueOnce(Response.json([inativo])).mockResolvedValueOnce(Response.json(inativo));
    await expect(listarClientes()).resolves.toEqual([inativo]);
    await expect(consultarCliente(cliente.id)).resolves.toEqual(inativo);
    expect(fetchMock).toHaveBeenNthCalledWith(1, "/api/clientes/detalhado", expect.objectContaining({ cache: "no-store" }));
    expect(fetchMock).toHaveBeenNthCalledWith(2, `/api/clientes/${cliente.id}`, expect.objectContaining({ cache: "no-store" }));
  });

  it("envia somente campos alterados, preservando um CNPJ provisório que não foi alterado", async () => {
    const legado = { ...cliente, cnpj: "abcde678000195" };
    const inativo = { ...legado, ativo: false };
    fetchMock.mockResolvedValueOnce(Response.json(inativo));
    await expect(salvarCliente(inativo, legado)).resolves.toEqual(inativo);
    expect(fetchMock).toHaveBeenCalledWith(`/api/clientes/${cliente.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ativo: false }),
    });
  });

  it("não envia PATCH vazio ou com novo CNPJ mal formatado", async () => {
    await expect(salvarCliente(cliente, cliente)).rejects.toThrow(/Informe ao menos um campo/);
    await expect(salvarCliente({ ...cliente, cnpj: "12.345.6780001/95" }, cliente)).rejects.toThrow(/14 dígitos ou no formato/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("repassa os detalhes de CNPJ duplicado", async () => {
    const erro = "Este CNPJ já está cadastrado.";
    fetchMock.mockResolvedValueOnce(Response.json({ erro, detalhes: { cnpj: [erro] } }, { status: 400 }));
    await expect(salvarCliente(cliente)).rejects.toMatchObject({ message: erro, detalhes: { cnpj: [erro] } });
  });

  it("exclui sem ler corpo de 204 e repassa bloqueio por projetos vinculados", async () => {
    const erro = "Cliente possui projetos vinculados e não pode ser excluído. Inative o cliente em vez de excluí-lo.";
    fetchMock
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(Response.json({ erro }, { status: 400 }));
    await expect(excluirCliente(cliente.id)).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith(`/api/clientes/${cliente.id}`, { method: "DELETE" });
    await expect(excluirCliente(cliente.id)).rejects.toThrow(erro);
  });

  it("não mascara a rejeição do servidor e trata indisponibilidade de rede", async () => {
    fetchMock
      .mockResolvedValueOnce(Response.json({ erro: "Acesso negado." }, { status: 403 }))
      .mockRejectedValueOnce(new TypeError("Failed to fetch"));
    await expect(listarClientes()).rejects.toThrow("Acesso negado.");
    await expect(listarClientesParaSelecao()).rejects.toThrow("Não foi possível carregar os clientes.");
  });
});
