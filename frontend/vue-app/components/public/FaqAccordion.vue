<script setup lang="ts">
import { ref } from "vue";
import { Minus, Plus } from "lucide-vue-next";
import type { FaqItem } from "~/data/site-content";

defineProps<{
  items: FaqItem[];
}>();

const openIndex = ref(0);
</script>

<template>
  <div class="space-y-3">
    <article
      v-for="(item, index) in items"
      :key="item.question"
      class="overflow-hidden rounded-[1.5rem] border border-white/[0.08] bg-white/5"
    >
      <button
        type="button"
        class="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
        @click="openIndex = openIndex === index ? -1 : index"
      >
        <span class="text-base font-semibold text-white">
          {{ item.question }}
        </span>
        <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-cobalt">
          <Minus v-if="openIndex === index" class="h-4 w-4" />
          <Plus v-else class="h-4 w-4" />
        </span>
      </button>

      <transition name="accordion">
        <div v-if="openIndex === index">
          <p class="px-5 pb-5 text-sm leading-7 text-slate-300">
            {{ item.answer }}
          </p>
        </div>
      </transition>
    </article>
  </div>
</template>

<style scoped>
.accordion-enter-active,
.accordion-leave-active {
  transition: all 0.24s ease-out;
}

.accordion-enter-from,
.accordion-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
