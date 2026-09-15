import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";

function ProjectCard({
  id,
  title,
  client,
  location,
  description,
  ticketCount,
  createdBy,
}: {
  id: number;
  title: string;
  client: string;
  location: string;
  description: string;
  ticketCount: number;
  createdBy: string;
}) {
  return (
    <Link
      href={{
        pathname: `/projetos/${id}`,
        query: { title: title },
      }}
      className="hover:*:bg-gray-50 hover:*:border hover:*:border-gray-100 focus:*:rounded-xs "
    >
      <Card className="border border-transparent transition-all duration-100 ease-in-out min-h-min h-full justify-between">
        <CardHeader>
          <span className="text-sm text-accent font-medium">COD {id}</span>
          <CardTitle className="text-lg font-bold uppercase">{title}</CardTitle>
          <CardDescription className="text-foreground font-medium">
            {client} | {location}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          <p>{description}</p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <p className="text-xs ">
            Adicionado por <i>{createdBy}</i>
          </p>
          <span className="text-accent font-bold">{ticketCount} tickets</span>
        </CardFooter>
      </Card>
    </Link>
  );
}

export default ProjectCard;
