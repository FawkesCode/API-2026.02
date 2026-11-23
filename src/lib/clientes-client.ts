import { z } from "zod";
import { createClientSchema, updateClientSchema } from "@/schemas/client.schema";

export interface ClienteResumo {
  id: string;
  nome: string;
}

export interface Cliente extends ClienteResumo {
  cnpj: string;
  localizacao: string;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

export interface CamposCliente {
  nome: string;
  cnpj: string;
  localizacao: string;
  ativo: boolean;
}

const endpoint = "/api/clientes";

// O back normaliza pontuação; na tela só aceitamos números ou a máscara completa.
const formatoCnpj = z.string().trim().refine(
  (valor) => !valor || /^(?:\d{14}|\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})$/.test(valor),
  "Informe o CNPJ com 14 dígitos ou no formato 00.000.000/0000-00.",
).pipe(createClientSchema.shape.cnpj);

const cadastroSchema = createClientSchema.extend({ cnpj: formatoCnpj });
const edicaoSchema = updateClientSchema.safeExtend({ cnpj: formatoCnpj.optional() });

export class ErroClientesApi extends Error {
  constructor(mensagem: string, readonly detalhes?: Record<string, string[]>) {
    super(mensagem);
    this.name = "ErroClientesApi";
  }
}

async function solicitar(url: string, falha: string, opcoes?: RequestInit) {
  const resposta = await fetch(url, opcoes).catch(() => {
    throw new Error(falha);
  });
  if (!resposta.ok) {
    const corpo = await resposta.json().catch(() => null);
    throw new ErroClientesApi(
      typeof corpo?.erro === "string" ? corpo.erro : falha,
      corpo?.detalhes,
    );
  }
  return resposta;
}

async function ler<T>(url: string, falha: string, signal?: AbortSignal): Promise<T> {
  const resposta = await solicitar(url, falha, { cache: "no-store", signal });
  return resposta.json().catch(() => {
    throw new Error(falha);
  });
}

export function listarClientesParaSelecao(signal?: AbortSignal) {
  return ler<ClienteResumo[]>(endpoint, "Não foi possível carregar os clientes.", signal);
}

export function listarClientes(signal?: AbortSignal) {
  return ler<Cliente[]>(`${endpoint}/detalhado`, "Não foi possível carregar os clientes.", signal);
}

export function consultarCliente(id: string) {
  return ler<Cliente>(`${endpoint}/${encodeURIComponent(id)}`, "Não foi possível consultar o cliente.");
}

export async function salvarCliente(campos: CamposCliente, atual?: Cliente): Promise<Cliente> {
  const { nome, cnpj, localizacao, ativo } = campos;
  // Só envia alterações. Clientes legados podem ter CNPJ provisório;
  // é possível inativá-los sem reenviar o CNPJ, mas novos valores são validados.
  const dados = atual
    ? edicaoSchema.parse({
        nome: nome.trim() !== atual.nome ? nome : undefined,
        cnpj: cnpj.trim() !== atual.cnpj ? cnpj : undefined,
        localizacao: localizacao.trim() !== atual.localizacao ? localizacao : undefined,
        ativo: ativo !== atual.ativo ? ativo : undefined,
      })
    : cadastroSchema.parse({ nome, cnpj, localizacao });
  const falha = "Não foi possível salvar o cliente. Tente novamente.";
  const resposta = await solicitar(atual ? `${endpoint}/${encodeURIComponent(atual.id)}` : endpoint, falha, {
    method: atual ? "PATCH" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados),
  });
  return resposta.json().catch(() => {
    throw new Error(falha);
  });
}

export async function excluirCliente(id: string) {
  await solicitar(`${endpoint}/${encodeURIComponent(id)}`, "Não foi possível excluir o cliente.", {
    method: "DELETE",
  });
}
