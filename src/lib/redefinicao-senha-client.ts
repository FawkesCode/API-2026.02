import { resetUserPasswordSchema } from "@/schemas/change-password.schema";

export type ErrosRedefinicaoSenha = {
  novaSenha?: string;
  confirmacao?: string;
};

export function validarRedefinicaoSenha(
  novaSenha: string,
  confirmacao: string,
): ErrosRedefinicaoSenha {
  const resultado = resetUserPasswordSchema.safeParse({ novaSenha });
  return {
    novaSenha: resultado.success ? undefined : resultado.error.issues[0]?.message,
    confirmacao:
      !confirmacao
        ? "Confirme a nova senha."
        : novaSenha !== confirmacao
          ? "As senhas não coincidem."
          : undefined,
  };
}

export type ResultadoRedefinicaoSenha =
  | { sucesso: true; mensagem: string }
  | { sucesso: false; erro: string; erroSenha?: string };

export async function redefinirSenhaUsuario(
  usuarioId: string,
  novaSenha: string,
  fetchFn: typeof fetch = fetch,
): Promise<ResultadoRedefinicaoSenha> {
  try {
    const resposta = await fetchFn(`/api/usuarios/${usuarioId}/senha`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ novaSenha }),
    });
    const corpo = (await resposta.json().catch(() => null)) as {
      mensagem?: string;
      erro?: string;
      detalhes?: { novaSenha?: string[] };
    } | null;

    if (resposta.ok) {
      return {
        sucesso: true,
        mensagem: corpo?.mensagem ?? "A senha foi redefinida com sucesso.",
      };
    }

    const erroSenha = corpo?.detalhes?.novaSenha?.[0];
    return {
      sucesso: false,
      erro: corpo?.erro ?? "Não foi possível redefinir a senha. Tente novamente.",
      ...(erroSenha ? { erroSenha } : {}),
    };
  } catch {
    return {
      sucesso: false,
      erro: "Falha de conexão ao redefinir a senha. Verifique sua conexão e tente novamente.",
    };
  }
}
