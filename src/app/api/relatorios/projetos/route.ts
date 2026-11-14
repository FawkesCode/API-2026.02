import { exigirCargo } from "@/auth/exigir-cargo";
import { Cargo } from "@/lib/generated/prisma/client";
import { createConnection } from "mariadb";
import { NextResponse } from "next/server";

type ProjetoResumo = {
  projeto_id: string;
  projeto: string;
  cliente: string;
  equipe: string;
  gestor: string;
  total_tickets: number;
  tickets_abertos: number;
  tickets_atrasados: number;
};

/**
 * Retorna um resumo de tickets por projeto por meio da procedure da avaliação.
 * Gestores recebem apenas dados da própria equipe; suporte interno pode ver todas.
 */
export async function GET(requisicao: Request) {
  const acesso = await exigirCargo(
    requisicao,
    Cargo.GESTOR,
    Cargo.SUPORTE_INTERNO,
  );
  if (!acesso.autorizado) return acesso.resposta;

  if (acesso.usuario.cargo === Cargo.GESTOR && !acesso.usuario.equipeId) {
    return NextResponse.json(
      { erro: "Gestor sem equipe não pode consultar o relatório." },
      { status: 403 },
    );
  }

  const equipeId =
    acesso.usuario.cargo === Cargo.GESTOR ? acesso.usuario.equipeId : null;

  let conexao: Awaited<ReturnType<typeof createConnection>> | undefined;
  try {
    conexao = await createConnection({
      host: process.env.MYSQL_HOST,
      port: Number(process.env.MYSQL_PORT),
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      allowPublicKeyRetrieval: true,
    });

    const resultado = await conexao.query(
      "CALL bdr_av3.sp_resumo_projetos(?)",
      [equipeId],
    );
    const projetos = (
      Array.isArray(resultado[0]) ? resultado[0] : []
    ) as ProjetoResumo[];

    return NextResponse.json({ projetos }, { status: 200 });
  } catch (erro) {
    console.error("[GET /api/relatorios/projetos] Falha ao consultar procedure:", erro);
    return NextResponse.json(
      {
        erro: "Não foi possível gerar o relatório. Confira se as rotinas SQL da avaliação foram instaladas no banco conectado à API.",
      },
      { status: 500 },
    );
  } finally {
    await conexao?.end();
  }
}
