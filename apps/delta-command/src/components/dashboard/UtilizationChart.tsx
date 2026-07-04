"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import type { Engineer } from "@/core/types";
import {
  CHART_GRID,
  CHART_TICK,
  CHART_TOOLTIP_STYLE,
  GOOGLE_COLORS,
} from "@/core/utils";

interface UtilizationChartProps {
  engineers: Engineer[];
  maxVisible?: number;
}

function getBarColor(utilization: number): string {
  if (utilization >= 100) return GOOGLE_COLORS.red;
  if (utilization >= 85) return GOOGLE_COLORS.yellow;
  if (utilization >= 60) return GOOGLE_COLORS.blue;
  return GOOGLE_COLORS.green;
}

export function UtilizationChart({ engineers, maxVisible = 30 }: UtilizationChartProps) {
  const data = [...engineers]
    .sort((a, b) => b.utilization - a.utilization)
    .slice(0, maxVisible)
    .map((e) => ({
      name: e.name.split(" ")[0],
      utilization: e.utilization,
      fill: getBarColor(e.utilization),
    }));

  const chartHeight = Math.min(520, Math.max(256, data.length * 26));

  return (
    <div className="card p-6">
      <h3 className="section-title mb-1">Team Utilization</h3>
      <p className="mb-6 body-md text-surface-on-variant">
        Current allocation across the delta engineering team
        {engineers.length > maxVisible && (
          <span className="text-surface-on-variant/70"> · top {maxVisible} by utilization</span>
        )}
      </p>
      <div className="overflow-y-auto" style={{ maxHeight: chartHeight }}>
        <div style={{ height: chartHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" barSize={16}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} horizontal={false} />
            <XAxis
              type="number"
              domain={[0, 120]}
              tick={{ fontSize: 12, fill: CHART_TICK }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 12, fill: CHART_TICK }}
              axisLine={false}
              tickLine={false}
              width={60}
            />
            <Tooltip
              contentStyle={CHART_TOOLTIP_STYLE}
              formatter={(value: number) => [`${value}%`, "Utilization"]}
            />
            <ReferenceLine
              x={100}
              stroke={GOOGLE_COLORS.red}
              strokeDasharray="4 4"
              label={{ value: "100%", position: "top", fill: GOOGLE_COLORS.red, fontSize: 11 }}
            />
            <Bar dataKey="utilization" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
