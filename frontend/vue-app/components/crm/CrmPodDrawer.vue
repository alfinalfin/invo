<script setup lang="ts">
import { ref, watch, computed } from "vue";
import type { LeadRecord, LeadStatus } from "~/lib/crm";

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
      podDeliveryDate?: string;
      podDriverName?: string;
      podVehicleReg?: string;
      podPieces?: string;
      podWeight?: string;
      podDimensions?: string;
      podGoodsDescription?: string;
      podNotes?: string;
      podGoodsItems?: string;
    },
  ];
}>();

const podDraft = ref({
  refId: "",
  clientName: "",
  collectionDetails: "",
  deliveryDetails: "",
  podDeliveryDate: "",
  podDriverName: "",
  podVehicleReg: "",
  podPieces: "",
  podWeight: "",
  podDimensions: "",
  podGoodsDescription: "",
  podNotes: "",
});

const goodsItems = ref<{pieces: string, weight: string, dimensions: string}[]>([]);

const showToastBar = ref(false);
const toastMsg = ref("");

  watch(
  () => props.lead,
  (lead) => {
    if (!lead) return;
    podDraft.value = {
      refId: lead.id || "",
      clientName: lead.company || lead.name || "",
      collectionDetails: lead.pickupAddress || "",
      deliveryDetails: lead.deliveryAddress || "",
      podDeliveryDate: lead.podDeliveryDate || "",
      podDriverName: lead.podDriverName || "",
      podVehicleReg: lead.podVehicleReg || "",
      podPieces: lead.podPieces || (lead as any).pieces || "",
      podWeight: lead.podWeight || "",
      podDimensions: lead.podDimensions || (lead as any).weightDimensions || "",
      podGoodsDescription: lead.podGoodsDescription || (lead as any).goodsDescription || "",
      podNotes: lead.podNotes || "",
    };
    try {
      if ((lead as any).podGoodsItems) {
        goodsItems.value = JSON.parse((lead as any).podGoodsItems);
      } else {
        goodsItems.value = [];
      }
    } catch(e) { goodsItems.value = []; }
  },
  { immediate: true },
);

function fmtDate(v: string) {
  if (!v) return '—';
  const p = v.split('-');
  if (p.length === 3) return p[2] + '/' + p[1] + '/' + p[0];
  return v;
}

function today() {
  const d = new Date();
  return d.getDate().toString().padStart(2, '0') + '/' + (d.getMonth() + 1).toString().padStart(2, '0') + '/' + d.getFullYear();
}

function showToast(msg: string) {
  toastMsg.value = msg;
  showToastBar.value = true;
  setTimeout(() => {
    showToastBar.value = false;
  }, 3200);
}

function handleSave() {
  if (!props.lead) return;
  emit("save", {
    leadId: props.lead.id,
    status: props.lead.status,
    notes: props.lead.notes,
    podDeliveryDate: podDraft.value.podDeliveryDate,
    podDriverName: podDraft.value.podDriverName,
    podVehicleReg: podDraft.value.podVehicleReg,
    podPieces: podDraft.value.podPieces,
    podWeight: podDraft.value.podWeight,
    podDimensions: podDraft.value.podDimensions,
    podGoodsDescription: podDraft.value.podGoodsDescription,
    podNotes: podDraft.value.podNotes,
    podGoodsItems: JSON.stringify(goodsItems.value),
  });
}

function saveDraft() {
  handleSave();
  showToast('Draft saved successfully.');
}

function generatePOD() {
  handleSave();
  const slug = podDraft.value.refId.replace(/[^a-z0-9]/gi, '-').toLowerCase() || 'draft';
  const idValue = props.lead?.id || slug;
  showToast(`POD link ready: ${window.location.host}/pod/${idValue}`);
  navigator.clipboard.writeText(`${window.location.origin}/pod/${idValue}`);
}

function generatePdf() {
  handleSave();
  const element = document.querySelector('.pod-doc') as HTMLElement;
  if (!element) return;
  showToast('Starting PDF Download...');
  const opt = {
    margin: [0.2, 0.2, 0.2, 0.2],
    filename: `POD-${podDraft.value.refId || 'draft'}.pdf`,
    image: { type: 'jpeg', quality: 0.95 },
    html2canvas: { scale: 1.5, useCORS: true, logging: false },
    jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
  };
  const w = window as any;
  if (!w.html2pdf) {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    script.onload = () => w.html2pdf().set(opt).from(element).save();
    document.body.appendChild(script);
  } else {
    w.html2pdf().set(opt).from(element).save();
  }
}

