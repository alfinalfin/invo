<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { doc, getDoc } from "firebase/firestore";
import { ref as databaseRef, get } from "firebase/database";
import { useFirebaseServices } from "~/composables/useFirebaseServices";
import { mapFirestoreLead, mapRealtimeLeads } from "~/lib/firebase-leads";
import PodDocument from "~/components/crm/PodDocument.vue";

const route = useRoute();
const id = route.params.id as string;

const { db, rtdb, leadsCollectionName, realtimeLeadsPath, hasRealtimeDatabaseConfig } = useFirebaseServices();

const lead = ref<any>(null);
const loading = ref(true);
const error = ref<string | null>(null);

onMounted(async () => {
  if (!id) return;

  try {
    if (rtdb.value && hasRealtimeDatabaseConfig.value) {
      const snapshot = await get(databaseRef(rtdb.value, `${realtimeLeadsPath.value}/${id}`));
      if (snapshot.exists()) {
        const mapped = mapRealtimeLeads({ [id]: snapshot.val() });
        lead.value = mapped[0] || null;
      } else {
        error.value = "POD not found.";
      }
    } else if (db.value) {
      const snapshot = await getDoc(doc(db.value, leadsCollectionName.value, id));
      if (snapshot.exists()) {
        lead.value = mapFirestoreLead(snapshot as any);
      } else {
        error.value = "POD not found.";
      }
    } else {
      error.value = "Database not configured.";
    }
  } catch (err: any) {
    error.value = err.message || "Failed to load POD details. You may need to be logged in.";
  } finally {
    loading.value = false;
  }
});

const printPdf = () => {
  window.print();
};
</script>

<template>
  <div>
    <div v-if="loading" class="flex h-screen items-center justify-center bg-slate-100">
       <p class="text-slate-500 font-medium">Loading Document...</p>
    </div>

    <div v-else-if="error || !lead" class="flex h-screen items-center justify-center bg-slate-100">
       <div class="bg-white p-8 rounded-2xl shadow-sm text-center">
          <p class="text-red-500 font-medium mb-2">Error Loading Document</p>
          <p class="text-slate-500 text-sm">{{ error }}</p>
       </div>
    </div>

    <div v-else class="min-h-screen bg-slate-100 sm:p-12 print:p-0 print:bg-white text-black font-sans">
       <div class="max-w-[816px] mx-auto mb-6 flex justify-end print:hidden">
          <button 
            @click="printPdf"
            class="bg-black text-white px-5 py-2.5 rounded-full font-semibold text-sm transition hover:bg-black/80"
          >
            Print PDF
          </button>
       </div>
       <PodDocument 
         :lead="lead" 
         :podData="{
            podDeliveryDate: lead.podDeliveryDate,
            podDriverName: lead.podDriverName,
            podVehicleReg: lead.podVehicleReg,
            podPieces: lead.podPieces,
            podWeight: lead.podWeight,
            podDimensions: lead.podDimensions,
            podGoodsDescription: lead.podGoodsDescription,
            podNotes: lead.podNotes,
         }"
       />
    </div>
  </div>
</template>
