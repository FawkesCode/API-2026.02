import { controladorUsuario } from "@/controllers/usuario.controller";

export async function GET(requisicao: Request) {
  return controladorUsuario.listar(requisicao);
}
