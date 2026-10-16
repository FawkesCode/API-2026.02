import { compare, hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { criarTokenDeSessao } from "@/auth/sessao";
import { obterSessaoDaRequisicao } from "@/auth/sessao";
import { servicoUsuario } from "@/services/usuario.service";
import { loginSchema } from "@/schemas/login.schema";
import { changePasswordSchema } from "@/schemas/change-password.schema";

const DURACAO_DA_SESSAO_EM_SEGUNDOS = 60 * 60 * 8;
const HASH_DUMMY = hash("senha-dummy-sem-uso", 12);

function credenciaisInvalidas() {
  return NextResponse.json(
    { erro: "Credenciais inválidas.", codigo: "CREDENCIAIS_INVALIDAS" },
    { status: 401 },
  );
}

export class ControladorAuth {
  async login(requisicao: Request) {
    let corpo: unknown;
    try {
      corpo = await requisicao.json();
    } catch {
      return NextResponse.json(
        { erro: "Corpo da requisição precisa ser um JSON válido.", codigo: "JSON_INVALIDO" },
        { status: 400 },
      );
    }

    const dados = loginSchema.safeParse(corpo);
    if (!dados.success) {
      return NextResponse.json(
        {
          erro: "Dados inválidos.",
          codigo: "DADOS_INVALIDOS",
          detalhes: z.flattenError(dados.error).fieldErrors,
        },
        { status: 400 },
      );
    }

    try {
      const usuario = await servicoUsuario.buscarCredenciaisPorEmail(dados.data.email);
      // Compara também quando o e-mail não existe, para reduzir diferenças
      // observáveis de tempo entre e-mail inexistente e senha incorreta.
      const senhaCorreta = await compare(
        dados.data.senha,
        usuario?.senhaHash ?? (await HASH_DUMMY),
      );

      if (!usuario || !usuario.ativo || !senhaCorreta) {
        return credenciaisInvalidas();
      }

      const token = criarTokenDeSessao({
        usuarioId: usuario.id,
        exp: Math.floor(Date.now() / 1000) + DURACAO_DA_SESSAO_EM_SEGUNDOS,
      });

      const resposta = NextResponse.json(
        {
          usuario: {
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email,
            cargo: usuario.cargo,
          },
          senhaProvisoria: usuario.senhaProvisoria,
        },
        { status: 200 },
      );
      resposta.cookies.set("session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: DURACAO_DA_SESSAO_EM_SEGUNDOS,
      });
      return resposta;
    } catch (erro) {
      console.error("[POST /api/auth/login] Erro ao autenticar usuário:", erro);
      return NextResponse.json(
        { erro: "Erro interno ao autenticar usuário.", codigo: "ERRO_INTERNO" },
        { status: 500 },
      );
    }
  }

  async alterarSenha(requisicao: Request) {
    const sessao = obterSessaoDaRequisicao(requisicao);
    if (!sessao) {
      return NextResponse.json(
        { erro: "Não autenticado.", codigo: "NAO_AUTENTICADO" },
        { status: 401 },
      );
    }

    let corpo: unknown;
    try {
      corpo = await requisicao.json();
    } catch {
      return NextResponse.json(
        { erro: "Corpo da requisição precisa ser um JSON válido.", codigo: "JSON_INVALIDO" },
        { status: 400 },
      );
    }

    const dados = changePasswordSchema.safeParse(corpo);
    if (!dados.success) {
      return NextResponse.json(
        {
          erro: "Dados inválidos.",
          codigo: "DADOS_INVALIDOS",
          detalhes: z.flattenError(dados.error).fieldErrors,
        },
        { status: 400 },
      );
    }

    try {
      const usuario = await servicoUsuario.buscarPorId(sessao.usuarioId);
      if (!usuario?.ativo) {
        return NextResponse.json(
          { erro: "Não autenticado.", codigo: "NAO_AUTENTICADO" },
          { status: 401 },
        );
      }

      await servicoUsuario.alterarSenha(usuario.id, dados.data.novaSenha);
      return NextResponse.json({ ok: true }, { status: 200 });
    } catch (erro) {
      console.error("[PATCH /api/auth/password] Erro ao trocar senha:", erro);
      return NextResponse.json(
        { erro: "Erro interno ao trocar senha.", codigo: "ERRO_INTERNO" },
        { status: 500 },
      );
    }
  }

  async logout() {
    const resposta = NextResponse.json({ ok: true }, { status: 200 });
    resposta.cookies.delete("session");
    return resposta;
  }
}

export const controladorAuth = new ControladorAuth();
