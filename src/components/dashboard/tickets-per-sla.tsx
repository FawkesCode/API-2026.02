import { Pie, PieChart } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "../ui/chart";

interface TicketsPerSlaData {
  sla: string;
  tickets: number;
  fill: string;
}

// Assim que os dados devem ser passados para o gráfico
const chartData = [
  { sla: "sla4h", tickets: 275, fill: "var(--color-sla4h)" },
  { sla: "sla8h", tickets: 200, fill: "var(--color-sla8h)" },
  { sla: "sla1d", tickets: 187, fill: "var(--color-sla1d)" },
  { sla: "sla2d", tickets: 173, fill: "var(--color-sla2d)" },
  { sla: "sla3d", tickets: 90, fill: "var(--color-sla3d)" },
  { sla: "sla7d", tickets: 90, fill: "var(--color-sla7d)" },
];
const chartConfig = {
  tickets: {
    label: "Tickets",
  },
  sla4h: {
    label: "4 horas",
    color: "var(--chart-1)",
  },
  sla8h: {
    label: "8 horas",
    color: "var(--chart-2)",
  },
  sla1d: {
    label: "1 dia",
    color: "var(--chart-3)",
  },
  sla2d: {
    label: "2 dias",
    color: "var(--chart-4)",
  },
  sla3d: {
    label: "3 dias",
    color: "var(--chart-5)",
  },
  sla7d: {
    label: "7 dias",
    color: "var(--chart-6)",
  },
} satisfies ChartConfig;

function TicketsPerSla({ data = chartData }: { data?: TicketsPerSlaData[] }) {
  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto aspect-square h-62 w-full pb-0 [&_.recharts-pie-label-text]:fill-foreground"
    >
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
        <Pie
          data={data}
          dataKey="tickets"
          label={({ value }: { value?: number }) =>
            value && value > 0 ? String(value) : ""
          }
          labelLine={false}
          nameKey="sla"
        />
        <ChartLegend
          content={<ChartLegendContent nameKey="sla" />}
          wrapperStyle={{ paddingTop: "20px" }}
          className="-translate-y-2 flex-wrap  gap-2 *:basis-1/4 *:justify-center"
        />
      </PieChart>
    </ChartContainer>
  );
}

export default TicketsPerSla;
