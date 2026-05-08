<script setup lang="ts">
import {
  BellDot,
  ChartColumnIncreasing,
  CheckCircle,
  FileText,
  LayoutDashboard,
  Search,
  Settings,
  ShieldCheck,
  Truck,
  UsersRound,
  Zap,
  Plus,
  CreditCard
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
  { href: "/live-tracking", label: "Live Tracking", section: "live_tracking", icon: Truck },
  { href: "/payment-generation", label: "Payment Generation", section: "payment_generation", icon: CreditCard },
  { href: "/driver-verification", label: "Driver Verification", section: "driver_verification", icon: ShieldCheck },
  { href: "/ai-leads", label: "B2B Lead Engine", section: "ai_leads", icon: Zap },
  {
    href: "/analytics",
    label: "Analytics",
    section: "analytics",
    icon: ChartColumnIncreasing,
  },
] as const;
</script>

<template>
  <aside class="fixed hidden lg:flex left-0 top-0 h-screen w-[280px] pt-24 pb-8 flex-col z-40 bg-[length:200%_200%] transition-all" style="background: var(--sidebar-bg); border-right: 1px solid var(--border-color);">
    <div class="flex flex-col h-full py-4 gap-2">
      <div v-if="activeSection === 'ai_leads'" class="px-6 mb-6">
          <button @click="router.push({ query: { ...route.query, scrape: 'true' } })" class="w-full py-3.5 px-4 bg-gradient-primary rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-[var(--accent-soft)] hover-lift">
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
            'sidebar-link mx-4 my-1',
            item.section === activeSection ? 'sidebar-link-active relative' : ''
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

    </div>
  </aside>
</template>
