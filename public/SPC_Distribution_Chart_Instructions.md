# SPC Normal Distribution Histogram — Implementation Guide

## Overview

This guide explains how to implement the **Normal Distribution Histogram** (bell curve overlay chart) seen in SPC dashboards. The chart visualizes measurement frequency distribution across a variable, with a fitted normal curve overlay — used to assess process normality and spread.

Target aesthetic: clean enterprise SPC dashboard (light background, muted blue bars, amber curve, minimal grid).

---

## Chart Anatomy

| Element | Description |
|---|---|
| **Histogram bars** | Frequency counts per bin (Y: Observation count, X: Variable value) |
| **Normal curve overlay** | Fitted Gaussian curve drawn on top of bars |
| **X-axis** | Continuous variable range (e.g., 1.00 – 7.00) |
| **Y-axis** | Observation count (0 – ~450) |
| **Axis labels** | `Variable` (X), `Observation` (Y, rotated 90°) |

---

## Tech Stack

Uses **Recharts** (already available in the project) with a custom SVG normal curve overlay rendered via `<ReferenceLine>` or a `<Customized>` layer.

```bash
# Already in project — no new installs needed
recharts
```

---

## Step 1 — Prepare Histogram Data

Bin your raw measurement data into equal-width intervals. Each bin needs a `variable` (midpoint) and `count`.

```ts
// utils/histogram.ts

export interface HistogramBin {
  variable: number;   // bin midpoint (e.g., 1.25, 1.50, ...)
  count: number;      // observation count in this bin
}

/**
 * Generate histogram bins from raw data array
 * @param data - array of numeric measurements
 * @param binCount - number of bins (default: 20)
 */
export function buildHistogram(data: number[], binCount = 20): HistogramBin[] {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const binWidth = (max - min) / binCount;

  const bins: HistogramBin[] = Array.from({ length: binCount }, (_, i) => ({
    variable: parseFloat((min + i * binWidth + binWidth / 2).toFixed(2)),
    count: 0,
  }));

  data.forEach((val) => {
    const index = Math.min(Math.floor((val - min) / binWidth), binCount - 1);
    bins[index].count++;
  });

  return bins;
}
```

---

## Step 2 — Compute Normal Curve Points

Generate a smooth Gaussian curve fitted to the dataset's mean and standard deviation.

```ts
// utils/normalCurve.ts

export interface CurvePoint {
  variable: number;
  curve: number;  // scaled to match histogram y-axis
}

/**
 * Returns normal PDF value at x given mean and std
 */
function normalPDF(x: number, mean: number, std: number): number {
  return (
    (1 / (std * Math.sqrt(2 * Math.PI))) *
    Math.exp(-0.5 * Math.pow((x - mean) / std, 2))
  );
}

/**
 * Build curve points scaled to histogram observation counts
 * @param mean - dataset mean
 * @param std - dataset standard deviation
 * @param totalCount - total number of observations
 * @param binWidth - width of each histogram bin
 * @param xMin - x-axis minimum
 * @param xMax - x-axis maximum
 * @param resolution - number of points on curve (default: 100)
 */
export function buildNormalCurve(
  mean: number,
  std: number,
  totalCount: number,
  binWidth: number,
  xMin: number,
  xMax: number,
  resolution = 100
): CurvePoint[] {
  const step = (xMax - xMin) / resolution;
  return Array.from({ length: resolution + 1 }, (_, i) => {
    const x = xMin + i * step;
    const y = normalPDF(x, mean, std) * totalCount * binWidth;
    return { variable: parseFloat(x.toFixed(3)), curve: parseFloat(y.toFixed(2)) };
  });
}
```

---

## Step 3 — Merge Bins and Curve Data

Recharts `ComposedChart` can overlay a `Bar` and `Line` series — but they must share the same `data` array. Merge curve points onto each bin by nearest `variable` match, or use a separate `Line` with its own data via a hidden axis trick.

### Recommended: Unified Data Array

```ts
// Merge curve values onto histogram bins
function mergeData(bins: HistogramBin[], curve: CurvePoint[]): MergedPoint[] {
  return bins.map((bin) => {
    // Find closest curve point
    const closest = curve.reduce((a, b) =>
      Math.abs(b.variable - bin.variable) < Math.abs(a.variable - bin.variable) ? b : a
    );
    return { ...bin, curve: closest.curve };
  });
}
```

---

## Step 4 — Build the Chart Component

