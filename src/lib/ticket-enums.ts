/**
 * Espelho dos enums do Prisma (Categoria, Prioridade, Cargo) para uso em
 * componentes client. O client gerado pelo Prisma (@/lib/generated/prisma/client)
 * não deve ser importado no navegador — arrasta runtime de servidor
 * junto e quebra o bundler (Turbopack/webpack). Os valores abaixo
 * precisam ficar idênticos aos do schema.prisma.
 */
export const Categoria = {
  MANUTENCAO: "MANUTENCAO",
  INSTALACAO: "INSTALACAO",
} as const;
export type Categoria = (typeof Categoria)[keyof typeof Categoria];

export const Prioridade = {
  BAIXA: "BAIXA",
  MEDIA: "MEDIA",
  ALTA: "ALTA",
  CRITICA: "CRITICA",
} as const;
export type Prioridade = (typeof Prioridade)[keyof typeof Prioridade];

export const Cargo = {
  TECNICO: "TECNICO",
  GESTOR: "GESTOR",
  SUPORTE: "SUPORTE",
  COMERCIAL: "COMERCIAL",
} as const;
export type Cargo = (typeof Cargo)[keyof typeof Cargo];
