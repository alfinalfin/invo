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
          <div class="brand-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
          </div>
          <div class="brand-name ml-2">InvoCRM <span class="brand-tag">POD</span></div>
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
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                  </div>
                  <span style="font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.02em;">InvoCRM</span>
                </div>
                <div class="pod-main-title mt-4">Proof of<br>Delivery</div>
                <div class="pod-sub" id="p-issued">ISSUED: {{ today() }}</div>
              </div>
              <div class="pod-head-right">
                <div class="text-[9px] text-[rgba(255,255,255,0.85)] text-right leading-relaxed mb-6 font-mono">
                  <div class="font-bold text-white uppercase tracking-wider mb-1 text-[10px]">InvoCRM</div>
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
              <span class="pod-foot-brand">InvoCRM</span>
              <span>{{ today() }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');

.shell { font-family: 'Inter', sans-serif; background: transparent; min-height: 100vh; padding-bottom: 80px; }

.topbar { background: var(--surface-primary); backdrop-filter: blur(24px); border-bottom: 1px solid var(--border-color); padding: 12px 28px; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; box-shadow: var(--shadow-sm); z-index: 10; position: relative; }
.brand { display:flex;align-items:center;gap:10px; }
.brand-icon { width:36px;height:36px;border-radius:10px;background: var(--accent); display:flex;align-items:center;justify-content:center; box-shadow: 0 0 16px var(--accent-soft); }
.brand-name { font-size:16px;font-weight:800;color: var(--text-primary);letter-spacing:-0.02em; }
.brand-tag { font-size:10px;font-weight:700;letter-spacing:0.1em;color: var(--accent);margin-left:3px; }

.topbar-actions { display:flex;gap:8px;flex-wrap:wrap; }
.tbtn { font-family:'Inter',sans-serif;font-size:12px;font-weight:700;letter-spacing:0.03em;padding:8px 16px;border-radius:12px;cursor:pointer;border:none;display:inline-flex;align-items:center;gap:6px;transition:all 0.2s; }
.tbtn-ghost { background: var(--sidebar-surface); color: var(--text-secondary); border: 1px solid var(--border-color); }
.tbtn-ghost:hover { background: var(--surface-secondary); color: var(--text-primary); transform: translateY(-1px); box-shadow: var(--shadow-sm); }
.tbtn-primary { background: linear-gradient(135deg, var(--accent), var(--accent-strong)); color: #fff; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.2); border: 1px solid rgba(255,255,255,0.1); }
.tbtn-primary:focus { outline:none; box-shadow: 0 0 0 2px var(--accent); }
.tbtn-primary:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(139, 92, 246, 0.4); filter: brightness(1.1); }

.layout { max-width:1300px;margin:28px auto 0;padding:0 24px;display:grid;grid-template-columns:1fr 1fr;gap:32px;align-items:start; }
@media(max-width:900px) { .layout { grid-template-columns:1fr; } }

/* Form Card mapped to glass-panel aesthetics */
.form-card { background: var(--surface-primary); backdrop-filter: blur(40px); border: 1px solid var(--border-strong); border-radius: 24px; overflow: hidden; box-shadow: var(--shadow-lg); position: relative; }
.form-head { padding:24px 28px; border-bottom: 1px solid var(--border-color); display: flex; align-items: center; gap: 12px; background: rgba(0,0,0,0.02); }
.form-head-title { font-size:17px; font-weight:800; color: var(--text-primary); letter-spacing:-0.03em; }
.form-head-pill { font-size:10px; font-weight:800; letter-spacing:0.12em; text-transform:uppercase; background: var(--accent-soft); color: var(--accent); padding:4px 12px; border-radius:20px; border:1px solid var(--accent-strong); opacity:0.8; }

.form-body { padding:24px 28px; display:flex; flex-direction:column; gap:20px; }
.sec-label { font-size:10px; font-weight:800; letter-spacing:0.15em; text-transform:uppercase; color: var(--text-muted); display:flex; align-items:center; gap:12px; }
.sec-label::after { content:''; flex:1; height:1px; background: var(--border-color); }

.row2 { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
.row3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; }

.field label { display:block; font-size:10px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color: var(--text-secondary); margin-bottom:8px; }
.field label .req { color: var(--danger); margin-left:2px; }
.field input, .field textarea {
  width:100%; font-family:'JetBrains Mono',monospace; font-size:12px; font-weight:600;
  background: var(--sidebar-surface); border:1px solid var(--border-color); border-radius:12px; padding:12px 16px;
  color: var(--text-primary); outline:none; resize:vertical; transition:all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
}
.field input::placeholder, .field textarea::placeholder { color: var(--text-muted); font-weight:400; }
.field input:focus, .field textarea:focus { border-color: var(--accent); background: var(--surface-primary); box-shadow: 0 0 0 4px var(--accent-soft); transform: translateY(-1px); }
.field textarea { min-height:80px; }

.form-foot { padding:18px 28px; border-top:1px solid var(--border-color); display:flex; gap:12px; justify-content:flex-end; background: rgba(0,0,0,0.02); }

.add-item-btn { width:100%; padding:12px 16px; margin-top:4px; background: var(--sidebar-surface); color: var(--text-primary); border:1px dashed var(--border-strong); border-radius:12px; font-family:'Inter',sans-serif; font-size:12px; font-weight:800; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; letter-spacing:0.02em; transition:all 0.2s; }
.add-item-btn:hover { background: var(--surface-secondary); border-color: var(--accent); color: var(--accent); }
.item-row { display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; position:relative; border:1px solid var(--border-color); padding:16px; border-radius:16px; background: var(--sidebar-surface); transition:all 0.2s; }
.item-row:hover { border-color: var(--border-strong); }
.item-remove { position:absolute; top:-10px; right:-10px; background: var(--danger); color:#fff; border:none; border-radius:50%; width:24px; height:24px; display:flex; align-items:center; justify-content:center; font-size:12px; cursor:pointer; line-height:1; box-shadow:0 4px 12px rgba(239, 68, 68, 0.3); transition:transform 0.15s; }
.item-remove:hover { background:#dc2626; transform:scale(1.1); }

/* Internal styles for PDF print - Ensure this stays largely white/grayscale for paper */
.prev-lbl { font-size:10px; font-weight:800; letter-spacing:0.15em; text-transform:uppercase; color: var(--text-muted); text-align:center; margin-bottom:16px; text-shadow: 0 1px 2px rgba(0,0,0,0.1); }
.pod-doc { background:#ffffff !important; border-radius:0px; overflow:hidden; font-family:'Inter',sans-serif; font-size:12px; color:#111 !important; border:1px solid var(--border-color); box-shadow: var(--shadow-xl); position: relative; margin-bottom: 40px; }

.pod-head { background: linear-gradient(135deg, #4f46e5, #7c3aed) !important; padding:24px 28px 20px; display:flex; justify-content:space-between; align-items:flex-start; gap:16px; position:relative; overflow:hidden; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.pod-head-ring1 { position:absolute; top:-40px; right:40px; width:160px; height:160px; border-radius:50%; border:2px solid rgba(255,255,255,0.05); }
.pod-head-ring2 { position:absolute; top:20px; right:20px; width:100px; height:100px; border-radius:50%; border:2px solid rgba(255,255,255,0.03); }
.pod-head-slash { position:absolute; bottom:0; right:0; width:45%; height:100%; background:rgba(255,255,255,0.02); clip-path:polygon(30% 0%,100% 0%,100% 100%,0% 100%); }

.pod-main-title { font-size:24px; font-weight:900; color:#fff !important; letter-spacing:-0.03em; line-height:1.1; margin-top:16px; }
.pod-sub { font-size:10px; color:rgba(255,255,255,0.6) !important; font-family:'JetBrains Mono',monospace; margin-top:6px; letter-spacing:0.08em; font-weight: 500; }

.pod-head-right { text-align:right; position:relative; z-index:2; }
.pod-ref-lbl { font-size:10px; font-weight:800; letter-spacing:0.15em; text-transform:uppercase; color:rgba(255,255,255,0.5) !important; margin-bottom:4px; }
.pod-ref-val { font-size:18px; font-weight:900; color:#fff !important; font-family:'JetBrains Mono',monospace; letter-spacing:0.02em; }
.pod-status { display:inline-block; margin-top:12px; padding:5px 14px; border-radius:20px; font-size:10px; font-weight:800; letter-spacing:0.12em; text-transform:uppercase; background:rgba(255,255,255,0.1) !important; color:#fff !important; border:1px solid rgba(255,255,255,0.2) !important; }

.pod-stripe { height:6px; background:linear-gradient(90deg, #8b5cf6, #3b82f6) !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }

.pod-body { padding:20px 28px; display:flex; flex-direction:column; gap:16px; background: #fff !important; }

.s-head { font-size:9px; font-weight:800; letter-spacing:0.16em; text-transform:uppercase; color:#8892a0 !important; display:flex; align-items:center; gap:8px; margin-bottom:8px; }
.s-head::after { content:''; flex:1; height:1px; background:#edf0f7 !important; }

.addr-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
.addr-box { background:#f8fafc !important; border:1px solid #e2e8f0 !important; border-radius:12px; padding:12px 14px; }
.addr-box.full { grid-column:1/-1; }
.addr-lbl { font-size:9px; font-weight:800; letter-spacing:0.14em; text-transform:uppercase; color:#475569 !important; margin-bottom:4px; display:flex; align-items:center; gap:6px; }
.lbl-pip { width:5px; height:5px; background:#8b5cf6 !important; border-radius:50%; flex-shrink:0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.addr-val { font-size:11px; color:#0f172a !important; line-height:1.5; font-weight:600; }
.addr-val.mono { font-family:'JetBrains Mono',monospace; font-size:10px; font-weight:500; }
.empty { color:#94a3b8 !important; font-style:italic; font-size:10px; }

.chips { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; }
.chip { background:#f8fafc !important; border:1px solid #e2e8f0 !important; border-radius:10px; padding:10px 12px; }
.chip-lbl { font-size:9px; font-weight:800; letter-spacing:0.12em; text-transform:uppercase; color:#64748b !important; margin-bottom:3px; }
.chip-val { font-size:11px; font-weight:800; color:#0f172a !important; font-family:'JetBrains Mono',monospace; }

.desc-box { background:#f8fafc !important; border:1px solid #e2e8f0 !important; border-radius:12px; padding:12px 14px; margin-bottom:10px; }
.desc-box:last-child { margin-bottom:0; }
.desc-lbl { font-size:9px; font-weight:800; letter-spacing:0.14em; text-transform:uppercase; color:#475569 !important; margin-bottom:4px; }
.desc-val { font-size:11px; color:#1e293b !important; line-height:1.6; font-weight: 500; }

.items-tbl-wrap { border:1px solid #e2e8f0 !important; border-radius:12px; overflow:hidden; margin-top: 10px; }
.items-tbl { width:100%; border-collapse:collapse; background:#fff !important; }
.items-tbl th { background:#f1f5f9 !important; text-align:left; padding:10px 14px; font-size:9px; font-weight:800; letter-spacing:0.14em; text-transform:uppercase; color:#475569 !important; border-bottom:1px solid #e2e8f0 !important; }
.items-tbl td { padding:12px 14px; font-size:11px; color:#0f172a !important; border-bottom:1px solid #e2e8f0 !important; font-family:'JetBrains Mono',monospace; font-weight:600; }
.items-tbl tr:last-child td { border-bottom:none; }

.sig-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
.sig-box { border:2px dashed #cbd5e1 !important; border-radius:12px; padding:12px 16px; min-height:80px; display:flex; flex-direction:column; justify-content:space-between; background: #fff !important; }
.sig-lbl { font-size:9px; font-weight:800; letter-spacing:0.12em; text-transform:uppercase; color:#64748b !important; }
.sig-line { border-bottom:1px solid #cbd5e1 !important; margin-top:28px; }
.sig-name { font-size:10px; color:#64748b !important; margin-top:6px; font-family:'JetBrains Mono',monospace; font-weight:500; }

.pod-foot { background:#4f46e5 !important; padding:12px 28px; display:flex; justify-content:space-between; align-items:center; font-size:10px; color:rgba(255,255,255,0.7) !important; font-family:'JetBrains Mono',monospace; font-weight:600; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.pod-foot-brand { color:#fff !important; font-weight:800; }

.toast-bar { margin:14px 24px 0; background:var(--accent); color:#fff; border-radius:12px; padding:14px 20px; font-size:13px; font-weight:800; font-family:'Inter',sans-serif; display:flex; align-items:center; justify-content:space-between; transition:all 0.3s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 4px 20px rgba(139, 92, 246, 0.3); border: 1px solid rgba(255,255,255,0.1); z-index: 20; position: relative; }
.toast-hidden { opacity:0; transform:translateY(-10px); pointer-events:none; }
.toast-x { cursor:pointer; font-size:16px; background:none; border:none; color:#fff; padding:0 0 0 12px; opacity:0.7; transition:opacity 0.2s; }
.toast-x:hover { opacity:1; }

/* Print Styles */
@media print {
  .shell { background: #fff !important; padding: 0 !important; }
  .topbar, .toast-bar, .form-card, .prev-lbl { display: none !important; }
  .layout { display: block; max-width: none; margin: 0; padding: 0; }
  .print-w100 { width: 100% !important; margin: 0 !important; padding: 0 !important; }
  .pod-doc { border: none !important; box-shadow: none !important; border-radius: 0 !important; margin: 0 !important; }
}
</style>
