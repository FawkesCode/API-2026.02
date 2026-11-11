import { ReactNode } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";

function FilterContainer({ children }: { children: ReactNode }) {
  return (
    <Accordion>
      <AccordionItem>
        <AccordionTrigger>Filtrar por</AccordionTrigger>
        <AccordionContent>{children}</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

export default FilterContainer;
