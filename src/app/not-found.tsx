"use client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  return (
    <section className="flex flex-col  items-center mt-20 gap-3 h-full w-full">
      <h1 className="text-8xl text-card-foreground">404</h1>
      <h2 className="text-4xl text-primary">Página Não Encontrada</h2>
      <div className="flex flex-col justify-center items-center gap-12">
        <p className="text-muted-foreground">
          Ops... Parece que não encontramos o caminho que você busca.
        </p>
        <Button
          className="rounded-xl max-w-min pl-5 pr-5 cursor-pointer"
          onClick={() => router.back()}
        >
          Voltar
        </Button>
      </div>
    </section>
  );
}
