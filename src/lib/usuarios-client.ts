import type { UsuarioFormValues } from "@/schemas/usuario-form.schema";
import type {
  CamposErroCadastroUsuario,
  CriarUsuarioPayload,
  CriarUsuarioResultado,
  UsuarioCriadoDTO,
} from "@/types/usuario";

const URL_USUARIOS = "/api/usuarios";

export const MENSAGEM_ERRO_CADASTRO_USUARIO =
  "Não foi possível cadastrar o usuário. Tente novamente.";

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
 * Função assíncrona no lado do cliente que envia os dados do formulário
 * para a rota `POST /api/usuarios` e normaliza o resultado para a UI.
 */
export async function cadastrarUsuario(
  dados: UsuarioFormValues,
  fetchFn: typeof fetch = fetch,
): Promise<CriarUsuarioResultado> {
  const payload = toCriarUsuarioPayload(dados);

  try {
    const resposta = await fetchFn(URL_USUARIOS, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

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
      detalhes?: Record<string, unknown>;
    } | null;

    const errosCampos = mapearErrosCamposUsuario(corpo?.detalhes);
    const erro =
      corpo?.erro ?? corpo?.message ?? MENSAGEM_ERRO_CADASTRO_USUARIO;

    return {
      sucesso: false,
      erro,
      errosCampos,
      ...(corpo?.detalhes ? { detalhes: corpo.detalhes } : {}),
    };
  } catch {
    return {
      sucesso: false,
      erro: MENSAGEM_ERRO_CADASTRO_USUARIO,
    };
  }
}
