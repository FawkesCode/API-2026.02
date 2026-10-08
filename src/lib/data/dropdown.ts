import { servicoCliente } from "../services/cliente.service";
import { servicoUsuario } from "../services/usuario.service";

export interface SelectInterface {
  label: string;
  value: string;
}

export async function getClients() {
  let data;

  try {
    data = await servicoCliente.listarParaSelecao();
  } catch (error) {
    console.error(`[getClients] Erro ao listar os clientes: ${error}`);
    throw new Error("Não foi possível carregar a lista de clientes.");
  }

  if (!data) return [];

  return data.map((d) => ({
    label: d.nome,
    value: d.id,
  }));
}

export async function getUsers() {
  let data;

  try {
    data = await servicoUsuario.listarParaSelecao("GESTOR");
  } catch (error) {
    console.error(`[getClients] Erro ao listar os gestores: ${error}`);
    throw new Error("Não foi possível carregar a lista de gestores.");
  }

  if (!data) return [];

  return data.map((d) => ({
    label: d.nome,
    value: d.id,
  }));
}
