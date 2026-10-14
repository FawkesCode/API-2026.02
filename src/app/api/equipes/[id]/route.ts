import { NextResponse } from "next/server";
import { z } from "zod";
import { obterSessaoDaRequisicao } from "@/auth/sessao";
import { servicoUsuario } from "@/services/usuario.service";
import {
  servicoEquipe,
  ErroEquipeSemPermissao,
  ErroEquipeNaoEncontrada,
  ErroTecnicosInvalidos,
  ErroNomeEquipeDuplicado,
} from "@/services/equipe.service";

const EMAIL_DEV = process.env.DEV_USER_EMAIL ?? "gestor@teste.com";

const corpoSchema = z.object({
  nome: z.string().trim().min(1, "Nome é obrigatório.").max(100),
  descricao: z.string().trim().max(255).nullish(),
  tecnicosIds: z.array(z.uuid()).max(200),
});

async function obterUsuarioId(req: Request) {
  const sessao = obterSessaoDaRequisicao(req);
  if (sessao) return sessao.usuarioId;
  if (process.env.NODE_ENV === "production") return null;
  const dev = await servicoUsuario.buscarPorEmail(EMAIL_DEV);
  return dev?.ativo ? dev.id : null;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const usuarioId = await obterUsuarioId(req);
  if (!usuarioId) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const corpo = corpoSchema.safeParse(json);
  if (!corpo.success) {
    return NextResponse.json(
      { erro: corpo.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  }

  try {
    const equipe = await servicoEquipe.atualizar(id, usuarioId, {
      nome: corpo.data.nome,
      descricao: corpo.data.descricao?.trim() || null,
      tecnicosIds: [...new Set(corpo.data.tecnicosIds)],
    });
    return NextResponse.json(equipe, { status: 200 });
  } catch (e) {
    if (e instanceof ErroEquipeSemPermissao)
      return NextResponse.json({ erro: e.message }, { status: 403 });
    if (e instanceof ErroEquipeNaoEncontrada)
      return NextResponse.json({ erro: e.message }, { status: 404 });
    if (e instanceof ErroTecnicosInvalidos || e instanceof ErroNomeEquipeDuplicado)
      return NextResponse.json({ erro: e.message }, { status: 409 });
    console.error(e);
    return NextResponse.json({ erro: "Erro interno ao atualizar a equipe." }, { status: 500 });
  }
}