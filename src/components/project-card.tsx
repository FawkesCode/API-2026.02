import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";

interface Project {
  id: string;
  title: string;
  client: string;
  location: string;
  description: string;
  ticketCount: number;
  createdBy: string;
}

function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      href={`/projetos/${project.id}`}
      className="hover:*:bg-gray-50 hover:*:border hover:*:border-gray-100 focus:*:rounded-xs "
    >
      <Card className="border border-transparent transition-all duration-100 ease-in-out min-h-min h-full justify-between">
        <CardHeader>
          <span className="text-sm text-accent font-medium">
            COD {project.id}
          </span>
          <CardTitle className="text-lg font-bold uppercase">
            {project.title}
          </CardTitle>
          <CardDescription className="text-foreground font-medium">
            {project.client} | {project.location}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          <p>{project.description}</p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <p className="text-xs ">
            Adicionado por <i>{project.createdBy}</i>
          </p>
          <span className="text-accent font-bold">
            {project.ticketCount} tickets
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}

export default ProjectCard;
