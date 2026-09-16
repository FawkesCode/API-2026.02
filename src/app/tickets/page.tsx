'use client'
import PageHeader from "@/components/page-header";
import { useRouter } from "next/navigation";
import { useState } from "react";
export default function Tickets() {
  const [counter, setCounter] = useState < number>(0);
  const route = useRouter();

  return (
    <>
      <PageHeader>Tickets</PageHeader>
      <h2>Página de Tickets</h2>
      <button title="novo ticket" onClick={() =>
      {
        setCounter(counter + 1)
        route.push(`/tickets/${counter}`)
      }}>
        Novo Ticket
      </button>
    </>
  );
}
