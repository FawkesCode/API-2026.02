import { Label, Pie, PieChart } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "../ui/chart";

interface TicketsPerStatusData {
  status: string;
  tickets: number;
  fill: string;
}

// Assim que os dados devem ser passados para o gráfico
const chartData = [
  { status: "notStarted", tickets: 275, fill: "var(--color-notStarted)" },
  { status: "inProgress", tickets: 200, fill: "var(--color-inProgress)" },
  {
    status: "closureRequested",
    tickets: 287,
    fill: "var(--color-closureRequested)",
  },
  { status: "closed", tickets: 173, fill: "var(--color-closed)" },
  { status: "inReview", tickets: 190, fill: "var(--color-inReview)" },
];

const chartConfig = {
  tickets: {
    label: "Tickets",
  },
  notStarted: {
    label: "Não iniciado",
    color: "var(--chart-1)",
  },
  inProgress: {
    label: "Em andamento",
    color: "var(--chart-2)",
  },
  closureRequested: {
    label: "Encerramento solicitado",
    color: "var(--chart-3)",
  },
  closed: {
    label: "Encerrado",
    color: "var(--chart-4)",
  },
  inReview: {
    label: "Em revisão",
    color: "var(--chart-5)",
  },
} satisfies ChartConfig;

function TicketsPerStatus({
  data = chartData,
  total = 45,
}: {
  data?: TicketsPerStatusData[];
  total?: number;
}) {
  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto aspect-square h-62 w-full pb-0"
    >
      <PieChart>
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel />}
        />
        <Pie
          data={data}
          dataKey="tickets"
          nameKey="status"
          innerRadius={60}
          strokeWidth={5}
        >
          <Label
            content={({ viewBox }) => {
              if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                return (
                  <text
                    x={viewBox.cx}
                    y={viewBox.cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    <tspan
                      x={viewBox.cx}
                      y={viewBox.cy}
                      className="fill-foreground text-3xl font-bold"
                    >
                      {total.toLocaleString()}
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy || 0) + 24}
                      className="fill-muted-foreground"
                    >
                      Tickets Totais
                    </tspan>
                  </text>
                );
              }
            }}
          />
        </Pie>
      </PieChart>
    </ChartContainer>
  );
}

export default TicketsPerStatus;