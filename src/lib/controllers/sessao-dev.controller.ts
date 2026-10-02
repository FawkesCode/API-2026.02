import { NextResponse } from "next/server";
import { z } from "zod";
import { criarTokenDeSessao } from "@/lib/auth/sessao";
import { servicoUsuario } from "@/lib/services/usuario.service";

/**
 * TEMPORÁRIO — emissor de sessão para desenvolvimento.
 *
 * O projeto já valida sessões assinadas (`lib/auth/sessao.ts`), mas ainda não
 * existe nenhum fluxo que *emita* o cookie — por isso o editor de prioridade
 * nunca aparece e o `PUT /api/tickets/[id]` responde 401 para todo mundo.
 *
 * Esta rota preenche só essa lacuna: ela cria um cookie de sessão legítimo,
 * assinado com o mesmo `SESSION_SECRET` e verificado pelo mesmo código de
 * sempre. Nenhuma checagem de autenticação foi afrouxada — quem não tiver
 * cookie continua recebendo 401.
 *
 * Não há interface — chame a rota no console do navegador:
 *
 *   await fetch("/api/dev/sessao", { method: "POST" })       // gestor do seed
 *   await fetch("/api/dev/sessao", {                         // gestor específico
 *     method: "POST",
 *     headers: { "Content-Type": "application/json" },
 *     body: JSON.stringify({ usuarioId: "<uuid>" }),
 *   })
 *   await fetch("/api/dev/sessao", { method: "DELETE" })     // sair
 *
 * Atenção: só o gestor da equipe do projeto do ticket pode alterar a
 * prioridade, então entrar com o gestor errado devolve 403 — e isso está
 * correto.
 *
 * Quando o login real entrar (próxima sprint), apague este arquivo, a rota
 * `app/api/dev/sessao/`. O
 * `lib/auth/sessao.ts` e as regras de autorização não precisam mudar.
 */

const DURACAO_DA_SESSAO_EM_SEGUNDOS = 60 * 60 * 8;

const entrarSchema = z.object({
  usuarioId: z.uuid("usuarioId deve ser um UUID válido.").optional(),
});

function ambienteDeDesenvolvimento() {
  return process.env.NODE_ENV !== "production" && process.env.production !== "true";
}

function bloqueadoEmProducao() {
  return NextResponse.json(
    { erro: "Rota disponível apenas em ambiente de desenvolvimento." },
    { status: 404 },
  );
}

export class ControladorSessaoDev {
  async entrar(requisicao: Request) {
    if (!ambienteDeDesenvolvimento()) return bloqueadoEmProducao();

    if (!process.env.SESSION_SECRET) {
      return NextResponse.json(
        { erro: "SESSION_SECRET não está configurada. Veja o .env.example." },
        { status: 500 },
      );
    }

    const corpo = await requisicao.json().catch(() => ({}));
    const resultado = entrarSchema.safeParse(corpo ?? {});
    if (!resultado.success) {
      return NextResponse.json(
        { erro: "Dados inválidos.", detalhes: z.flattenError(resultado.error).fieldErrors },
        { status: 400 },
      );
    }

    try {
      // Sem `usuarioId` explícito, usa o gestor da estratégia atual de seed.
      const usuario = resultado.data.usuarioId
        ? await servicoUsuario.buscarPorId(resultado.data.usuarioId)
        : await servicoUsuario.buscarPorEmail("gestor.seed@example.com");

      if (!usuario?.ativo) {
        return NextResponse.json(
          { erro: "Usuário não encontrado. Rode o seed ou informe um usuarioId válido." },
          { status: 404 },
        );
      }

      const token = criarTokenDeSessao({
        usuarioId: usuario.id,
        exp: Math.floor(Date.now() / 1000) + DURACAO_DA_SESSAO_EM_SEGUNDOS,
      });

      const resposta = NextResponse.json(
        { id: usuario.id, nome: usuario.nome, cargo: usuario.cargo },
        { status: 200 },
      );
      resposta.cookies.set("session", token, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: DURACAO_DA_SESSAO_EM_SEGUNDOS,
      });
      return resposta;
    } catch (erro) {
      console.error(erro);
      return NextResponse.json({ erro: "Erro interno ao criar a sessão." }, { status: 500 });
    }
  }

  async sair(_requisicao: Request) {
    if (!ambienteDeDesenvolvimento()) return bloqueadoEmProducao();

    const resposta = NextResponse.json({ ok: true }, { status: 200 });
    resposta.cookies.delete("session");
    return resposta;
  }
}

export const controladorSessaoDev = new ControladorSessaoDev();
