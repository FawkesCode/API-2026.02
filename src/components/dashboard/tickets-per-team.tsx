import { Bar, BarChart, CartesianGrid, Cell, LabelList, XAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "../ui/chart";

interface TicketsPerTeamData {
  team: string;
  tickets: number;
}

// Assim que devem estar os dados passados para o gráfico
const chartData = [
  { team: "Equipe A", tickets: 186 },
  { team: "Equipe B", tickets: 305 },
  { team: "Equipe C", tickets: 237 },
  { team: "Equipe D", tickets: 73 },
  { team: "Equipe E", tickets: 150 },
];
const chartConfig = {
  tickets: {
    label: "tickets",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

const BAR_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

function TicketsPerTeam({ data = chartData }: { data?: TicketsPerTeamData[] }) {
  return (
    <ChartContainer config={chartConfig} className="min-h-50 h-50">
      <BarChart
        accessibilityLayer
        data={data}
        margin={{
          top: 20,
        }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="team"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tick={{
            className: "fill-foreground font-semibold text-xs italic",
          }}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel />}
        />
        <Bar dataKey="tickets" fill="var(--color-tickets)" radius={8}>
          <LabelList
            position="top"
            offset={12}
            className="fill-foreground"
            fontSize={12}
          />
          {data.map((_, index) => (
            <Cell
              key={`cell-${index}`}
              fill={BAR_COLORS[index % BAR_COLORS.length]}
            />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

export default TicketsPerTeam;
