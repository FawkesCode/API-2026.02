import FilterInput from "./filter-input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

function TicketFilter() {
  return (
    <Card className="col-span-full  gap-4!">
      <CardHeader>
        <CardTitle>
          <p className="text-sm text-foreground">Filtrar por:</p>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-row">
        <FilterInput
          title="Propriedade"
          id="properties"
          type="select"
          selectOptions="Light,light|Dark,dark"
        />
        <FilterInput
          title="Status"
          id="status"
          type="select"
          selectOptions="Light,light|Dark,dark"
        />
        <FilterInput title="Título" id="titulo" />
        <FilterInput id="date" type="date" />
      </CardContent>
    </Card>
  );
}

export default TicketFilter;
