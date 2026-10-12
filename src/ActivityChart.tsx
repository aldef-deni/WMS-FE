import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
export default function ActivityChart({ data }: { data: any }) {
  return (
    <div className="chart">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data.activity}
          margin={{ top: 16, right: 24, left: -20, bottom: 4 }}
        >
          <defs>
            <linearGradient id="chartBlue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1683e8" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#1683e8" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#eef1f5" />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "#8290a3" }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "#8290a3" }}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 10,
              borderColor: "#e7edf3",
              fontSize: 12,
            }}
          />
          <Area
            type="monotone"
            dataKey="inbound"
            name="Inbound"
            stroke="#1683e8"
            fill="url(#chartBlue)"
            strokeWidth={2.5}
          />
          <Area
            type="monotone"
            dataKey="outbound"
            name="Outbound"
            stroke="#fa9837"
            fill="transparent"
            strokeWidth={2.5}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
