import "dotenv/config";
import { processarAlertasSla } from "../services/alerta-sla.service";

let emExecucao = false;
async function executar() {
  if (emExecucao) return;
  emExecucao = true;
  try {
    console.info("[alerta-sla]", await processarAlertasSla());
  } catch (erro) {
    console.error("[alerta-sla] Erro na rotina:", erro);
  } finally {
    emExecucao = false;
  }
}

void executar();
setInterval(() => void executar(), 5 * 60 * 1000);
