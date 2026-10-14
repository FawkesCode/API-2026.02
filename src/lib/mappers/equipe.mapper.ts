import type { EquipeComUsuariosDTO, EquipeEdicao } from "@/types/equipe";

export function toEquipeEdicao(dto: EquipeComUsuariosDTO): EquipeEdicao {
  const responsaveis = dto.usuarios
    .filter((u) => u.cargo === "GESTOR")
    .map((u) => u.nome);

  return {
    id: dto.id,
    nome: dto.nome,
    descricao: dto.descricao ?? "",
    responsavel: responsaveis.join(", ") || "Sem responsável",
    tecnicos: dto.usuarios
      .filter((u) => u.cargo === "TECNICO")
      .map((u) => ({ value: u.id, label: u.nome })),
  };
}