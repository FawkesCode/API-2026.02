import { controladorUsuario } from "@/lib/controllers/usuario.controller";

export async function GET(requisicao: Request) {
  return controladorUsuario.listar(requisicao);
}