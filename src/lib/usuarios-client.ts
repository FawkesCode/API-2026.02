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

export function mapearErrosCamposUsuario(
  detalhes?: Record<string, string[] | undefined>,
): CamposErroCadastroUsuario {
  if (!detalhes) return {};

  const errosCampos: CamposErroCadastroUsuario = {};

  if (detalhes.email?.[0]) {
    errosCampos.email = detalhes.email[0];
  }
  if (detalhes.nome?.[0]) {
    errosCampos.nome = detalhes.nome[0];
  }
  if (detalhes.cargo?.[0]) {
    errosCampos.tipoConta = detalhes.cargo[0];
  }
  if (detalhes.senha?.[0]) {
    errosCampos.senha = detalhes.senha[0];
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
      const usuario = (await resposta.json()) as UsuarioCriadoDTO;
      return {
        sucesso: true,
        usuario,
      };
    }

    const corpo = (await resposta.json().catch(() => null)) as {
      erro?: string;
      message?: string;
      detalhes?: Record<string, string[] | undefined>;
    } | null;

    const errosCampos = mapearErrosCamposUsuario(corpo?.detalhes);
    const erro =
      corpo?.erro ?? corpo?.message ?? MENSAGEM_ERRO_CADASTRO_USUARIO;

    return {
      sucesso: false,
      erro,
      errosCampos,
    };
  } catch {
    return {
      sucesso: false,
      erro: MENSAGEM_ERRO_CADASTRO_USUARIO,
    };
  }
}
