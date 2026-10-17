import { afterEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@/lib/generated/prisma/client";
import { POST } from "@/app/api/usuarios/route";
import { prisma } from "@/lib/prisma";
import { getUsuarios } from "@/lib/data/usuarios";
import { parseFiltrosUsuario } from "@/schemas/usuario-filtros.schema";
import {
  cadastrarUsuario,
  mapearErrosCamposUsuario,
  MENSAGEM_ERRO_CADASTRO_USUARIO,
} from "@/lib/usuarios-client";
import {
  processarEnvioCadastroUsuario,
  tratarFalhaValidacaoSenha,
  VALORES_INICIAIS_USUARIO_FORM,
} from "@/components/usuarios/usuario-form-dialog";
import {
  OPCOES_TIPO_CONTA,
  usuarioFormSchema,
} from "@/schemas/usuario-form.schema";

const dadosFormularioValidos = {
  email: "novo.tecnico@altave.com",
  nome: "Novo Técnico",
  tipoConta: OPCOES_TIPO_CONTA[0],
  senha: "Senha@123",
  confirmarSenha: "Senha@123",
};

const fetchDiretoNoRouteHandler = ((
  input: RequestInfo | URL,
  init?: RequestInit,
) => {
  const url =
    typeof input === "string"
      ? `http://localhost${input}`
      : input instanceof URL
        ? input.toString()
        : input.url;
  return POST(new Request(url, init));
}) as typeof fetch;

afterEach(() => vi.restoreAllMocks());

describe("cadastrarUsuario e integração com UsuarioFormDialog", () => {
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

  it("trata resposta 2xx sem corpo JSON sem lançar erro", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 204 }));

    const resultado = await cadastrarUsuario(
      dadosFormularioValidos,
      fetchMock as unknown as typeof fetch,
    );

    expect(resultado).toEqual({
      sucesso: true,
      usuario: null,
    });
  });

  it("persiste o novo usuário via POST /api/usuarios, fecha o modal, exibe confirmação e atualiza a listagem", async () => {
    const criadoEm = new Date("2026-10-17T12:00:00.000Z");
    const registroPersistido = {
      id: "550e8400-e29b-41d4-a716-446655440099",
      nome: dadosFormularioValidos.nome,
      email: dadosFormularioValidos.email,
      cargo: "TECNICO" as const,
      ativo: true,
      senhaProvisoria: true,
      equipeId: null,
      criadoEm,
      atualizadoEm: criadoEm,
    };

    const createSpy = vi
      .spyOn(prisma.usuario, "create")
      .mockResolvedValue(registroPersistido as never);
    vi.spyOn(prisma.usuario, "count").mockResolvedValue(1);
    vi.spyOn(prisma.usuario, "findMany").mockResolvedValue([
      {
        id: registroPersistido.id,
        nome: registroPersistido.nome,
        email: registroPersistido.email,
        cargo: registroPersistido.cargo,
        ativo: true,
        criadoEm,
        equipe: null,
        criadoPor: null,
      },
    ] as never);

    const reset = vi.fn();
    const resetField = vi.fn();
    const setError = vi.fn();
    const setAberto = vi.fn();
    const setErroEnvio = vi.fn();
    const atualizarLista = vi.fn();
    const notificarSucesso = vi.fn();

    await processarEnvioCadastroUsuario(dadosFormularioValidos, {
      reset,
      resetField: resetField as never,
      setError: setError as never,
      setAberto,
      setErroEnvio,
      atualizarLista,
      notificarSucesso,
      enviarCadastro: (dados) =>
        cadastrarUsuario(dados, fetchDiretoNoRouteHandler),
    });

    expect(createSpy).toHaveBeenCalledTimes(1);
    expect(reset).toHaveBeenCalledWith(VALORES_INICIAIS_USUARIO_FORM);
    expect(setAberto).toHaveBeenCalledWith(false);
    expect(notificarSucesso).toHaveBeenCalledTimes(1);
    expect(atualizarLista).toHaveBeenCalledTimes(1);

    const listagemAtualizada = await getUsuarios(parseFiltrosUsuario({}));
    expect(listagemAtualizada.itens).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: registroPersistido.id,
          nome: "Novo Técnico",
          email: "novo.tecnico@altave.com",
          cargoLabel: "Técnico",
          ativo: true,
        }),
      ]),
    );
  });

  it("bloqueia o segundo cadastro com o mesmo e-mail no endpoint POST /api/usuarios e exibe o erro no campo email da tela", async () => {
    const emailsCadastrados = new Set<string>();

    vi.spyOn(prisma.usuario, "create").mockImplementation((async (args: {
      data: { email: string; nome: string; cargo: string };
    }) => {
      if (emailsCadastrados.has(args.data.email)) {
        throw new Prisma.PrismaClientKnownRequestError("Unique constraint", {
          code: "P2002",
          clientVersion: "test",
        });
      }
      emailsCadastrados.add(args.data.email);
      return {
        id: "550e8400-e29b-41d4-a716-446655440001",
        nome: args.data.nome,
        email: args.data.email,
        cargo: args.data.cargo,
        ativo: true,
        senhaProvisoria: true,
        equipeId: null,
        criadoEm: new Date(),
        atualizadoEm: new Date(),
      };
    }) as never);

    const primeiroCadastro = await cadastrarUsuario(
      dadosFormularioValidos,
      fetchDiretoNoRouteHandler,
    );
    expect(primeiroCadastro.sucesso).toBe(true);

    const setError = vi.fn();
    const setAberto = vi.fn();
    const setErroEnvio = vi.fn();

    await processarEnvioCadastroUsuario(dadosFormularioValidos, {
      reset: vi.fn(),
      resetField: vi.fn() as never,
      setError: setError as never,
      setAberto,
      setErroEnvio,
      atualizarLista: vi.fn(),
      enviarCadastro: (dados) =>
        cadastrarUsuario(dados, fetchDiretoNoRouteHandler),
    });

    expect(setError).toHaveBeenCalledWith("email", {
      type: "server",
      message: "Este e-mail já está cadastrado.",
    });
    expect(setAberto).not.toHaveBeenCalledWith(false);
    expect(setErroEnvio).toHaveBeenCalledWith(
      "Este e-mail já está cadastrado.",
    );
  });

  it("combina detalhes com errosCampos parciais sem descartar os demais campos inválidos e apaga somente a senha", async () => {
    const resetField = vi.fn();
    const setError = vi.fn();
    const setErroEnvio = vi.fn();

    await processarEnvioCadastroUsuario(dadosFormularioValidos, {
      reset: vi.fn(),
      resetField: resetField as never,
      setError: setError as never,
      setAberto: vi.fn(),
      setErroEnvio,
      atualizarLista: vi.fn(),
      enviarCadastro: async () => ({
        sucesso: false,
        erro: "Dados de cadastro inválidos.",
        errosCampos: {
          email: "E-mail já informado anteriormente.",
        },
        detalhes: {
          email: ["Erro original do detalhe de e-mail"],
          senha: ["A senha deve conter ao menos um caractere especial."],
        },
      }),
    });

    expect(setError).toHaveBeenCalledWith("email", {
      type: "server",
      message: "E-mail já informado anteriormente.",
    });
    expect(resetField).toHaveBeenCalledTimes(1);
    expect(resetField).toHaveBeenCalledWith("senha");
    expect(setError).toHaveBeenCalledWith("senha", {
      type: "server",
      message: "A senha deve conter ao menos um caractere especial.",
    });
    expect(setErroEnvio).toHaveBeenCalledWith("Dados de cadastro inválidos.");
  });

  it("apaga somente o campo de senha quando a validação de senha falha no envio ou no backend e não salva o usuário", async () => {
    const createSpy = vi.spyOn(prisma.usuario, "create");
    const resetFieldValidacaoLocal = vi.fn();

    tratarFalhaValidacaoSenha(
      {
        senha: {
          type: "custom",
          message: "A senha deve ter no mínimo 8 caracteres.",
        },
      },
      "fraca",
      resetFieldValidacaoLocal as never,
    );

    expect(resetFieldValidacaoLocal).toHaveBeenCalledTimes(1);
    expect(resetFieldValidacaoLocal).toHaveBeenCalledWith("senha", {
      keepError: true,
    });

    const resetFieldBackend = vi.fn();
    const setErrorBackend = vi.fn();

    await processarEnvioCadastroUsuario(
      {
        ...dadosFormularioValidos,
        senha: "fraca",
        confirmarSenha: "fraca",
      },
      {
        reset: vi.fn(),
        resetField: resetFieldBackend as never,
        setError: setErrorBackend as never,
        setAberto: vi.fn(),
        setErroEnvio: vi.fn(),
        atualizarLista: vi.fn(),
        enviarCadastro: (dados) =>
          cadastrarUsuario(dados, fetchDiretoNoRouteHandler),
      },
    );

    expect(createSpy).not.toHaveBeenCalled();
    expect(resetFieldBackend).toHaveBeenCalledTimes(1);
    expect(resetFieldBackend).toHaveBeenCalledWith("senha");
    expect(setErrorBackend).toHaveBeenCalledWith(
      "senha",
      expect.objectContaining({ type: "server" }),
    );
  });

  it("exige nome, email, cargo e senha e impede o cadastro quando qualquer campo obrigatório está ausente", async () => {
    const createSpy = vi.spyOn(prisma.usuario, "create");

    expect(
      usuarioFormSchema.safeParse({ ...dadosFormularioValidos, nome: "" })
        .success,
    ).toBe(false);
    expect(
      usuarioFormSchema.safeParse({ ...dadosFormularioValidos, email: "" })
        .success,
    ).toBe(false);
    expect(
      usuarioFormSchema.safeParse({
        ...dadosFormularioValidos,
        tipoConta: null,
      }).success,
    ).toBe(false);
    expect(
      usuarioFormSchema.safeParse({ ...dadosFormularioValidos, senha: "" })
        .success,
    ).toBe(false);

    const setError = vi.fn();
    await processarEnvioCadastroUsuario(
      {
        ...dadosFormularioValidos,
        nome: "",
        email: "",
      },
      {
        reset: vi.fn(),
        resetField: vi.fn() as never,
        setError: setError as never,
        setAberto: vi.fn(),
        setErroEnvio: vi.fn(),
        atualizarLista: vi.fn(),
        enviarCadastro: (dados) =>
          cadastrarUsuario(dados, fetchDiretoNoRouteHandler),
      },
    );

    expect(createSpy).not.toHaveBeenCalled();
    expect(setError).toHaveBeenCalledWith(
      "nome",
      expect.objectContaining({ type: "server" }),
    );
    expect(setError).toHaveBeenCalledWith(
      "email",
      expect.objectContaining({ type: "server" }),
    );
  });

  it("extrai erros por campo para email, nome, cargo (tipoConta) e senha", () => {
    expect(
      mapearErrosCamposUsuario({
        email: ["E-mail inválido."],
        nome: "Nome é obrigatório.",
        cargo: ["Cargo inválido."],
        senha: ["A senha deve ter no mínimo 8 caracteres."],
      }),
    ).toEqual({
      email: "E-mail inválido.",
      nome: "Nome é obrigatório.",
      tipoConta: "Cargo inválido.",
      senha: "A senha deve ter no mínimo 8 caracteres.",
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
