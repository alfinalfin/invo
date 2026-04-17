<script setup lang="ts">
import {
  BellDot,
  ChartColumnIncreasing,
  CheckCircle,
  FileText,
  LayoutDashboard,
  Search,
  Settings,
  Truck,
  UsersRound,
  Zap,
  Plus
} from "lucide-vue-next";
import { useRoute, useRouter } from "vue-router";
import type { DashboardSection } from "~/lib/crm";

const route = useRoute();
const router = useRouter();

defineProps<{
  activeSection: DashboardSection;
  notificationCount: number;
  openLeadCount: number;
  todayCount: number;
}>();

const items = [
  { href: "/", label: "Dashboard", section: "dashboard", icon: LayoutDashboard },
  { href: "/leads", label: "Leads", section: "leads", icon: UsersRound },
  { href: "/converted-leads", label: "Converted Leads", section: "converted_leads", icon: CheckCircle },
  { href: "/generate-pods", label: "Generate PODs", section: "generate_pods", icon: FileText },
  { href: "/ai-leads", label: "Lead Engine", section: "ai_leads", icon: Zap },
  {
    href: "/analytics",
    label: "Analytics",
    section: "analytics",
    icon: ChartColumnIncreasing,
  },
] as const;
</script>

<template>
  <aside class="fixed hidden lg:flex left-0 top-0 h-screen w-64 pt-20 bg-slate-100 dark:bg-slate-950 flex-col z-40 border-r border-outline-variant/10">
    <div class="flex flex-col h-full py-4 gap-2">
      <div v-if="activeSection === 'ai_leads'" class="px-6 mb-6">
          <button @click="router.push({ query: { ...route.query, scrape: 'true' } })" class="w-full py-3 px-4 bg-primary text-on-primary rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:opacity-90 transition-all">
          <Plus class="w-5 h-5" />
          <span>Add Lead</span>
        </button>
      </div>

      <nav class="flex-1 space-y-1 overflow-y-auto no-scrollbar">
        <NuxtLink
          v-for="item in items"
          :key="item.label"
          :to="item.href"
          :class="[
            'flex items-center gap-3 px-4 py-3 transition-all duration-300 mx-2',
            item.section === activeSection
              ? 'bg-white dark:bg-slate-900 text-primary shadow-sm rounded-lg font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800 font-medium rounded-lg'
          ]"
        >
          <component :is="item.icon" class="h-5 w-5" />
          <span class="flex-1">{{ item.label }}</span>
          <span
            v-if="item.section === 'leads' && notificationCount > 0"
            class="rounded-full bg-error px-2 py-0.5 text-[11px] font-bold text-on-error"
          >
            {{ notificationCount }}
          </span>
        </NuxtLink>
      </nav>

      <div class="mt-auto border-t border-outline-variant/10 pt-4 space-y-4 px-6 mb-4">
        <div class="rounded-xl border border-outline-variant/10 bg-surface-container-low p-4">
          <div class="flex items-center justify-between mb-3">
            <p class="text-xs font-bold text-on-surface">Live Queue</p>
            <BellDot class="h-4 w-4 text-outline" />
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div class="bg-surface p-2 rounded-lg text-center border border-outline-variant/10">
              <p class="text-[10px] font-bold text-outline uppercase">Open</p>
              <p class="text-sm font-black mt-1">{{ openLeadCount }}</p>
            </div>
            <div class="bg-surface p-2 rounded-lg text-center border border-outline-variant/10">
              <p class="text-[10px] font-bold text-outline uppercase">Today</p>
              <p class="text-sm font-black mt-1">{{ todayCount }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>
