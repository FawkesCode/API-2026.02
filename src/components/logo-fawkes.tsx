import Image from "next/image";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

function LogoFawkes() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div className="flex min-w-10! cursor-pointer">
            <Image
              src="/fawkes.svg"
              className=""
              alt="Fawkes Code"
              width={40}
              height={40}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Fawkes Code</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default LogoFawkes;
