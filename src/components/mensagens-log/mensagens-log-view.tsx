"use client";

import { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { FormTextarea } from "@/components/form/form-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import {
  cadastrarMensagemLog,
  listarMensagensLog,
  type MensagemPadraoLog,
} from "@/lib/mensagens-log-client";
import {
  criarMensagemPadraoLogSchema,
  type CriarMensagemPadraoLogSchema,
} from "@/schemas/mensagem-padrao-log.schema";

export function MensagensLogView() {
  const [mensagens, setMensagens] = useState<MensagemPadraoLog[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erroLista, setErroLista] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CriarMensagemPadraoLogSchema>({
    defaultValues: { mensagem: "" },
    resolver: zodResolver(criarMensagemPadraoLogSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  useEffect(() => {
    let ativo = true;
    listarMensagensLog()
      .then((lista) => ativo && setMensagens(lista))
      .catch((erro: Error) => ativo && setErroLista(erro.message))
      .finally(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
  }, []);

  const onSubmit: SubmitHandler<CriarMensagemPadraoLogSchema> = async ({ mensagem }) => {
    try {
      const criada = await cadastrarMensagemLog(mensagem);
      setMensagens((atuais) => [criada, ...atuais]);
      reset();
      toast.add({
        type: "success",
        title: "Mensagem cadastrada",
        description: "A mensagem padrão já pode ser usada nos logs.",
      });
    } catch (erro) {
      setError("mensagem", { message: (erro as Error).message });
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-10">
      <Card>
        <CardHeader>
          <CardTitle>Nova mensagem padrão</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            noValidate
            className="flex flex-col gap-4"
            onSubmit={handleSubmit(onSubmit)}
          >
            <FormTextarea
              label="Mensagem"
              id="mensagem"
              required
              rows={3}
              placeholder="Ex.: Equipe a caminho do local da instalação."
              disabled={isSubmitting}
              {...register("mensagem")}
              error={errors.mensagem?.message}
            />
            <Button
              type="submit"
              disabled={isSubmitting}
              className="self-end rounded-full px-6 cursor-pointer"
            >
              {isSubmitting ? "Salvando..." : "Adicionar mensagem"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Minhas mensagens padrão</CardTitle>
        </CardHeader>
        <CardContent>
          {carregando ? (
            <p className="text-sm text-muted-foreground">Carregando mensagens...</p>
          ) : erroLista ? (
            <p role="alert" className="text-sm text-destructive">
              {erroLista}
            </p>
          ) : mensagens.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma mensagem padrão cadastrada ainda.
            </p>
          ) : (
            <ul aria-label="Mensagens padrão cadastradas" className="flex flex-col gap-2">
              {mensagens.map((m) => (
                <li
                  key={m.id}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-3"
                >
                  <p className="whitespace-pre-wrap break-words text-sm">{m.mensagem}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Cadastrada em{" "}
                    {format(new Date(m.criadoEm), "dd/MM/yyyy 'às' HH:mm", {
                      locale: ptBR,
                    })}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
