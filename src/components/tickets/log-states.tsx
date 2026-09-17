import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import { toIsoOrUndefined } from "@/utils/date";
import Image from "next/image";

type LogStatus = "iniciado" | "solicitado" | "aprovado" | "recusado";

const logStateVariants = cva(
  "flex items-center gap-4 rounded-[6.7px] border-l-4 bg-white p-5 mb-3",
  {
    variants: {
      status: {
        iniciado: "border-blue-300",
        solicitado: "border-yellow-400",
        aprovado: "border-green-400",
        recusado: "border-orange-400",
      },
    },
    defaultVariants: {
      status: "iniciado",
    },
  }
);

const logStateTitleVariants = cva("text-lg font-semibold", {
  variants: {
    status: {
      iniciado: "text-blue-300",
      solicitado: "text-yellow-600",
      aprovado: "text-green-500",
      recusado: "text-orange-500",
    },
  },
  defaultVariants: {
    status: "iniciado",
  },
});

const STATUS_ICON_SRC = {
  iniciado: "/status-iniciado.svg",
  solicitado: "/status-solicitado.svg",
  aprovado: "/status-aprovado.svg",
  recusado: "/status-recusado.svg",
} as const satisfies Record<LogStatus, string>;

interface LogStateProps
  extends Omit<React.ComponentProps<"div">, "title">,
    VariantProps<typeof logStateVariants> {
  titulo: React.ReactNode;
  descricao?: React.ReactNode;
  criadoEm?: Date | string;
}

function LogState({
  className,
  status = "iniciado",
  titulo,
  descricao,
  criadoEm,
  ...props
}: LogStateProps) {
  return (
    <div
      data-slot="log-state"
      className={cn(logStateVariants({ status, className }))}
      {...props}
    >
      <Image
        src={STATUS_ICON_SRC[status ?? "iniciado"]}
        alt=""
        width={56}
        height={56}
        className="shrink-0"
      />
      <div className="flex flex-col gap-0.5">
        <p className={cn(logStateTitleVariants({ status }))}>{titulo}</p>
        {descricao ? (
          <p className="text-m text-muted-foreground">{descricao}</p>
        ) : null}
        {criadoEm ? (
          <time
            dateTime={toIsoOrUndefined(criadoEm)}
            className="text-xs italic text-muted-foreground"
          >
            Enviada em{" "}
            {typeof criadoEm === "string" ? criadoEm : criadoEm.toLocaleTimeString()}
          </time>
        ) : null}
      </div>
    </div>
  );
}

export { LogState, logStateVariants };
