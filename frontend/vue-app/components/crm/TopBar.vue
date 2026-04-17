<script setup lang="ts">
import { computed } from "vue";
import { Bell, Zap, Search, HelpCircle, Settings, MoonStar, SunMedium } from "lucide-vue-next";

const props = defineProps<{
  searchValue: string;
  notificationCount: number;
  isDarkMode: boolean;
  displayName: string;
  displayEmail: string;
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
  <header class="fixed top-0 left-0 w-full z-50 h-16 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-xl flex justify-between items-center px-6">
    <div class="flex items-center gap-4">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <Zap class="text-white w-5 h-5 fill-white" />
        </div>
        <span class="text-2xl font-black tracking-tighter text-slate-900 dark:text-white">InvoAura CRM</span>
      </div>
      
      <div class="hidden md:flex ml-8 items-center bg-surface-container-low rounded-full px-4 py-1.5 gap-2 w-96 border border-outline-variant/10">
        <Search class="text-outline w-4 h-4" />
        <input 
          :value="searchValue"
          @input="emit('update:searchValue', ($event.target as HTMLInputElement).value)"
          class="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-outline text-on-surface outline-none" 
          placeholder="Search across logistics intelligence..." 
          type="text" 
        />
      </div>
    </div>

    <div class="flex items-center gap-3">
      <button 
        @click="emit('theme-toggle')"
        class="p-2 text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 rounded-full transition-colors duration-200"
      >
        <SunMedium v-if="isDarkMode" class="w-5 h-5" />
        <MoonStar v-else class="w-5 h-5" />
      </button>      
      <button 
        @click="emit('notification-click')"
        class="relative p-2 text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 rounded-full transition-colors duration-200"
      >
        <Bell class="w-5 h-5" />
        <span
          v-if="notificationCount > 0"
          class="absolute top-1 right-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold text-on-error"
        >
          {{ notificationCount }}
        </span>
      </button>
      <button class="p-2 text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 rounded-full transition-colors duration-200">
        <HelpCircle class="w-5 h-5" />
      </button>
      <button class="p-2 text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 rounded-full transition-colors duration-200">
        <Settings class="w-5 h-5" />
      </button>
      
      <div class="w-px h-6 bg-outline-variant/30 mx-2"></div>
      
      <div class="w-8 h-8 rounded-full border-2 border-white shadow-sm flex items-center justify-center bg-primary-container text-on-primary-container text-xs font-bold">
        {{ initials }}
      </div>
    </div>
  </header>
</template>
