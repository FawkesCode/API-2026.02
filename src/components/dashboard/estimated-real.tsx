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

const chartData = [
  { sla: "4 horas", estimated: 186, real: 80 },
  { sla: "8 horas", estimated: 305, real: 200 },
  { sla: "1 dia", estimated: 237, real: 120 },
  { sla: "2 dias", estimated: 73, real: 190 },
  { sla: "3 dias", estimated: 209, real: 130 },
  { sla: "8 dias", estimated: 214, real: 140 },
];

const chartConfig = {
  estimated: {
    label: "Tempo Estimado",
    color: "var(--chart-0)",
  },
  real: {
    label: "Tempo Real",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

function EstimatedReal({ data = chartData }: { data?: EstimatedRealData[] }) {
  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto min-h-100  h-100 w-full pb-0"
    >
      <BarChart accessibilityLayer data={data}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="sla"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
        />
        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar
          dataKey="estimated"
          stackId="a"
          fill="var(--color-estimated)"
          radius={[0, 0, 4, 4]}
        />
        <Bar
          dataKey="real"
          stackId="a"
          fill="var(--color-real)"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ChartContainer>
  );
}

export default EstimatedReal;
