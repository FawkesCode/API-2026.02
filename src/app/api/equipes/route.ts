import { controladorEquipe } from "@/controllers/equipe.controller";

export async function GET() {
  return controladorEquipe.listar();
}
