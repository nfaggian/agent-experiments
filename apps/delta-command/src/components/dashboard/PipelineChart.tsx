"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { OPPORTUNITY_STAGES } from "@/core/types";
import type { Opportunity } from "@/core/types";
import { formatCurrency } from "@/core/utils";

interface PipelineChartProps {
  opportunities: Opportunity[];
}

const STAGE_COLORS: Record<string, string> = {
  prospect: "#74777F",
  qualified: "#005FB0",
  proposal: "#6B5778",
  negotiation: "#535F70",
  won: "#005FB0",
  lost: "#BA1A1A",
};

export function PipelineChart({ opportunities }: PipelineChartProps) {
  const data = OPPORTUNITY_STAGES.filter((s) => !["lost"].includes(s.id)).map(
    (stage) => {
      const opps = opportunities.filter((o) => o.stage === stage.id);
      return {
        stage: stage.label,
        count: opps.length,
        value: opps.reduce((sum, o) => sum + o.value, 0),
        fill: STAGE_COLORS[stage.id],
      };
    }
  );

  return (
    <div className="card p-6">
      <h3 className="section-title mb-1">Pipeline by Stage</h3>
      <p className="mb-6 body-md text-surface-on-variant">
        Opportunity count and value across the sales funnel
      </p>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barSize={40}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="stage"
              tick={{ fontSize: 12, fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
              }}
              formatter={(value: number, name: string) => {
                if (name === "value") return [formatCurrency(value), "Total Value"];
                return [value, "Count"];
              }}
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
