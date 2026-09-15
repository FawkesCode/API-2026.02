import PageHeader from "@/components/page-header";
import { Suspense } from "react";

interface PageProps {
  params: Promise<{ id: number }>;
  searchParams: Promise<{ title?: string }>;
}

async function ProjectTicketsPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { title } = await searchParams;
  console.log("id da página", id);

  return (
    <>
      <PageHeader title={`${title} : COD ${id} > Tickets`} />
      <section></section>
    </>
  );
}

export default ProjectTicketsPage;
