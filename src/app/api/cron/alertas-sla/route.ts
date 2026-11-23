import { timingSafeEqual } from "node:crypto";
import { processarAlertasSla } from "@/services/alerta-sla.service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const segredo = process.env.CRON_SECRET;
  if (!segredo) return Response.json({ erro: "Rotina não configurada." }, { status: 503 });

  const recebido = request.headers.get("authorization")?.replace(/^Bearer /i, "") ?? "";
  const esperadoBytes = Buffer.from(segredo);
  const recebidoBytes = Buffer.from(recebido);
  if (recebidoBytes.length !== esperadoBytes.length ||
      !timingSafeEqual(recebidoBytes, esperadoBytes)) {
    return Response.json({ erro: "Não autorizado." }, { status: 401 });
  }

  try {
    return Response.json(await processarAlertasSla());
  } catch (erro) {
    console.error("[alerta-sla] Falha ao processar rotina:", erro);
    return Response.json({ erro: "Falha ao processar alertas." }, { status: 500 });
  }
}
