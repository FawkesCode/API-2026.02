import AuthContainer from "@/components/login/auth-container";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function Home() {
  return (
    <main className="flex flex-col w-full lg:overflow-hidden items-center">
      <div className="min-h-full lg:h-screen w-full items-center lg:items-stretch  flex flex-col lg:flex-row justify-center gap-15 md:gap-3 lg:gap-5 xl:gap-15 pt-8 pb-8 ">
        <TooltipProvider>
          <AuthContainer />
        </TooltipProvider>
      </div>
    </main>
  );
}
