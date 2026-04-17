"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type TrendPoint = {
  label: string;
  leads: number;
  converted: number;
};

type DistributionPoint = {
  label: string;
  value: number;
};

type AnalyticsPanelsProps = {
  timelineData: TrendPoint[];
  statusData: DistributionPoint[];
  sourceData: DistributionPoint[];
  variant?: "compact" | "full";
};

type ChartTooltipProps = {
  active?: boolean;
  label?: string;
  payload?: Array<{
    name: string;
    value: number;
    color?: string;
  }>;
};

const sourceColors = ["#0b5ed7", "#4f83ff", "#90b4ff", "#7c3aed", "#22c55e"];

function ChartTooltip({ active, label, payload }: ChartTooltipProps) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--surface-secondary)] px-3 py-2 text-xs shadow-[var(--shadow-soft)]">
      {label ? (
        <p className="font-semibold text-[var(--text-primary)]">{label}</p>
      ) : null}
      <div className="mt-2 space-y-1">
        {payload.map((entry) => (
          <p key={entry.name} className="text-[var(--text-secondary)]">
            <span
              className="mr-2 inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: entry.color ?? "#0b5ed7" }}
            />
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    </div>
  );
}

export function AnalyticsPanels({
  timelineData,
  statusData,
  sourceData,
  variant = "compact",
}: AnalyticsPanelsProps) {
  const lineHeight = variant === "full" ? 320 : 260;
  const pieHeight = variant === "full" ? 320 : 260;

  return (
    <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
      <article className="surface-card overflow-hidden p-5 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="soft-pill">Lead momentum</p>
            <h3 className="mt-4 text-2xl font-semibold text-[var(--text-primary)]">
              Lead volume across the selected range
            </h3>
          </div>
          <p className="text-sm text-muted">
            Inbound demand versus closed conversions
          </p>
        </div>

        <div style={{ height: lineHeight }} className="mt-8">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timelineData}>
              <CartesianGrid
                vertical={false}
                stroke="rgba(148, 163, 184, 0.16)"
                strokeDasharray="4 6"
              />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "currentColor", fontSize: 12 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "currentColor", fontSize: 12 }}
                allowDecimals={false}
              />
              <Tooltip content={<ChartTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="leads"
                name="Leads"
                stroke="#0b5ed7"
                strokeWidth={3}
                dot={{ fill: "#0b5ed7", r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="converted"
                name="Converted"
                stroke="#22c55e"
                strokeWidth={3}
                dot={{ fill: "#22c55e", r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </article>

      <div className="grid gap-6">
        <article className="surface-card p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="soft-pill">Status split</p>
              <h3 className="mt-4 text-xl font-semibold text-[var(--text-primary)]">
                Pipeline status balance
              </h3>
            </div>
          </div>
          <div style={{ height: 240 }} className="mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid
                  vertical={false}
                  stroke="rgba(148, 163, 184, 0.16)"
                  strokeDasharray="4 6"
                />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "currentColor", fontSize: 12 }}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "currentColor", fontSize: 12 }}
                />
                <Tooltip content={<ChartTooltip />} />
                <Bar
                  dataKey="value"
                  name="Leads"
                  radius={[10, 10, 0, 0]}
                  fill="#0b5ed7"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="surface-card p-5 sm:p-6">
          <div>
            <p className="soft-pill">Source mix</p>
            <h3 className="mt-4 text-xl font-semibold text-[var(--text-primary)]">
              Where the best leads start
            </h3>
          </div>
          <div style={{ height: pieHeight }} className="mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sourceData}
                  dataKey="value"
                  nameKey="label"
                  innerRadius={64}
                  outerRadius={94}
                  paddingAngle={4}
                >
                  {sourceData.map((entry, index) => (
                    <Cell
                      key={entry.label}
                      fill={sourceColors[index % sourceColors.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </article>
      </div>
    </div>
  );
}
