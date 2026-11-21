import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "../ui/chart";

interface EstimatedRealData {
  sla: string;
  estimated: number;
  real: number;
}

const chartData: EstimatedRealData[] = [
  { sla: "4 horas", estimated: 0, real: 0 },
  { sla: "8 horas", estimated: 0, real: 0 },
  { sla: "1 dia", estimated: 0, real: 0 },
  { sla: "2 dias", estimated: 0, real: 0 },
  { sla: "3 dias", estimated: 0, real: 0 },
  { sla: "7 dias", estimated: 0, real: 0 },
];

const chartConfig = {
  estimated: {
    label: "Chamados (SLA estimado)",
    color: "var(--chart-0)",
  },
  real: {
    label: "Chamados (duração real)",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

function EstimatedReal({ data = chartData }: { data?: EstimatedRealData[] }) {
  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto min-h-100 h-100 w-full pb-0"
    >
      <BarChart accessibilityLayer data={data}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="sla"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar
          dataKey="estimated"
          fill="var(--color-estimated)"
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="real"
          fill="var(--color-real)"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ChartContainer>
  );
}

export default EstimatedReal;
