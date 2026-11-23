"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { consultarCliente, excluirCliente, listarClientes, type Cliente } from "@/lib/clientes-client";
import { ClienteFormDialog } from "./cliente-form-dialog";

type Listagem = { clientes: Cliente[] } | { erro: string };
type Formulario = { cliente?: Cliente };

export function ClientesView() {
  const [listagem, setListagem] = useState<Listagem | null>(null);
  const [tentativa, setTentativa] = useState(0);
  const [formulario, setFormulario] = useState<Formulario | null>(null);
  const [pendente, setPendente] = useState<string | null>(null);
  const [erroAcao, setErroAcao] = useState<string | null>(null);

  useEffect(() => {
    const controle = new AbortController();
    listarClientes(controle.signal).then(
      (clientes) => { if (!controle.signal.aborted) setListagem({ clientes }); },
      (erro: Error) => { if (!controle.signal.aborted) setListagem({ erro: erro.message }); },
    );
    return () => controle.abort();
  }, [tentativa]);

  async function abrirEdicao(cliente: Cliente) {
    setErroAcao(null);
    setPendente("Carregando dados do cliente...");
    try {
      setFormulario({ cliente: await consultarCliente(cliente.id) });
    } catch (erro) {
      setErroAcao(erro instanceof Error ? erro.message : "Não foi possível consultar o cliente.");
    } finally {
      setPendente(null);
    }
  }

  async function confirmarExclusao(cliente: Cliente) {
    if (!window.confirm(`Excluir definitivamente o cliente “${cliente.nome}”?`)) return;
    setErroAcao(null);
    setPendente("Excluindo cliente...");
    try {
      await excluirCliente(cliente.id);
      setListagem((atual) => atual && "clientes" in atual
        ? { clientes: atual.clientes.filter(({ id }) => id !== cliente.id) }
        : atual);
      toast.add({ type: "success", title: "Cliente excluído" });
    } catch (erro) {
      setErroAcao(erro instanceof Error ? erro.message : "Não foi possível excluir o cliente.");
    } finally {
      setPendente(null);
    }
  }

  function atualizarLista(cliente: Cliente) {
    setListagem((atual) => atual && "clientes" in atual
      ? {
          clientes: [...atual.clientes.filter(({ id }) => id !== cliente.id), cliente]
            .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
        }
      : atual);
    toast.add({ type: "success", title: formulario?.cliente ? "Cliente atualizado" : "Cliente cadastrado" });
    setFormulario(null);
  }

  const clientes = listagem && "clientes" in listagem ? listagem.clientes : null;

  return (
    <Card className="mb-8">
      <CardHeader className="flex flex-wrap items-center justify-between gap-3">
        <CardTitle>Clientes cadastrados</CardTitle>
        <Button disabled={!clientes || !!pendente} onClick={() => {
          setErroAcao(null);
          setFormulario({});
        }}>Cadastrar cliente</Button>
      </CardHeader>
      <CardContent>
        {!listagem && <p role="status" className="text-sm text-muted-foreground">Carregando clientes...</p>}
        {listagem && "erro" in listagem && (
          <div className="flex flex-wrap items-center gap-3">
            <p role="alert" className="text-sm text-destructive">{listagem.erro}</p>
            <Button variant="outline" onClick={() => {
              setListagem(null);
              setTentativa((valor) => valor + 1);
            }}>Tentar novamente</Button>
          </div>
        )}
        {pendente && <p role="status" className="mb-3 text-sm text-muted-foreground">{pendente}</p>}
        {erroAcao && <p role="alert" className="mb-3 text-sm text-destructive">{erroAcao}</p>}
        {clientes?.length === 0 && <p className="text-sm text-muted-foreground">Nenhum cliente cadastrado.</p>}
        {!!clientes?.length && (
          <ul aria-label="Clientes cadastrados" className="flex flex-col gap-2">
            {clientes.map((cliente) => (
              <li key={cliente.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3">
                <div className="min-w-0 break-words">
                  <p className="font-medium">{cliente.nome}</p>
                  <p className="text-sm text-muted-foreground">CNPJ: {cliente.cnpj}</p>
                  <p className="text-sm text-muted-foreground">Localização: {cliente.localizacao}</p>
                  <p className="text-sm text-muted-foreground">Situação: {cliente.ativo ? "Ativo" : "Inativo"}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" aria-label={`Editar ${cliente.nome}`} disabled={!!pendente} onClick={() => abrirEdicao(cliente)}>Editar</Button>
                  <Button variant="destructive" size="sm" aria-label={`Excluir ${cliente.nome}`} disabled={!!pendente} onClick={() => confirmarExclusao(cliente)}>Excluir</Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      {formulario && <ClienteFormDialog cliente={formulario.cliente} onClose={() => setFormulario(null)} onSaved={atualizarLista} />}
    </Card>
  );
}