```tsx
// components/DistributionChart.tsx
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

interface Props {
  data: MergedPoint[];  // from mergeData()
}

export function DistributionChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <ComposedChart
        data={data}
        margin={{ top: 20, right: 30, bottom: 40, left: 50 }}
      >
        {/* Subtle grid — horizontal lines only */}
        <CartesianGrid vertical={false} stroke="#e5e7eb" strokeDasharray="0" />

        {/* X Axis */}
        <XAxis
          dataKey="variable"
          type="number"
          domain={["dataMin", "dataMax"]}
          tickCount={7}
          tickFormatter={(v) => v.toFixed(2)}
          tick={{ fontSize: 12, fill: "#6b7280" }}
        >
          <Label
            value="Variable"
            position="insideBottom"
            offset={-20}
            style={{ fontSize: 13, fill: "#374151", fontWeight: 500 }}
          />
        </XAxis>

        {/* Y Axis */}
        <YAxis
          tick={{ fontSize: 12, fill: "#6b7280" }}
          tickCount={6}
        >
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

        {/* Histogram bars — muted sky blue matching dashboard palette */}
        <Bar
          dataKey="count"
          fill="#93c5fd"        /* Tailwind blue-300 — matches dashboard's light blue */
          stroke="#60a5fa"      /* blue-400 border */
          strokeWidth={0.5}
          barSize={18}
          isAnimationActive={false}
        />

        {/* Normal curve overlay — amber/orange matching reference image */}
        <Line
          dataKey="curve"
          type="monotone"
          stroke="#f59e0b"      /* Tailwind amber-400 */
          strokeWidth={2.5}
          dot={false}
          isAnimationActive={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
```

---

## Step 5 — Color & Style Alignment with Dashboard

Match these values to stay consistent with the existing SPC dashboard theme:

| Token | Value | Usage |
|---|---|---|
| Background | `#ffffff` | Chart container |
| Bar fill | `#93c5fd` (blue-300) | Histogram bars |
| Bar stroke | `#60a5fa` (blue-400) | Bar border |
| Curve stroke | `#f59e0b` (amber-400) | Normal curve line |
| Grid line | `#e5e7eb` (gray-200) | Horizontal gridlines |
| Axis text | `#6b7280` (gray-500) | Tick labels |
| Axis label | `#374151` (gray-700) | Axis title text |
| Tooltip border | `#e5e7eb` | Tooltip container |
| Font size (ticks) | `12px` | Match dashboard table font |
| Font size (labels) | `13px` | Axis titles |

> These match the clean enterprise aesthetic seen in the Trend Chart and Alarm Log sections of the dashboard.

---

## Step 6 — Section Wrapper

Wrap the chart in the same card style used by **Trend Chart** and **Alarm Log**:

```tsx
// Inside your page/tab component
<div className="bg-white border border-gray-200 rounded-lg p-6">
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-sm font-semibold text-gray-700 tracking-wide">
      Distribution Chart
    </h2>
    {/* Optional: property selector dropdown */}
    <select className="text-xs border border-gray-200 rounded px-2 py-1 text-gray-600">
      <option>CAPACITANCE</option>
      <option>FWD_1</option>
      <option>FWD_10</option>
    </select>
  </div>

  <DistributionChart data={mergedData} />

  {/* Optional summary row below chart */}
  <div className="flex gap-6 mt-4 text-xs text-gray-500">
    <span>Mean: <strong className="text-gray-700">{mean.toFixed(2)}</strong></span>
    <span>Std Dev: <strong className="text-gray-700">{std.toFixed(2)}</strong></span>
    <span>N: <strong className="text-gray-700">{totalCount}</strong></span>
  </div>
</div>
```

---

## Step 7 — Wiring It All Together

```tsx
// Page-level usage example
import { buildHistogram } from "@/utils/histogram";
import { buildNormalCurve } from "@/utils/normalCurve";
import { DistributionChart } from "@/components/DistributionChart";

const rawData: number[] = [...]; // your measurement array from API

const mean = rawData.reduce((a, b) => a + b, 0) / rawData.length;
const std = Math.sqrt(
  rawData.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / rawData.length
);

const BIN_COUNT = 20;
const bins = buildHistogram(rawData, BIN_COUNT);
const binWidth = (Math.max(...rawData) - Math.min(...rawData)) / BIN_COUNT;

const curve = buildNormalCurve(
  mean, std, rawData.length, binWidth,
  Math.min(...rawData), Math.max(...rawData)
);

const mergedData = mergeData(bins, curve);

// Render
<DistributionChart data={mergedData} />
```

---

## Notes

- **No new library needed** — Recharts `ComposedChart` handles Bar + Line overlay natively.
- If data is fetched from an API, run `buildHistogram` and `buildNormalCurve` inside a `useMemo` hook to avoid recomputation on re-renders.
- For the property selector (CAPACITANCE / FWD_1 / FWD_10), manage selected property in local state and pass the corresponding `rawData` slice into the pipeline.
- `isAnimationActive={false}` is recommended for SPC dashboards with frequent data refreshes to avoid chart flicker.
