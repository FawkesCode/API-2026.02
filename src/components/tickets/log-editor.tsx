"use client";

import { useState } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import { TextStyle, FontFamily } from "@tiptap/extension-text-style";
import {
  AlignLeft,
  Bold,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  RemoveFormatting,
  Underline,
} from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface LogEditorProps {
  onEnviar?: (log: {
    titulo: string;
    conteudo: string;
  }) => Promise<void> | void;
  className?: string;
}

interface ErrosLog {
  titulo?: string;
  conteudo?: string;
}

const TAMANHO_MAXIMO_TITULO = 50;

function validarLog(titulo: string, editor: Editor): ErrosLog {
  const erros: ErrosLog = {};

  if (titulo.length === 0) {
    erros.titulo = "Informe o título do log.";
  } else if (titulo.length > TAMANHO_MAXIMO_TITULO) {
    erros.titulo = `Máximo de ${TAMANHO_MAXIMO_TITULO} caracteres.`;
  }

  if (editor.getText().trim().length === 0) {
    erros.conteudo = "Descreva a atividade realizada no ticket.";
  }

  return erros;
}

function LogEditor({ onEnviar, className }: LogEditorProps) {
  const [titulo, setTitulo] = useState("");
  const [erros, setErros] = useState<ErrosLog>({});
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      FontFamily,
      Image,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    editorProps: {
      attributes: {
        class: "min-h-32 w-full px-3 py-2 outline-none",
      },
    },
    onUpdate: () =>
      setErros((anteriores) =>
        anteriores.conteudo
          ? { ...anteriores, conteudo: undefined }
          : anteriores,
      ),
  });

  async function enviar() {
    if (!editor) return;

    const tituloLimpo = titulo.trim();
    const errosValidacao = validarLog(tituloLimpo, editor);

    setErros(errosValidacao);
    setErroEnvio(null);

    if (errosValidacao.titulo || errosValidacao.conteudo) return;

    setEnviando(true);

    try {
      await onEnviar?.({ titulo: tituloLimpo, conteudo: editor.getHTML() });
      setTitulo("");
      editor.commands.clearContent();
    } catch (erro) {
      setErroEnvio(
        erro instanceof Error
          ? erro.message
          : "Não foi possível enviar o log. Tente novamente.",
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className={cn("flex flex-col gap-3  ", className)}>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-3">
          <label
            className="text-sm text-foreground font-medium min-w-max"
            htmlFor="log-titulo"
          >
            Título:
          </label>
          <Input
            id="log-titulo"
            value={titulo}
            aria-invalid={!!erros.titulo}
            aria-describedby={erros.titulo ? "log-titulo-error" : undefined}
            aria-required
            className="w-auto border-0 border-b rounded-b-none text-xs!  border-b-muted shadow-none"
            onChange={(event) => {
              setTitulo(event.target.value);
              setErros((anteriores) =>
                anteriores.titulo
                  ? { ...anteriores, titulo: undefined }
                  : anteriores,
              );
            }}
            placeholder="Digite o título do log..."
          />
        </div>
        {erros.titulo && (
          <p
            id="log-titulo-error"
            role="alert"
            className="text-xs font-medium text-destructive"
          >
            {erros.titulo}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <div
          className={cn(
            "rounded-xl border border-gray-200 bg-white",
            erros.conteudo && "border-destructive",
          )}
        >
          {editor ? <Toolbar editor={editor} /> : null}
          <EditorContent editor={editor} className="xl:min-h-16 xl:max-h-20" />
        </div>
        {erros.conteudo && (
          <p role="alert" className="text-xs font-medium text-destructive">
            {erros.conteudo}
          </p>
        )}
      </div>

      <div className="flex items-center justify-end gap-3 z-10">
        {erroEnvio && (
          <p
            role="alert"
            className="mr-auto text-sm font-medium text-destructive"
          >
            {erroEnvio}
          </p>
        )}
        <Button
          type="button"
          onClick={enviar}
          disabled={!editor || enviando}
          className="bg-cyan-400 text-white hover:bg-cyan-500 cursor-pointer"
        >
          {enviando ? "Enviando..." : "Enviar"}
        </Button>
      </div>
    </div>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const blocoAtivo = editor.isActive("heading", { level: 1 })
    ? "h1"
    : editor.isActive("heading", { level: 2 })
      ? "h2"
      : "p";

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 px-2 py-1">
      <select
        aria-label="Estilo do texto"
        value={blocoAtivo}
        onChange={(event) => {
          const valor = event.target.value;
          if (valor === "p") editor.chain().focus().setParagraph().run();
          else if (valor === "h1")
            editor.chain().focus().setHeading({ level: 1 }).run();
          else editor.chain().focus().setHeading({ level: 2 }).run();
        }}
        className="rounded px-1 py-0.5 text-sm text-muted-foreground"
      >
        <option value="p">Normal</option>
        <option value="h1">Título 1</option>
        <option value="h2">Título 2</option>
      </select>

      <select
        aria-label="Fonte"
        value={editor.getAttributes("textStyle").fontFamily ?? ""}
        onChange={(event) => {
          const fonte = event.target.value;
          if (fonte) editor.chain().focus().setFontFamily(fonte).run();
          else editor.chain().focus().unsetFontFamily().run();
        }}
        className="rounded px-1 py-0.5 text-sm text-muted-foreground"
      >
        <option value="">Sans Serif</option>
        <option value="serif">Serif</option>
        <option value="monospace">Monospace</option>
      </select>

      <ToolbarButton
        label="Negrito"
        ativo={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        label="Itálico"
        ativo={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        label="Sublinhado"
        ativo={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <Underline className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        label="Lista numerada"
        ativo={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        label="Lista com marcadores"
        ativo={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        label="Centralizar"
        ativo={editor.isActive({ textAlign: "center" })}
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
      >
        <AlignLeft className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        label="Link"
        ativo={editor.isActive("link")}
        onClick={() => {
          const url = window.prompt("URL do link:");
          if (url) editor.chain().focus().setLink({ href: url }).run();
          else editor.chain().focus().unsetLink().run();
        }}
      >
        <LinkIcon className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        label="Imagem"
        onClick={() => {
          const url = window.prompt("URL da imagem:");
          if (url) editor.chain().focus().setImage({ src: url }).run();
        }}
      >
        <ImageIcon className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        label="Limpar formatação"
        onClick={() =>
          editor.chain().focus().clearNodes().unsetAllMarks().run()
        }
      >
        <RemoveFormatting className="h-4 w-4" />
      </ToolbarButton>
    </div>
  );
}

function ToolbarButton({
  label,
  ativo,
  children,
  ...props
}: React.ComponentProps<"button"> & { label: string; ativo?: boolean }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={ativo}
      className={cn(
        "rounded p-1.5 text-muted-foreground transition-colors hover:bg-gray-100",
        ativo && "bg-gray-200 text-foreground",
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export { LogEditor };
