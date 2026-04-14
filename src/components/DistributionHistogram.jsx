import {
  Bar,
  BarChart,
  CartesianGrid,
  Label,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function DistributionHistogram({ data, metric, limits }) {
  const values = data.map((item) => item.variable);
  const minValue = Math.min(...values, limits?.lcl ?? Infinity);
  const maxValue = Math.max(...values, limits?.ucl ?? -Infinity);
  const padding = Math.max((maxValue - minValue) * 0.08, 5);

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 16, right: 20, bottom: 28, left: 16 }}
      >
        <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />

        <XAxis
          type="number"
          dataKey="count"
          tick={{ fontSize: 12, fill: "#6b7280" }}
          axisLine={false}
          tickLine={false}
        >
          <Label
            value="Count"
            position="insideBottom"
            offset={-10}
            style={{ fontSize: 13, fill: "#374151", fontWeight: 500 }}
          />
        </XAxis>

        <YAxis
          type="number"
          dataKey="variable"
          domain={[minValue - padding, maxValue + padding]}
          reversed
          tick={{ fontSize: 12, fill: "#6b7280" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(value) => value.toFixed(0)}
        >
          <Label
            value={metric}
            angle={-90}
            position="insideLeft"
            offset={-4}
            style={{ fontSize: 13, fill: "#374151", fontWeight: 500 }}
          />
        </YAxis>

        <Tooltip
          formatter={(value, name, payload) => {
            if (name === "count") {
              return [value, "Count"];
            }

            return [payload?.payload?.variable?.toFixed?.(2), metric];
          }}
          labelFormatter={(_, payload) =>
            payload?.[0]?.payload
              ? `Bin center: ${payload[0].payload.variable.toFixed(2)}`
              : ""
          }
          contentStyle={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 6,
            fontSize: 12,
          }}
        />

        <ReferenceLine
          y={limits?.lcl}
          stroke="#ff4d4f"
          strokeDasharray="6 4"
          ifOverflow="extendDomain"
          label={{ value: "LCL", fill: "#ff4d4f", position: "insideTopLeft" }}
        />
        <ReferenceLine
          y={limits?.mean}
          stroke="#52c41a"
          strokeDasharray="4 4"
          ifOverflow="extendDomain"
          label={{ value: "CL", fill: "#52c41a", position: "insideTopLeft" }}
        />
        <ReferenceLine
          y={limits?.ucl}
          stroke="#ff4d4f"
          strokeDasharray="6 4"
          ifOverflow="extendDomain"
          label={{ value: "UCL", fill: "#ff4d4f", position: "insideTopLeft" }}
        />

        <Bar dataKey="count" fill="#3b82f6" barSize={14} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}
