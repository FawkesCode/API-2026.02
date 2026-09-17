import PageHeader from "@/components/page-header";

export default function Home() {
  return (
    <>
      <PageHeader>Home</PageHeader>
      <h1 className="text-primary font-bold">COR PRIMÁRIA</h1>
      <h1 className="text-accent font-bold">COR DE DESTAQUE</h1>

      <h1 className="text-sky-50 font-bold">SKY 300</h1>
      <h1 className="text-cyan-300 font-bold">CYAN 300</h1>

      <h1 className="text-blue-300 font-bold">BLUE 300</h1>
      <h1 className="text-blue-800 font-bold">BLUE 800</h1>
      <h1 className="text-blue-900 font-bold">BLUE 900</h1>
    </>
  );
}
