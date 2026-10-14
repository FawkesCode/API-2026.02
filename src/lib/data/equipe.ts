import { toEquipeEdicao } from "@/lib/mappers/equipe.mapper";
import { servicoEquipe } from "@/services/equipe.service";
import { servicoUsuario } from "@/services/usuario.service";

export async function getEquipeParaEdicao(equipeId: string) {
  try {
    const [equipe, tecnicos] = await Promise.all([
      servicoEquipe.buscarParaEdicao(equipeId),
      servicoUsuario.listarParaSelecao("TECNICO"),
    ]);

    if (!equipe) return null;

    return {
      equipe: toEquipeEdicao(equipe),
      tecnicosDisponiveis: tecnicos.map((u) => ({
        value: u.id,
        label: u.nome,
      })),
    };
  } catch (error) {
    console.error("[getEquipeParaEdicao] Erro ao buscar a equipe:", error);
    throw new Error("Não foi possível carregar os dados da equipe.");
  }
}