<script setup lang="ts">
import { computed } from "vue";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";
import { Bar, Doughnut, Line } from "vue-chartjs";

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
);

type TrendPoint = {
  label: string;
  leads: number;
  converted: number;
};

type DistributionPoint = {
  label: string;
  value: number;
};

const props = withDefaults(
  defineProps<{
    timelineData: TrendPoint[];
    statusData: DistributionPoint[];
    sourceData: DistributionPoint[];
    variant?: "compact" | "full";
  }>(),
  {
    variant: "compact",
  },
);

const sourceColors = ["#0b5ed7", "#4f83ff", "#90b4ff", "#22c55e", "#f59e0b"];

const lineHeight = computed(() => (props.variant === "full" ? 320 : 260));
const pieHeight = computed(() => (props.variant === "full" ? 320 : 260));

const lineData = computed(() => ({
  labels: props.timelineData.map((entry) => entry.label),
  datasets: [
    {
      label: "Leads",
      data: props.timelineData.map((entry) => entry.leads),
      borderColor: "#0b5ed7",
      backgroundColor: "rgba(11, 94, 215, 0.12)",
      pointBackgroundColor: "#0b5ed7",
      pointBorderWidth: 0,
      pointRadius: 3,
      pointHoverRadius: 5,
      borderWidth: 3,
      tension: 0.4,
      fill: true,
    },
    {
      label: "Converted",
      data: props.timelineData.map((entry) => entry.converted),
      borderColor: "#22c55e",
      backgroundColor: "rgba(34, 197, 94, 0.1)",
      pointBackgroundColor: "#22c55e",
      pointBorderWidth: 0,
      pointRadius: 3,
      pointHoverRadius: 5,
      borderWidth: 3,
      tension: 0.4,
      fill: false,
    },
  ],
}));

const barData = computed(() => ({
  labels: props.statusData.map((entry) => entry.label),
  datasets: [
    {
      label: "Leads",
      data: props.statusData.map((entry) => entry.value),
      backgroundColor: ["#0b5ed7", "#f59e0b", "#8b5cf6", "#22c55e"],
      borderRadius: 12,
      borderSkipped: false,
    },
  ],
}));

const doughnutData = computed(() => ({
  labels: props.sourceData.map((entry) => entry.label),
  datasets: [
    {
      data: props.sourceData.map((entry) => entry.value),
      backgroundColor: props.sourceData.map(
        (_, index) => sourceColors[index % sourceColors.length],
      ),
      borderWidth: 0,
      hoverOffset: 8,
    },
  ],
}));

const lineOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        color: "#7a8aa8",
        boxWidth: 10,
        boxHeight: 10,
        useBorderRadius: true,
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: "#7a8aa8" },
      border: { display: false },
    },
    y: {
      beginAtZero: true,
      ticks: {
        color: "#7a8aa8",
        precision: 0,
      },
      grid: {
        color: "rgba(148, 163, 184, 0.16)",
        borderDash: [4, 6],
      },
      border: { display: false },
    },
  },
}));

const simpleChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        color: "#7a8aa8",
        boxWidth: 10,
        boxHeight: 10,
        useBorderRadius: true,
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: "#7a8aa8" },
      border: { display: false },
    },
    y: {
      beginAtZero: true,
      ticks: {
        color: "#7a8aa8",
        precision: 0,
      },
      grid: {
        color: "rgba(148, 163, 184, 0.16)",
        borderDash: [4, 6],
      },
      border: { display: false },
    },
  },
}));

const doughnutOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  cutout: "70%",
  plugins: {
    legend: {
      position: "bottom" as const,
      labels: {
        color: "#7a8aa8",
        boxWidth: 10,
        boxHeight: 10,
        useBorderRadius: true,
        padding: 18,
      },
    },
  },
}));
</script>

<template>
  <div class="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
    <article class="surface-card overflow-hidden p-5 sm:p-6">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="soft-pill">Lead momentum</p>
          <h3 class="mt-4 text-2xl font-semibold text-[var(--text-primary)]">
            Lead volume across the selected range
          </h3>
        </div>
        <p class="text-sm text-muted">
          Inbound demand versus closed conversions
        </p>
      </div>

      <div class="mt-8" :style="{ height: `${lineHeight}px` }">
        <Line :data="lineData" :options="lineOptions" />
      </div>
    </article>

    <div class="grid gap-6">
      <article class="surface-card p-5 sm:p-6">
        <p class="soft-pill">Status split</p>
        <h3 class="mt-4 text-xl font-semibold text-[var(--text-primary)]">
          Pipeline status balance
        </h3>
        <div class="mt-6 h-[240px]">
          <Bar :data="barData" :options="simpleChartOptions" />
        </div>
      </article>

      <article class="surface-card p-5 sm:p-6">
        <p class="soft-pill">Source mix</p>
        <h3 class="mt-4 text-xl font-semibold text-[var(--text-primary)]">
          Where the best leads start
        </h3>
        <div class="mt-6" :style="{ height: `${pieHeight}px` }">
          <Doughnut :data="doughnutData" :options="doughnutOptions" />
        </div>
      </article>
    </div>
  </div>
</template>
