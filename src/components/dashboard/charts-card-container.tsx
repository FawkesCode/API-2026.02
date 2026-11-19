import { ReactNode } from "react";
import { Card, CardContent, CardTitle } from "../ui/card";
import { cn } from "cn";

function ChartsCardContainer({
  title,
  children,
  className,
}: {
  title: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Card className={cn("flex flex-col gap-2", className)}>
      <CardTitle className="px-6 ">
        <h3 className="text-accent font-bold">{title}</h3>
        <div className="my-2 h-px w-full bg-linear-to-r from-accent to-cyan-300/10" />
      </CardTitle>

      <CardContent className="flex flex-col gap-4">{children}</CardContent>
    </Card>
  );
}

export default ChartsCardContainer;
