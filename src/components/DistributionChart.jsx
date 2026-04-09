import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Label,
} from "recharts";

export function DistributionChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart
        data={data}
        margin={{ top: 20, right: 30, bottom: 40, left: 50 }}
      >
        <CartesianGrid vertical={false} stroke="#e5e7eb" strokeDasharray="0" />

        <XAxis
          dataKey="variable"
          type="number"
          domain={["dataMin", "dataMax"]}
          tickCount={7}
          tickFormatter={(v) => v.toFixed(2)}
          tick={{ fontSize: 12, fill: "#6b7280" }}
          axisLine={false}
          tickLine={false}
        >
          <Label
            value="Variable"
            position="insideBottom"
            offset={-20}
            style={{ fontSize: 13, fill: "#374151", fontWeight: 500 }}
          />
        </XAxis>

        <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} tickCount={6} axisLine={false} tickLine={false}>
          <Label
            value="Observation"
            angle={-90}
            position="insideLeft"
            offset={-30}
            style={{ fontSize: 13, fill: "#374151", fontWeight: 500 }}
          />
        </YAxis>

        <Tooltip
          formatter={(value, name) => [
            value,
            name === "count" ? "Observations" : "Normal Curve",
          ]}
          contentStyle={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 6,
            fontSize: 12,
          }}
        />

        <Bar
          dataKey="count"
          fill="#93c5fd"
          stroke="#60a5fa"
          strokeWidth={0.5}
          barSize={18}
          isAnimationActive={false}
        />

        <Line
          dataKey="curve"
          type="monotone"
          stroke="#f59e0b"
          strokeWidth={2.5}
          dot={false}
          isAnimationActive={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