function clearAll() {
  podDraft.value = {
    refId: "", clientName: "", collectionDetails: "", deliveryDetails: "",
    podDeliveryDate: "", podDriverName: "", podVehicleReg: "",
    podPieces: "", podWeight: "", podDimensions: "",
    podGoodsDescription: "", podNotes: "",
  };
  goodsItems.value = [];
  showToast('Form cleared.');
}
</script>

<template>
  <transition name="fade">
    <div v-if="open" class="shell overflow-y-auto h-full">
      
      <div class="topbar print:hidden">
        <div class="brand">
          <div class="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
          </div>
          <div class="brand-name ml-2">InvoAura CRM <span class="brand-tag">POD</span></div>
        </div>
        <div class="topbar-actions flex items-center gap-4">
          <span v-if="saving" class="text-sm font-semibold text-[#1a56db] animate-pulse">Saving...</span>
          <button class="tbtn tbtn-ghost" @click="emit('close')">
            Close
          </button>
          <button class="tbtn tbtn-ghost" @click="saveDraft">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1.5 10V7H10.5V10M8.5 1.5H1.5V7H10.5V3L8.5 1.5Z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>
            Save Draft
          </button>
          <button class="tbtn tbtn-primary" @click="generatePdf">
             <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
             Download PDF
          </button>
          <button class="tbtn tbtn-primary" @click="generatePOD">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v7.5M3 6L6 9.5 9 6M1.5 11h9" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            Generate POD Link
          </button>
        </div>
      </div>

      <!-- Toast Bar -->
      <div :class="['toast-bar print:hidden', { 'toast-hidden': !showToastBar }]">
        <span>{{ toastMsg }}</span>
        <button class="toast-x" @click="showToastBar = false">✕</button>
      </div>

      <div class="layout">
        <!-- Form Options Panel -->
        <div class="form-card print:hidden">
          <div class="form-head">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" rx="2.5" stroke="#1a56db" stroke-width="1.3"/><path d="M5 6h6M5 9h4" stroke="#1a56db" stroke-width="1.3" stroke-linecap="round"/></svg>
            <div class="form-head-title">Create POD</div>
            <div class="form-head-pill">Proof of Delivery</div>
          </div>
          <div class="form-body">
            <div class="sec-label">Shipment info</div>
            <div class="row2">
              <div class="field"><label>Reference <span class="req">*</span></label><input type="text" v-model="podDraft.refId" placeholder="SHP-2024-0081" /></div>
              <div class="field"><label>Client Name <span class="req">*</span></label><input type="text" v-model="podDraft.clientName" placeholder="Enter client name" /></div>
            </div>
            <div class="field"><label>Collection Address</label><textarea v-model="podDraft.collectionDetails" rows="2" placeholder="Enter collection address"></textarea></div>
            <div class="field"><label>Delivery Address <span class="req">*</span></label><textarea v-model="podDraft.deliveryDetails" rows="2" placeholder="Enter delivery address"></textarea></div>
            
            <div class="sec-label">Logistics</div>
            <div class="row2">
              <div class="field"><label>Delivery Date</label><input type="date" v-model="podDraft.podDeliveryDate" /></div>
              <div class="field"><label>Driver Name</label><input type="text" v-model="podDraft.podDriverName" placeholder="Enter driver name" /></div>
            </div>
            <div class="row3">
              <div class="field"><label>Vehicle Reg</label><input type="text" v-model="podDraft.podVehicleReg" placeholder="AB12 CDE" /></div>
              <div class="field"><label>Pieces</label><input type="text" v-model="podDraft.podPieces" placeholder="e.g. 5" /></div>
              <div class="field"><label>Weight</label><input type="text" v-model="podDraft.podWeight" placeholder="25 kg" /></div>
            </div>
            <div class="field"><label>Dimensions</label><input type="text" v-model="podDraft.podDimensions" placeholder="120 x 80 x 100 cm" /></div>

            <!-- Line Items directly under Pieces -->
            <div v-for="(item, i) in goodsItems" :key="i" class="item-row">
              <button type="button" class="item-remove" @click="goodsItems.splice(i, 1)">✕</button>
              <div class="field"><label>Pieces</label><input type="text" v-model="item.pieces" placeholder="e.g. 5" /></div>
              <div class="field"><label>Weight</label><input type="text" v-model="item.weight" placeholder="25 kg" /></div>
              <div class="field"><label>Dimensions</label><input type="text" v-model="item.dimensions" placeholder="120x80x100" /></div>
            </div>
            <button class="add-item-btn" @click="goodsItems.push({pieces:'',weight:'',dimensions:''})">+ Add Item</button>
            
            <div class="sec-label">Goods</div>
            <div class="field"><label>Goods Description</label><textarea v-model="podDraft.podGoodsDescription" rows="3" placeholder="Enter description of goods"></textarea></div>
            <div class="field"><label>Notes / Instructions</label><textarea v-model="podDraft.podNotes" rows="2" placeholder="Any additional notes or instructions"></textarea></div>
          </div>
          <div class="form-foot">
            <button class="tbtn tbtn-ghost" @click="clearAll">Clear form</button>
            <button class="tbtn tbtn-primary" @click="generatePdf">Save &amp; Download PDF</button>
            <button class="tbtn tbtn-primary" @click="generatePOD">Generate POD Link</button>
          </div>
        </div>

        <!-- Live Preview Panel -->
        <div class="print-w100">
          <div class="prev-lbl print:hidden">Live Preview</div>
          <div class="pod-doc">
            <div class="pod-head">
              <div class="pod-head-ring1"></div>
              <div class="pod-head-ring2"></div>
              <div class="pod-head-slash"></div>
              <div style="position:relative;z-index:2;">
                <div style="background:transparent;display:flex;align-items:center;margin-bottom:8px;">
                  <div style="background:#fff;border-radius:8px;width:32px;height:32px;display:flex;align-items:center;justify-content:center;margin-right:8px;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a56db" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                  </div>
                  <span style="font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.02em;">InvoAura CRM</span>
                </div>
                <div class="pod-main-title mt-4">Proof of<br>Delivery</div>
                <div class="pod-sub" id="p-issued">ISSUED: {{ today() }}</div>
              </div>
              <div class="pod-head-right">
                <div class="text-[9px] text-[rgba(255,255,255,0.85)] text-right leading-relaxed mb-6 font-mono">
                  <div class="font-bold text-white uppercase tracking-wider mb-1 text-[10px]">InvoAura CRM</div>
                  <div>1 Concourse Way</div>
                  <div>Sheffield</div>
                  <div>S1 2BJ</div>
                  <div>United Kingdom</div>
                  <div class="mt-1 font-bold text-[10px]">020 3773 1185</div>
                </div>
                <div class="pod-ref-lbl">Reference No.</div>
                <div class="pod-ref-val">{{ podDraft.refId || '—' }}</div>
                <div class="pod-status">{{ lead?.status === 'Converted' ? 'READY' : 'PENDING' }}</div>
              </div>
            </div>
            <div class="pod-stripe"></div>
            <div class="pod-body">
              <div>
                <div class="s-head">Addresses</div>
                <div class="addr-grid">
                  <div class="addr-box">
                    <div class="addr-lbl"><span class="lbl-pip"></span>Collected from</div>
                    <div class="addr-val whitespace-pre-wrap">
                      <template v-if="podDraft.collectionDetails">{{ podDraft.collectionDetails }}</template>
                      <span v-else class="empty">&nbsp;</span>
                    </div>
                  </div>
                  <div class="addr-box">
                    <div class="addr-lbl"><span class="lbl-pip"></span>Delivered to</div>
                    <div class="addr-val whitespace-pre-wrap">
                      <template v-if="podDraft.deliveryDetails">{{ podDraft.deliveryDetails }}</template>
                      <span v-else class="empty">&nbsp;</span>
                    </div>
                  </div>
                  <div class="addr-box full">
                    <div class="addr-lbl"><span class="lbl-pip"></span>Client</div>
                    <div class="addr-val mono">
                      <template v-if="podDraft.clientName">{{ podDraft.clientName }}</template>
                      <span v-else class="empty">&nbsp;</span>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <div class="s-head">Logistics</div>
                <div class="chips">
                  <div class="chip"><div class="chip-lbl">Driver</div><div class="chip-val whitespace-pre-wrap truncate">{{ podDraft.podDriverName || '—' }}</div></div>
                  <div class="chip"><div class="chip-lbl">Vehicle</div><div class="chip-val">{{ podDraft.podVehicleReg || '—' }}</div></div>
                  <div class="chip"><div class="chip-lbl">Date</div><div class="chip-val">{{ fmtDate(podDraft.podDeliveryDate) }}</div></div>
                  <div class="chip"><div class="chip-lbl">Pieces</div><div class="chip-val">{{ podDraft.podPieces || '—' }}</div></div>
                  <div class="chip"><div class="chip-lbl">Weight</div><div class="chip-val">{{ podDraft.podWeight || '—' }}</div></div>
                  <div class="chip"><div class="chip-lbl">Dims</div><div class="chip-val whitespace-pre-wrap truncate">{{ podDraft.podDimensions || '—' }}</div></div>
                </div>
                <div v-if="goodsItems.length > 0" class="items-tbl-wrap" style="margin-top:8px;">
                  <table class="items-tbl">
                    <thead><tr><th>Pieces</th><th>Weight</th><th>Dimensions</th></tr></thead>
                    <tbody>
                      <tr v-for="(item, i) in goodsItems" :key="i">
                        <td>{{ item.pieces || '—' }}</td>
                        <td>{{ item.weight || '—' }}</td>
                        <td>{{ item.dimensions || '—' }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div>
                <div class="s-head">Goods</div>
                <div class="desc-box">
                  <div class="desc-lbl">Description</div>
                  <div class="desc-val whitespace-pre-wrap">
                    <template v-if="podDraft.podGoodsDescription">{{ podDraft.podGoodsDescription }}</template>
                    <span v-else class="empty">&nbsp;</span>
                  </div>
                </div>
                <div class="desc-box">
                  <div class="desc-lbl">Notes / Instructions</div>
                  <div class="desc-val whitespace-pre-wrap">
                    <template v-if="podDraft.podNotes">{{ podDraft.podNotes }}</template>
                    <span v-else class="empty">&nbsp;</span>
                  </div>
                </div>
              </div>
              <div>
                <div class="s-head">Signatures</div>
                <div class="sig-grid">
                  <div class="sig-box">
                    <div class="sig-lbl">Driver Signature</div>
                    <div class="sig-line"></div>
                    <div class="sig-name">Name: {{ podDraft.podDriverName || '—' }}</div>
                  </div>
                  <div class="sig-box">
                    <div class="sig-lbl">Recipient Signature</div>
                    <div class="sig-line"></div>
                    <div class="sig-name">Name: _______________</div>
                  </div>
                </div>
              </div>
            </div>
            <div class="pod-foot">
              <span>REF: {{ podDraft.refId || '—' }}</span>
              <span class="pod-foot-brand">InvoAura CRM</span>
              <span>{{ today() }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

.shell { font-family: 'Inter', sans-serif; background: #f0f2f7; min-height: 100vh; padding-bottom: 80px; }

.topbar { background:#fff;border-bottom:1px solid #e2e6ef; padding:12px 28px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap; }
.brand { display:flex;align-items:center;gap:10px; }
.brand-icon { width:36px;height:36px;border-radius:10px;background:#1a56db;display:flex;align-items:center;justify-content:center; }
.brand-name { font-size:15px;font-weight:800;color:#111;letter-spacing:-0.02em; }
.brand-tag { font-size:10px;font-weight:700;letter-spacing:0.1em;color:#1a56db;margin-left:3px; }

.topbar-actions { display:flex;gap:8px;flex-wrap:wrap; }
.tbtn { font-family:'Inter',sans-serif;font-size:12px;font-weight:700;letter-spacing:0.03em;padding:8px 16px;border-radius:8px;cursor:pointer;border:none;display:inline-flex;align-items:center;gap:6px;transition:all 0.15s; }
.tbtn-ghost { background:#f0f2f7;color:#444;border:1px solid #dde2ee; }
.tbtn-ghost:hover { background:#e4e8f3; }
.tbtn-primary { background:#1a56db;color:#fff; }
.tbtn-primary:hover { background:#1446c0; }

.layout { max-width:1240px;margin:28px auto 0;padding:0 24px;display:grid;grid-template-columns:1fr 1fr;gap:28px;align-items:start; }
@media(max-width:820px) { .layout { grid-template-columns:1fr; } }

.form-card { background:#fff;border:1px solid #e2e6ef;border-radius:16px;overflow:hidden; }
.form-head { padding:18px 24px;border-bottom:1px solid #edf0f7;display:flex;align-items:center;gap:10px; }
.form-head-title { font-size:16px;font-weight:800;color:#111;letter-spacing:-0.02em; }
.form-head-pill { font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;background:#e8effe;color:#1a56db;padding:3px 10px;border-radius:20px;border:1px solid #c7d6f9; }

.form-body { padding:20px 24px;display:flex;flex-direction:column;gap:16px; }
.sec-label { font-size:10px;font-weight:700;letter-spacing:0.13em;text-transform:uppercase;color:#aab;display:flex;align-items:center;gap:8px; }
.sec-label::after { content:'';flex:1;height:1px;background:#edf0f7; }

.row2 { display:grid;grid-template-columns:1fr 1fr;gap:12px; }
.row3 { display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px; }

.field label { display:block;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#888;margin-bottom:5px; }
.field label .req { color:#1a56db;margin-left:2px; }
.field input, .field textarea {
  width:100%;font-family:'JetBrains Mono',monospace;font-size:12px;
  background:#fcfcfc;border:1px solid #dde2ee;border-radius:8px;padding:10px 12px;
  color:#111;outline:none;resize:vertical;transition:border-color 0.15s,background 0.15s;
}
.field input::placeholder, .field textarea::placeholder { color:#bbc; }
.field input:focus, .field textarea:focus { border-color:#1a56db;background:#fff;box-shadow:0 0 0 3px rgba(26,86,219,0.08); }
.field textarea { min-height:66px; }

.form-foot { padding:14px 24px;border-top:1px solid #edf0f7;display:flex;gap:8px;justify-content:flex-end; }

.add-item-btn { width:100%;padding:11px 16px;margin-top:4px;background:#1a56db;color:#fff;border:none;border-radius:8px;font-family:'Inter',sans-serif;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;letter-spacing:0.02em;transition:background 0.15s; }
.add-item-btn:hover { background:#1446c0; }
.item-row { display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;position:relative;border:1px solid #dde2ee;padding:14px;border-radius:10px;background:#fafafa; }
.item-remove { position:absolute;top:-8px;right:-8px;background:#ef4444;color:#fff;border:none;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:11px;cursor:pointer;line-height:1; }
.item-remove:hover { background:#dc2626; }
.items-tbl-wrap { border:1px solid #dde6fb;border-radius:10px;overflow:hidden;margin-bottom:8px; }
.items-tbl { width:100%;border-collapse:collapse;background:#fafafa; }
.items-tbl th { background:#f0f4fd;text-align:left;padding:8px 12px;font-size:9px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#1a56db;border-bottom:1px solid #dde6fb; }
.items-tbl td { padding:10px 12px;font-size:11px;color:#111;border-bottom:1px solid #dde6fb;font-family:'JetBrains Mono',monospace;font-weight:600; }
.items-tbl tr:last-child td { border-bottom:none; }

.prev-lbl { font-size:10px;font-weight:700;letter-spacing:0.13em;text-transform:uppercase;color:#aab;text-align:center;margin-bottom:12px; }

.pod-doc { background:#fff;border-radius:16px;overflow:hidden;font-family:'Inter',sans-serif;font-size:12px;color:#111;border:1px solid #e2e6ef;box-shadow:0 4px 24px rgba(26,86,219,0.07); }

.pod-head { background:#1a56db;padding:16px 20px 14px;display:flex;justify-content:space-between;align-items:flex-start;gap:16px;position:relative;overflow:hidden; }
.pod-head-ring1 { position:absolute;top:-30px;right:30px;width:130px;height:130px;border-radius:50%;border:1px solid rgba(255,255,255,0.15); }
.pod-head-ring2 { position:absolute;top:10px;right:10px;width:80px;height:80px;border-radius:50%;border:1px solid rgba(255,255,255,0.1); }
.pod-head-slash { position:absolute;bottom:0;right:0;width:45%;height:100%;background:rgba(255,255,255,0.05);clip-path:polygon(30% 0%,100% 0%,100% 100%,0% 100%); }

.pod-logo { width:36px;height:36px;background:#fff;border-radius:9px;display:flex;align-items:center;justify-content:center;margin-bottom:6px; }
.pod-main-title { font-size:20px;font-weight:800;color:#fff;letter-spacing:-0.03em;line-height:1.1; }
.pod-sub { font-size:9px;color:rgba(255,255,255,0.7);font-family:'JetBrains Mono',monospace;margin-top:4px;letter-spacing:0.06em; }

.pod-head-right { text-align:right;position:relative;z-index:2; }
.pod-ref-lbl { font-size:9px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.6);margin-bottom:3px; }
.pod-ref-val { font-size:16px;font-weight:800;color:#fff;font-family:'JetBrains Mono',monospace;letter-spacing:0.02em; }
.pod-status { display:inline-block;margin-top:8px;padding:4px 12px;border-radius:20px;font-size:9px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;background:rgba(255,255,255,0.2);color:#fff;border:1px solid rgba(255,255,255,0.3); }

.pod-stripe { height:4px;background:linear-gradient(90deg,#60a5fa,#1a56db,#3b82f6); }

.pod-body { padding:14px 20px;display:flex;flex-direction:column;gap:10px; }

.s-head { font-size:8px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#aab;display:flex;align-items:center;gap:8px;margin-bottom:6px; }
.s-head::after { content:'';flex:1;height:1px;background:#edf0f7; }

.addr-grid { display:grid;grid-template-columns:1fr 1fr;gap:6px; }
.addr-box { background:#fafafa;border:1px solid #dde6fb;border-radius:8px;padding:8px 10px; }
.addr-box.full { grid-column:1/-1; }
.addr-lbl { font-size:8px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#1a56db;margin-bottom:3px;display:flex;align-items:center;gap:5px; }
.lbl-pip { width:4px;height:4px;background:#1a56db;border-radius:50%;flex-shrink:0; }
.addr-val { font-size:10px;color:#111;line-height:1.4;font-weight:500; }
.addr-val.mono { font-family:'JetBrains Mono',monospace;font-size:9px; }
.empty { color:#bbc;font-style:italic;font-size:9px; }

.chips { display:grid;grid-template-columns:repeat(3,1fr);gap:6px; }
.chip { background:#fafafa;border:1px solid #dde6fb;border-radius:6px;padding:7px 9px; }
.chip-lbl { font-size:8px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#a3a3a3;margin-bottom:2px; }
.chip-val { font-size:10px;font-weight:700;color:#111;font-family:'JetBrains Mono',monospace; }

.desc-box { background:#fafafa;border:1px solid #dde6fb;border-radius:8px;padding:8px 10px;margin-bottom:6px; }
.desc-box:last-child { margin-bottom:0; }
.desc-lbl { font-size:8px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#1a56db;margin-bottom:3px; }
.desc-val { font-size:10px;color:#333;line-height:1.5; }

.sig-grid { display:grid;grid-template-columns:1fr 1fr;gap:8px; }
.sig-box { border:1.5px dashed #c7d6f9;border-radius:8px;padding:8px 12px;min-height:50px;display:flex;flex-direction:column;justify-content:space-between; }
.sig-lbl { font-size:8px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#a3a3a3; }
.sig-line { border-bottom:1px solid #c7d6f9;margin-top:18px; }
.sig-name { font-size:9px;color:#aab;margin-top:3px;font-family:'JetBrains Mono',monospace; }

.pod-foot { background:#1a56db;padding:8px 20px;display:flex;justify-content:space-between;align-items:center;font-size:9px;color:rgba(255,255,255,0.6);font-family:'JetBrains Mono',monospace; }
.pod-foot-brand { color:#fff;font-weight:700; }

.toast-bar { margin:14px 24px 0;background:#1a56db;color:#fff;border-radius:10px;padding:11px 16px;font-size:12px;font-weight:700;font-family:'Inter',sans-serif;display:flex;align-items:center;justify-content:space-between;transition:opacity 0.3s; }
.toast-hidden { opacity:0;pointer-events:none; }
.toast-x { cursor:pointer;font-size:14px;background:none;border:none;color:#fff;padding:0 0 0 12px; }

/* Print Styles */
@media print {
  .shell { background: #fff !important; padding: 0 !important; }
  .layout { display: block; max-width: none; margin: 0; padding: 0; }
  .print-w100 { width: 100% !important; }
  .pod-doc { border: none !important; box-shadow: none !important; border-radius: 0 !important; }
}
</style>
