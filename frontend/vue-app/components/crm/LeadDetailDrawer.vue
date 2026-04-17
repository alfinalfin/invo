<script setup lang="ts">
import { ref, watch } from "vue";
import {
  Mail,
  MapPin,
  MessageSquareText,
  PhoneCall,
  Sparkles,
  UserRound,
  X,
} from "lucide-vue-next";
import {
  formatCurrency,
  formatDate,
  formatPhoneForWhatsApp,
  leadStatuses,
  type LeadRecord,
  type LeadStatus,
} from "~/lib/crm";

const props = defineProps<{
  lead: LeadRecord | null;
  open: boolean;
  saving: boolean;
}>();

const emit = defineEmits<{
  close: [];
  save: [
    payload: {
      leadId: string;
      status: LeadStatus;
      notes: string;
      lastContactedAt?: string;
      estimatedValue?: number;
      podDeliveryDate?: string;
      podDriverName?: string;
      podVehicleReg?: string;
      podPieces?: string;
      podWeight?: string;
      podDimensions?: string;
      podGoodsDescription?: string;
      podNotes?: string;
    },
  ];
}>();

const draftStatus = ref<LeadStatus>("New");
const draftNotes = ref("");
const podDraft = ref({
  podDeliveryDate: "",
  podDriverName: "",
  podVehicleReg: "",
  podPieces: "",
  podWeight: "",
  podDimensions: "",
  podGoodsDescription: "",
  podNotes: "",
});

const isConversionModalOpen = ref(false);
const quoteAmount = ref<number | "">("");

watch(
  () => props.lead,
  (lead) => {
    if (!lead) {
      return;
    }

    draftStatus.value = lead.status;
    draftNotes.value = lead.notes;
    podDraft.value = {
      podDeliveryDate: lead.podDeliveryDate || "",
      podDriverName: lead.podDriverName || "",
      podVehicleReg: lead.podVehicleReg || "",
      podPieces: lead.podPieces || "",
      podWeight: lead.podWeight || "",
      podDimensions: lead.podDimensions || "",
      podGoodsDescription: lead.podGoodsDescription || "",
      podNotes: lead.podNotes || "",
    };
  },
  { immediate: true },
);

function handleSave(nextStatus = draftStatus.value, finalValue?: number) {
  if (!props.lead) {
    return;
  }

  emit("save", {
    leadId: props.lead.id,
    status: nextStatus,
    notes: draftNotes.value,
    lastContactedAt:
      nextStatus === "Contacted" || nextStatus === "Converted"
        ? new Date().toISOString()
        : props.lead.lastContactedAt,
    ...(finalValue !== undefined ? { estimatedValue: finalValue } : {}),
    ...podDraft.value,
  });
}

function handleConvertClick() {
  quoteAmount.value = props.lead?.estimatedValue || "";
  isConversionModalOpen.value = true;
}

function confirmConversion() {
  if (typeof quoteAmount.value !== "number" || quoteAmount.value < 0) {
    window.alert("Please enter a valid quote amount.");
    return;
  }
  draftStatus.value = "Converted";
  handleSave("Converted", quoteAmount.value);
  isConversionModalOpen.value = false;
}
</script>

