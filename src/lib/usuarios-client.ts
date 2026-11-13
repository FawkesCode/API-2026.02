import type { UsuarioFormValues } from "@/schemas/usuario-form.schema";
import type {
  AtualizarUsuarioPayload,
  AtualizarUsuarioResultado,
  CamposErroCadastroUsuario,
  CriarUsuarioPayload,
  CriarUsuarioResultado,
  UsuarioCriadoDTO,
} from "@/types/usuario";

export const ENDPOINT_USUARIOS = "/api/usuarios";

export const MENSAGEM_ERRO_CADASTRO_USUARIO =
  "Não foi possível cadastrar o usuário. Tente novamente.";

export const MENSAGEM_ERRO_EDICAO_USUARIO =
  "Não foi possível atualizar o usuário. Tente novamente.";

export function toCriarUsuarioPayload(
  dados: UsuarioFormValues,
): CriarUsuarioPayload {
  return {
    nome: dados.nome.trim(),
    email: dados.email.trim(),
    cargo: dados.tipoConta.value,
    senha: dados.senha,
  };
}

export function toAtualizarUsuarioPayload(
  dados: UsuarioFormValues,
): AtualizarUsuarioPayload {
  return {
    nome: dados.nome.trim(),
    email: dados.email.trim(),
    cargo: dados.tipoConta.value,
  };
}

function extrairMensagemCampo(valor: unknown): string | undefined {
  if (typeof valor === "string" && valor.trim().length > 0) {
    return valor;
  }
  if (
    Array.isArray(valor) &&
    typeof valor[0] === "string" &&
    valor[0].trim().length > 0
  ) {
    return valor[0];
  }
  return undefined;
}

export function mapearErrosCamposUsuario(
  detalhes?: Record<string, unknown>,
): CamposErroCadastroUsuario {
  if (!detalhes || typeof detalhes !== "object") return {};

  const errosCampos: CamposErroCadastroUsuario = {};

  const erroEmail = extrairMensagemCampo(detalhes.email);
  const erroNome = extrairMensagemCampo(detalhes.nome);
  const erroCargo = extrairMensagemCampo(detalhes.cargo);
  const erroSenha = extrairMensagemCampo(detalhes.senha);

  if (erroEmail) {
    errosCampos.email = erroEmail;
  }
  if (erroNome) {
    errosCampos.nome = erroNome;
  }
  if (erroCargo) {
    errosCampos.tipoConta = erroCargo;
  }
  if (erroSenha) {
    errosCampos.senha = erroSenha;
  }

  return errosCampos;
}

/**
 * Envia o JSON ao endpoint e normaliza a resposta (sucesso ou erro).
 * Compartilhado entre cadastro (POST) e edição (PUT).
 */
async function enviarUsuario(
  url: string,
  method: "POST" | "PUT",
  payload: CriarUsuarioPayload | AtualizarUsuarioPayload,
  mensagemErroPadrao: string,
  fetchFn: typeof fetch,
): Promise<CriarUsuarioResultado> {
  const initRequisicao: RequestInit = {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  };

  try {
    const resposta = await fetchFn(url, initRequisicao);

    if (resposta.ok) {
      const usuario = (await resposta
        .json()
        .catch(() => null)) as UsuarioCriadoDTO | null;
      return {
        sucesso: true,
        usuario,
      };
    }

    const corpo = (await resposta.json().catch(() => null)) as {
      erro?: string;
      message?: string;
      codigo?: string;
      detalhes?: Record<string, unknown>;
    } | null;

    const detalhes =
      corpo?.detalhes && typeof corpo.detalhes === "object"
        ? corpo.detalhes
        : undefined;
    const errosCampos = mapearErrosCamposUsuario(detalhes);
    const erro = corpo?.erro ?? corpo?.message ?? mensagemErroPadrao;

    return {
      sucesso: false,
      erro,
      ...(corpo?.codigo ? { codigo: corpo.codigo } : {}),
      errosCampos,
      ...(detalhes ? { detalhes } : {}),
    };
  } catch {
    return {
      sucesso: false,
      erro: mensagemErroPadrao,
    };
  }
}

/**
 * Função assíncrona client-side que realiza o envio dos dados do formulário
 * via `fetch` para o endpoint `POST /api/usuarios` e normaliza a resposta.
 */
export function cadastrarUsuario(
  dados: UsuarioFormValues,
  fetchFn: typeof fetch = fetch,
): Promise<CriarUsuarioResultado> {
  return enviarUsuario(
    ENDPOINT_USUARIOS,
    "POST",
    toCriarUsuarioPayload(dados),
    MENSAGEM_ERRO_CADASTRO_USUARIO,
    fetchFn,
  );
}

/**
 * Envia a edição para `PUT /api/usuarios/[id]` (nome, e-mail e cargo)
 * e normaliza a resposta.
 */
export function atualizarUsuario(
  id: string,
  dados: UsuarioFormValues,
  fetchFn: typeof fetch = fetch,
): Promise<AtualizarUsuarioResultado> {
  return enviarUsuario(
    `${ENDPOINT_USUARIOS}/${id}`,
    "PUT",
    toAtualizarUsuarioPayload(dados),
    MENSAGEM_ERRO_EDICAO_USUARIO,
    fetchFn,
  );
}