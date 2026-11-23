import { Bar, BarChart, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardTitle } from "../ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "../ui/chart";

interface TicketsPerUrgencyData {
  priority: string;
  tickets: number;
}

// Assim que devem estar os dados passados para o gráfico
const chartData: TicketsPerUrgencyData[] = [
  { priority: "Crítica", tickets: 20 },
  { priority: "Alta", tickets: 10 },
  { priority: "Média", tickets: 15 },
  { priority: "Baixa", tickets: 30 },
];
const chartConfig = {
  tickets: {
    label: "Tickets",
    color: "var(--chart-0)",
  },
} satisfies ChartConfig;

function TicketsPerUrgency({
  data = chartData,
}: {
  data?: TicketsPerUrgencyData[];
}) {
  return (
    <Card className="xl:flex-1 flex flex-col gap-2 pt-4 min-h-75  xl:min-h-50">
      <CardTitle className="px-6 ">
        <h3 className="text-accent font-bold">Tickets por urgência</h3>
        <div className="my-2 h-px w-full bg-linear-to-r from-accent to-cyan-300/10" />
      </CardTitle>

      <CardContent className="flex-1 pb-0">
        <div className="relative h-full w-full">
          <ChartContainer
            config={chartConfig}
            className="absolute inset-0 h-full w-full aspect-auto"
          >
            <BarChart
              accessibilityLayer
              data={data}
              layout="vertical"
              margin={{
                left: -5,
              }}
            >
              <XAxis type="number" dataKey="tickets" hide />
              <YAxis
                dataKey="priority"
                type="category"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                interval={0}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Bar dataKey="tickets" fill="var(--color-tickets)" radius={5} />
            </BarChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export default TicketsPerUrgency;
