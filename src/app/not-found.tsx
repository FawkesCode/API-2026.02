import Link from "next/link";

export default function NotFound() {
  return (
    <section className="flex flex-col  items-center mt-20 gap-3 h-full w-full">
      <h1 className="text-8xl text-card-foreground">404</h1>
      <h2 className="text-4xl text-primary">Página Não Encontrada</h2>
      <div className="flex flex-col justify-center items-center gap-12">
        <p className="text-muted-foreground">
          Ops... Parece que não encontramos o caminho que você busca.
        </p>
        <Link
          className="rounded-xl text-sm bg-primary text-primary-foreground p-3 pl-5 pr-5 cursor-pointer"
          href="/projetos"
        >
          Voltar para projetos
        </Link>
      </div>
    </section>
  );
}
