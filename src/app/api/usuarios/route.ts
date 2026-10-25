import { controladorUsuario } from "@/controllers/usuario.controller";

export async function GET(requisicao: Request) {
  return controladorUsuario.listar(requisicao);
}

export async function POST(requisicao: Request) {
  return controladorUsuario.createUser(requisicao);
}
