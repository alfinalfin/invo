<script setup lang="ts">
import { CreditCard, Receipt, FilePlus } from "lucide-vue-next";
import { formatCurrency } from "~/lib/crm";
</script>

<template>
  <div class="animate-in fade-in duration-500 w-full">
    <!-- Page Header -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
      <div>
        <h1 class="text-3xl font-black tracking-tight text-[var(--text-primary)] mb-2">Payment Generation</h1>
        <p class="text-sm font-medium text-[var(--text-muted)]">Generate invoices and payment links for your converted leads.</p>
      </div>
      <div class="flex items-center gap-3">
        <button class="px-5 py-2.5 bg-[var(--accent)] text-white font-bold rounded-2xl hover:-translate-y-0.5 transition-all shadow-lg hover:shadow-xl flex items-center gap-2">
          <FilePlus class="w-4 h-4" />
          New Invoice
        </button>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
      <div class="surface-card p-6 rounded-3xl group hover-lift">
        <p class="text-[11px] font-black tracking-widest text-[var(--text-muted)] uppercase mb-2">Outstanding</p>
        <div class="flex items-end gap-3 text-[var(--text-primary)] font-black text-3xl">
          {{ formatCurrency(0) }}
        </div>
      </div>
      <div class="surface-card p-6 rounded-3xl group hover-lift">
        <p class="text-[11px] font-black tracking-widest text-[var(--text-muted)] uppercase mb-2">Collected (30d)</p>
        <div class="flex items-end gap-3 text-[var(--success)] font-black text-3xl">
          {{ formatCurrency(0) }}
        </div>
      </div>
      <div class="surface-card p-6 rounded-3xl group hover-lift border-b-4 border-[var(--accent)]">
        <p class="text-[11px] font-black tracking-widest text-[var(--text-muted)] uppercase mb-2">Total Invoices</p>
        <div class="flex items-end gap-3 text-gradient-primary font-black text-3xl">
          0
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div class="surface-card p-12 rounded-3xl flex flex-col items-center justify-center text-center border-dashed border-2 bg-transparent mt-4 shadow-none">
      <div class="w-16 h-16 rounded-2xl bg-[var(--accent-soft)] flex items-center justify-center mb-6">
        <Receipt class="w-8 h-8 text-[var(--accent)]" />
      </div>
      <h3 class="text-xl font-black text-[var(--text-primary)] mb-2">No Payments Generated</h3>
      <p class="text-sm font-medium text-[var(--text-muted)] max-w-sm mb-6">Create your first invoice to get a shareable payment link for your client.</p>
      <button class="px-6 py-3 bg-[var(--surface-contrast)] text-[var(--page-bg)] font-black rounded-2xl hover-lift">
        Generate Payment Link
      </button>
    </div>
  </div>
</template>
