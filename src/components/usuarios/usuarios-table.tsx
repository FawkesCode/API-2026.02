"use client";

import { useState } from "react";
import { Check, Copy, MoreHorizontal } from "lucide-react";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import type { UsuarioListaItem } from "@/types/usuario";

// Mesmas colunas no cabeçalho e nas linhas para tudo alinhar.
const COLUNAS = "grid grid-cols-[2fr_1.3fr_1.6fr_1fr] items-center gap-2";

interface UsuariosTableProps {
  usuarios: UsuarioListaItem[];
}

export default function UsuariosTable({ usuarios }: UsuariosTableProps) {
  const [abertoId, setAbertoId] = useState<string | null>(null);

  if (usuarios.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Nenhum usuário encontrado.
      </p>
    );
  }

  return (
    <div role="table" className="w-full">
      <div role="row" className="flex items-center border-b px-2 pb-3">
        <div className={`${COLUNAS} flex-1 text-sm font-medium`}>
          <span role="columnheader">Conta</span>
          <span role="columnheader" className="text-center">Adicionado em</span>
          <span role="columnheader" className="text-center">Tipo de acesso</span>
          <span role="columnheader" className="text-center">Status</span>
        </div>
        <div className="w-8" />
      </div>

      {usuarios.map((usuario) => (
        <UsuarioRow
          key={usuario.id}
          usuario={usuario}
          aberto={abertoId === usuario.id}
          onToggle={() => setAbertoId(abertoId === usuario.id ? null : usuario.id)}
        />
      ))}
    </div>
  );
}

interface UsuarioRowProps {
  usuario: UsuarioListaItem;
  aberto: boolean;
  onToggle: () => void;
}

function UsuarioRow({ usuario, aberto, onToggle }: UsuarioRowProps) {
  const [copiado, setCopiado] = useState(false);

  async function copiarUuid() {
    try {
      await navigator.clipboard.writeText(usuario.id);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    } catch {
      // Sem permissão de clipboard: o UUID continua visível para copiar à mão.
    }
  }

  return (
    <div role="row" className="border-b last:border-b-0">
      <div className={`flex items-center px-2 ${aberto ? "bg-slate-100" : ""}`}>
        <button
          type="button"
          aria-expanded={aberto}
          onClick={onToggle}
          className={`${COLUNAS} flex-1 cursor-pointer py-3 text-left text-xs`}
        >
          <span className="flex items-center gap-2">
            <span
              aria-hidden
              className="flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white"
              style={{ backgroundColor: usuario.cor }}
            >
              {usuario.inicial}
            </span>
            <span className="truncate">{usuario.nome}</span>
          </span>
          <span className="text-center">{usuario.adicionadoEm}</span>
          <span
            className="text-center font-medium"
            style={{ color: usuario.cor }}
          >
            {usuario.cargoLabel}
          </span>
          <span className="flex justify-center">
            <span
              className={`rounded px-2 py-0.5 text-[10px] ${
                usuario.ativo
                  ? "bg-sky-200 text-sky-800"
                  : "bg-slate-200 text-slate-500"
              }`}
            >
              {usuario.ativo ? "Ativo" : "Inativo"}
            </span>
          </span>
        </button>

        <Popover>
          <PopoverTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                aria-label={`Ações para ${usuario.nome}`}
                className="size-8 p-0"
              />
            }
          >
            <MoreHorizontal className="size-4" />
          </PopoverTrigger>
          <PopoverContent align="end" className="w-40 p-1">
            <p className="px-2 py-1 text-[10px] text-muted-foreground">Ações</p>
            {/* TODO: ligar às ações de editar/inativar (fora do escopo agora). */}
            <button type="button" className="w-full rounded px-2 py-1.5 text-left text-xs hover:bg-slate-100">
              Editar usuário
            </button>
            <button type="button" className="w-full rounded px-2 py-1.5 text-left text-xs hover:bg-slate-100">
              Inativar usuário
            </button>
          </PopoverContent>
        </Popover>
      </div>

      {aberto && (
        <div className="grid grid-cols-1 gap-x-8 gap-y-2 bg-slate-100 px-6 py-4 text-xs sm:grid-cols-2">
          <p>
            <span className="text-muted-foreground">Email de contato: </span>
            {usuario.email}
          </p>
          <p className="flex items-center gap-2">
            <span className="text-muted-foreground">UUID: </span>
            <span className="font-mono">{usuario.id}</span>
            <button
              type="button"
              onClick={copiarUuid}
              aria-label="Copiar UUID"
              className="cursor-pointer text-muted-foreground hover:text-foreground"
            >
              {copiado ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            </button>
          </p>
          <p>
            <span className="text-muted-foreground">Equipe: </span>
            {usuario.equipe ?? "Sem equipe"}
          </p>
          <p>
            <span className="text-muted-foreground">Adicionado por: </span>
            {usuario.adicionadoPor ?? "—"}
          </p>
        </div>
      )}
    </div>
  );
}