<script setup lang="ts">
import { computed } from "vue";
import { Bell, Zap, Search, HelpCircle, Settings, MoonStar, SunMedium } from "lucide-vue-next";

const props = defineProps<{
  searchValue: string;
  notificationCount: number;
  isDarkMode: boolean;
  displayName: string;
  displayEmail: string;
  openLeadCount?: number;
  todayCount?: number;
}>();

const emit = defineEmits<{
  "update:searchValue": [value: string];
  "notification-click": [];
  "theme-toggle": [];
}>();

const initials = computed(() =>
  props.displayName
    .split(" ")
    .map((value) => value[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase(),
);
</script>

<template>
  <header class="fixed top-0 left-0 w-full z-50 h-[88px] flex justify-between items-center px-6 transition-all bg-[var(--page-bg)]/80 backdrop-blur-xl border-b border-[var(--border-color)]">
    <div class="flex items-center gap-4 w-64 lg:w-[280px]">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-lg shadow-[var(--accent-soft)]">
          <Zap class="text-white w-5 h-5 fill-white" />
        </div>
        <span class="text-2xl font-extrabold tracking-tight section-heading">InvoCRM</span>
      </div>
    </div>

    <div class="flex-1 flex justify-center ml-8 max-w-xl">
      <div class="hidden md:flex items-center bg-[var(--surface-primary)] border border-[var(--border-color)] rounded-full px-5 py-2.5 gap-3 w-full max-w-2xl shadow-sm focus-within:ring-2 focus-within:ring-[var(--border-strong)] transition-all">
        <Search class="text-[var(--text-muted)] w-5 h-5" />
        <input 
          :value="searchValue"
          @input="emit('update:searchValue', ($event.target as HTMLInputElement).value)"
          class="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-[var(--text-muted)] text-[var(--text-primary)] outline-none font-medium" 
          placeholder="Search AI intelligence, contacts, or datasets..." 
          type="text" 
        />
      </div>
    </div>

    <div class="flex items-center gap-4">
      <!-- Live Queue Mini Widget -->
      <div class="hidden xl:flex items-center gap-2 bg-[var(--surface-primary)] border border-[var(--border-color)] p-1 rounded-full shadow-sm">
        <div class="flex items-center gap-1.5 px-3 py-1 rounded-full">
          <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
          <span class="text-[10px] font-black tracking-widest text-outline uppercase">Open:</span>
          <span class="text-sm font-black text-amber-600 dark:text-amber-400">{{ openLeadCount ?? 0 }}</span>
        </div>
        <div class="w-px h-4 bg-[var(--border-color)]"></div>
        <div class="flex items-center gap-1.5 px-3 py-1 bg-[var(--accent-soft)] rounded-full">
          <span class="text-[10px] font-black tracking-widest text-[var(--accent)] uppercase">Today:</span>
          <span class="text-sm font-black text-[var(--accent-strong)]">{{ todayCount ?? 0 }}</span>
        </div>
      </div>

      <div class="flex items-center gap-1 bg-[var(--surface-primary)] border border-[var(--border-color)] p-1 rounded-full shadow-sm">
        <button 
          @click="emit('theme-toggle')"
          class="p-2 text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)] rounded-full transition-colors duration-300"
        >
          <SunMedium v-if="isDarkMode" class="w-5 h-5" />
          <MoonStar v-else class="w-5 h-5" />
        </button>      
        <button 
          @click="emit('notification-click')"
          class="relative p-2 text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)] rounded-full transition-colors duration-300"
        >
          <Bell class="w-5 h-5" />
          <span
            v-if="notificationCount > 0"
            class="absolute top-1 right-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-[var(--danger)] px-1 text-[10px] font-bold text-white shadow-md shadow-[var(--danger)]/30"
          >
            {{ notificationCount }}
          </span>
        </button>
        <button class="hidden lg:block p-2 text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)] rounded-full transition-colors duration-300">
          <HelpCircle class="w-5 h-5" />
        </button>
        <button class="hidden lg:block p-2 text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)] rounded-full transition-colors duration-300">
          <Settings class="w-5 h-5" />
        </button>
      </div>
      
      <div class="w-10 h-10 rounded-full border-2 border-[var(--border-strong)] shadow-lg flex items-center justify-center bg-gradient-to-tr from-[var(--surface-primary)] to-[var(--surface-secondary)] text-[var(--accent-strong)] text-sm font-black hover-lift cursor-pointer">
        {{ initials }}
      </div>
    </div>
  </header>
</template>