<template>
  <transition name="fade">
    <button
      v-if="open && lead"
      type="button"
      aria-label="Close lead detail"
      class="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-sm"
      @click="emit('close')"
    />
  </transition>

  <transition name="slide">
    <aside
      v-if="open && lead"
      class="fixed right-3 top-3 z-50 flex h-[calc(100vh-1.5rem)] w-[min(560px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-[32px] border border-[var(--border-color)] bg-[var(--surface-secondary)] shadow-[var(--shadow-strong)]"
    >
      <div class="shrink-0 flex items-start justify-between gap-4 border-b border-[var(--border-color)] p-6">
        <div>
          <p class="soft-pill">Lead detail</p>
          <h2 class="mt-4 text-2xl font-semibold text-[var(--text-primary)]">
            {{ lead.name }}
          </h2>
          <p class="mt-2 text-sm text-muted">{{ lead.company }} - {{ lead.id }}</p>
        </div>
        <button
          type="button"
          class="rounded-2xl border border-[var(--border-color)] p-3 text-[var(--text-primary)]"
          @click="emit('close')"
        >
          <X class="h-4 w-4" />
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-6">
        <div class="grid gap-6">
          <div class="surface-card rounded-[28px] p-5 shadow-none">
            <div class="flex flex-wrap items-center gap-2">
              <CrmStatusBadge :status="draftStatus" />
              <CrmPriorityBadge :priority="lead.priority" />
              <span
                v-for="tag in lead.tags"
                :key="tag"
                class="muted-pill"
              >
                {{ tag }}
              </span>
            </div>

            <div class="mt-5 grid gap-4 sm:grid-cols-2">
              <div class="rounded-[24px] bg-black/[0.03] p-4 dark:bg-white/[0.03]">
                <p class="text-xs uppercase tracking-[0.24em] text-muted">
                  Estimated value
                </p>
                <p class="mt-3 text-2xl font-semibold text-[var(--text-primary)]">
                  {{ formatCurrency(lead.estimatedValue) }}
                </p>
              </div>
              <div class="rounded-[24px] bg-black/[0.03] p-4 dark:bg-white/[0.03]">
                <p class="text-xs uppercase tracking-[0.24em] text-muted">
                  Assigned to
                </p>
                <p class="mt-3 text-2xl font-semibold text-[var(--text-primary)]">
                  {{ lead.assignedTo }}
                </p>
              </div>
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <a
              :href="`tel:${formatPhoneForWhatsApp(lead.phone)}`"
              class="surface-card flex items-center gap-3 rounded-[24px] p-4 shadow-none"
            >
              <PhoneCall class="h-5 w-5 text-[var(--accent)]" />
              <div>
                <p class="text-sm font-semibold text-[var(--text-primary)]">
                  Call lead
                </p>
                <p class="text-sm text-muted">{{ lead.phone }}</p>
              </div>
            </a>
            <a
              :href="`mailto:${lead.email}`"
              class="surface-card flex items-center gap-3 rounded-[24px] p-4 shadow-none"
            >
              <Mail class="h-5 w-5 text-[var(--accent)]" />
              <div>
                <p class="text-sm font-semibold text-[var(--text-primary)]">
                  Email lead
                </p>
                <p class="text-sm text-muted">{{ lead.email }}</p>
              </div>
            </a>
          </div>

          <div class="surface-card rounded-[28px] p-5 shadow-none">
            <div class="flex items-center gap-3">
              <UserRound class="h-5 w-5 text-[var(--accent)]" />
              <div>
                <p class="text-sm font-semibold text-[var(--text-primary)]">
                  Contact details
                </p>
                <p class="text-sm text-muted">
                  Created {{ formatDate(lead.createdAt) }}
                </p>
              </div>
            </div>

            <div class="mt-5 space-y-4">
              <div>
                <p class="text-xs uppercase tracking-[0.24em] text-muted">
                  Contact
                </p>
                <p class="mt-2 text-sm leading-7 text-secondary">
                  {{ lead.name }} - {{ lead.email }} - {{ lead.phone }}
                </p>
              </div>
              <div>
                <p class="text-xs uppercase tracking-[0.24em] text-muted">Route</p>
                <p class="mt-2 text-sm leading-7 text-secondary">
                  {{ lead.routeLabel }}
                </p>
              </div>
              <div v-if="lead.lastContactedAt">
                <p class="text-xs uppercase tracking-[0.24em] text-muted">
                  Last contacted
                </p>
                <p class="mt-2 text-sm leading-7 text-secondary">
                  {{ formatDate(lead.lastContactedAt) }}
                </p>
              </div>
            </div>
          </div>

          <div class="surface-card rounded-[28px] p-5 shadow-none">
            <div class="flex items-center gap-3">
              <MapPin class="h-5 w-5 text-[var(--accent)]" />
              <div>
                <p class="text-sm font-semibold text-[var(--text-primary)]">
                  Shipment details
                </p>
                <p class="text-sm text-muted">
                  Route and load requirements
                </p>
              </div>
            </div>

            <div class="mt-5 grid gap-4">
              <div class="rounded-[24px] bg-black/[0.03] p-4 dark:bg-white/[0.03]">
                <p class="text-xs uppercase tracking-[0.24em] text-muted">Pickup</p>
                <p class="mt-2 text-sm leading-7 text-secondary">
                  {{ lead.pickupAddress }}
                </p>
                <p v-if="lead.collectionTime" class="mt-1 text-xs text-muted">
                  Collection: {{ lead.collectionTime }}
                </p>
              </div>
              <div class="rounded-[24px] bg-black/[0.03] p-4 dark:bg-white/[0.03]">
                <p class="text-xs uppercase tracking-[0.24em] text-muted">
                  Delivery
                </p>
                <p class="mt-2 text-sm leading-7 text-secondary">
                  {{ lead.deliveryAddress }}
                </p>
              </div>
              <div v-if="lead.goodsDescription || lead.weightDimensions || lead.vehicleType" class="rounded-[24px] bg-black/[0.03] p-4 dark:bg-white/[0.03]">
                <p class="text-xs uppercase tracking-[0.24em] text-muted">
                  Load Details
                </p>
                <div class="mt-2 space-y-1">
                  <p v-if="lead.goodsDescription" class="text-sm leading-7 text-secondary">
                    <span class="text-muted">Goods:</span> {{ lead.goodsDescription }}
                  </p>
                  <p v-if="lead.weightDimensions" class="text-sm leading-7 text-secondary">
                    <span class="text-muted">Size:</span> {{ lead.weightDimensions }}
                  </p>
                  <p v-if="lead.vehicleType" class="text-sm leading-7 text-secondary">
                    <span class="text-muted">Vehicle:</span> {{ lead.vehicleType }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div class="surface-card rounded-[28px] p-5 shadow-none">
            <div class="flex items-center gap-3">
              <MessageSquareText class="h-5 w-5 text-[var(--accent)]" />
              <div>
                <p class="text-sm font-semibold text-[var(--text-primary)]">
                  Request and notes
                </p>
                <p class="text-sm text-muted">
                  Turn raw inquiry detail into an actionable next step
                </p>
              </div>
            </div>

            <div class="mt-5 space-y-5">
              <div class="rounded-[24px] bg-black/[0.03] p-4 dark:bg-white/[0.03]">
                <p class="text-xs uppercase tracking-[0.24em] text-muted">
                  Customer request
                </p>
                <p class="mt-2 text-sm leading-7 text-secondary">
                  {{ lead.message }}
                </p>
                <div v-if="lead.customerNotes" class="mt-3 border-t border-[var(--border-color)] pt-3">
                  <p class="text-xs uppercase tracking-[0.24em] text-muted">
                    Client Notes
                  </p>
                  <p class="mt-1 text-sm leading-7 text-secondary">
                    {{ lead.customerNotes }}
                  </p>
                </div>
              </div>

              <div>
                <label
                  for="lead-status"
                  class="text-xs font-semibold uppercase tracking-[0.24em] text-muted"
                >
                  Update status
                </label>
                <select
                  id="lead-status"
                  v-model="draftStatus"
                  class="mt-2 w-full rounded-[20px] border border-[var(--border-color)] bg-transparent px-4 py-3 text-sm text-[var(--text-primary)] outline-none"
                >
                  <option v-for="status in leadStatuses" :key="status" :value="status">
                    {{ status }}
                  </option>
                </select>
              </div>

              <div>
                <label
                  for="lead-notes"
                  class="text-xs font-semibold uppercase tracking-[0.24em] text-muted"
                >
                  Internal notes
                </label>
                <textarea
                  id="lead-notes"
                  v-model="draftNotes"
                  rows="6"
                  class="mt-2 w-full rounded-[24px] border border-[var(--border-color)] bg-transparent px-4 py-3 text-sm leading-7 text-[var(--text-primary)] outline-none"
                />
              </div>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <button
              type="button"
              class="inline-flex items-center justify-center gap-2 rounded-[22px] border border-[var(--border-color)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)]"
              @click="
                draftStatus = 'Contacted';
                handleSave('Contacted');
              "
            >
              <Sparkles class="h-4 w-4" />
              Mark contacted
            </button>

            <button
              type="button"
              class="inline-flex items-center justify-center gap-2 rounded-[22px] border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-700 dark:text-emerald-300"
              @click="handleConvertClick"
            >
              Convert lead
            </button>

            <button
              type="button"
              :disabled="saving"
              class="inline-flex flex-1 items-center justify-center gap-2 rounded-[22px] bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-70"
              @click="handleSave()"
            >
              {{ saving ? "Saving..." : "Save changes" }}
            </button>
          </div>
        </div>
      </div>
    </aside>
  </transition>

  <transition name="fade">
    <div
      v-if="isConversionModalOpen"
      class="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
    >
      <div 
        class="w-full max-w-sm rounded-[32px] border border-[var(--border-color)] bg-[var(--surface-secondary)] p-6 shadow-[var(--shadow-strong)]"
        @click.stop
      >
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-semibold text-[var(--text-primary)]">Convert Lead</h3>
          <button 
            type="button"
            class="rounded-full p-2 text-muted hover:bg-black/5 dark:hover:bg-white/5"
            @click="isConversionModalOpen = false"
          >
            <X class="h-4 w-4" />
          </button>
        </div>
        <p class="text-sm text-secondary mb-6">
          Enter the final quote amount to convert this lead.
        </p>
        
        <div class="space-y-2 mb-8">
          <label class="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
            Quote Amount (£)
          </label>
          <div class="relative">
            <span class="absolute left-4 top-1/2 -translate-y-1/2 text-muted">£</span>
            <input
              v-model.number="quoteAmount"
              type="number"
              min="0"
              placeholder="0.00"
              class="w-full rounded-[24px] border border-[var(--border-color)] bg-transparent py-3 pl-8 pr-4 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
              @keyup.enter="confirmConversion"
            />
          </div>
        </div>

        <div class="flex flex-col gap-3">
          <button
            type="button"
            class="w-full rounded-[24px] bg-[var(--accent)] py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
            @click="confirmConversion"
          >
            Submit & Convert
          </button>
          <button
            type="button"
            class="w-full rounded-[24px] border border-[var(--border-color)] py-3 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-black/5 dark:hover:bg-white/5"
            @click="isConversionModalOpen = false"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active,
.slide-enter-active,
.slide-leave-active {
  transition: all 0.2s ease-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateX(40px);
}
</style>
