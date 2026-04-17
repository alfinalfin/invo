<template>
  <div class="space-y-6">
    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div
        v-for="index in 4"
        :key="index"
        class="surface-card h-[162px] p-6"
      >
        <div class="skeleton-bar h-4 w-28" />
        <div class="skeleton-bar mt-6 h-10 w-24" />
        <div class="skeleton-bar mt-10 h-3 w-32" />
      </div>
    </div>

    <div class="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
      <div class="surface-card min-h-[380px] p-6">
        <div class="skeleton-bar h-4 w-36" />
        <div class="skeleton-bar mt-4 h-3 w-52" />
        <div class="mt-10 grid h-[240px] grid-cols-8 items-end gap-3">
          <div
            v-for="index in 8"
            :key="index"
            class="skeleton-bar rounded-[22px]"
            :style="{ height: `${120 + ((index - 1) % 4) * 24}px` }"
          />
        </div>
      </div>

      <div class="surface-card min-h-[380px] p-6">
        <div class="skeleton-bar h-4 w-28" />
        <div class="skeleton-bar mt-4 h-3 w-44" />
        <div class="mt-8 space-y-4">
          <div
            v-for="index in 5"
            :key="index"
            class="surface-card rounded-[22px] p-4 shadow-none"
          >
            <div class="skeleton-bar h-4 w-32" />
            <div class="skeleton-bar mt-3 h-3 w-44" />
          </div>
        </div>
      </div>
    </div>

    <div class="surface-card overflow-hidden p-6">
      <div class="skeleton-bar h-4 w-28" />
      <div class="mt-6 space-y-4">
        <div
          v-for="row in 6"
          :key="row"
          class="grid gap-3 border-b border-[var(--border-color)] pb-4 last:border-none last:pb-0 md:grid-cols-6"
        >
          <div
            v-for="cell in 6"
            :key="`${row}-${cell}`"
            class="skeleton-bar h-4 w-full"
          />
        </div>
      </div>
    </div>
  </div>
</template>
