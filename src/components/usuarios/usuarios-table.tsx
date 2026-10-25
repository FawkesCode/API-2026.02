"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import type { UsuarioListaItem } from "@/types/usuario";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";

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
        <div className={`${COLUNAS} flex-1 text-sm  font-medium`}>
          <span role="columnheader" className="text-gray-400">
            Conta
          </span>
          <span role="columnheader" className="text-center text-gray-400">
            Adicionado em
          </span>
          <span role="columnheader" className="text-center text-gray-400">
            Tipo de acesso
          </span>
          <span role="columnheader" className="text-center text-gray-400">
            Status
          </span>
        </div>
        <div className="w-8" />
      </div>

      <Accordion>
        {usuarios.map((usuario) => (
          <UsuarioRow
            key={usuario.id}
            usuario={usuario}
            aberto={abertoId === usuario.id}
            onToggle={() =>
              setAbertoId(abertoId === usuario.id ? null : usuario.id)
            }
          />
        ))}
      </Accordion>
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
    <AccordionItem role="row" className="border-b last:border-b-0">
      <AccordionTrigger
        className={`flex items-center px-4 pt-1 pb-1 hover:no-underline ${aberto ? "bg-slate-100 rounded-t-xl" : ""}`}
      >
        <div
          className={`${COLUNAS} flex-1 cursor-pointer py-3 text-left text-sm`}
        >
          <span className="flex items-center gap-2">
            <span
              aria-hidden
              className="flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white"
              style={{ backgroundColor: usuario.cor }}
            >
              {usuario.inicial}
            </span>
            <span className={`truncate ${aberto && "text-gray-400"}`}>
              {usuario.nome}
            </span>
          </span>
          <span className={`text-center ${aberto && "text-gray-400"}`}>
            {usuario.adicionadoEm}
          </span>
          <span
            className="text-center font-medium"
            style={{ color: usuario.cor }}
          >
            {usuario.cargoLabel}
          </span>
          <span className="flex justify-center">
            <span
              className={`rounded px-3 py- text-xs font-bold ${
                usuario.ativo
                  ? "bg-sky-200 text-accent"
                  : "bg-slate-200 text-slate-500"
              }`}
            >
              {usuario.ativo ? "Ativo" : "Inativo"}
            </span>
          </span>
        </div>
      </AccordionTrigger>

      <AccordionContent>
        <div>
          <div className="border border-muted"></div>
          <div className="grid grid-cols-1 gap-x-8 gap-y-2 rounded-b-xl border-0  bg-slate-100 py-6 px-4 text-sm sm:grid-cols-2">
            <p className="text-gray-400  font-medium">
              <span className="text-gray-300">Email de contato: </span>
              {usuario.email}
            </p>
            <p className="flex items-center gap-2 text-gray-400  font-medium">
              <span className="text-gray-300">UUID: </span>
              <span className="font-medium">{usuario.id}</span>
              <button
                type="button"
                onClick={copiarUuid}
                aria-label="Copiar UUID"
                className="cursor-pointer text-gray-300 font-medium hover:text-foreground"
              >
                {copiado ? (
                  <Check className="size-3.5" />
                ) : (
                  <Copy className="size-3.5" />
                )}
              </button>
            </p>
            <p className="text-gray-400  font-medium">
              <span className="text-gray-300">Equipe: </span>
              {usuario.equipe ?? "Sem equipe"}
            </p>
            <p className="text-gray-400  font-medium">
              <span className="text-gray-300">Adicionado por: </span>
              {usuario.adicionadoPor ?? "Sistema"}
            </p>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
