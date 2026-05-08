<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  Timestamp 
} from 'firebase/firestore';
import { 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  ExternalLink, 
  FileText, 
  User,
  ShieldCheck,
  Calendar,
  Lock
} from 'lucide-vue-next';
import { useFirebaseServices } from '~/composables/useFirebaseServices';

const { db } = useFirebaseServices();

// Auth State
const isAuthenticated = ref(false);
const passwordInput = ref('');
const loginError = ref('');

function handleLogin() {
  if (passwordInput.value === 'ashil@2000') {
    isAuthenticated.value = true;
    loginError.value = '';
    fetchDrivers();
  } else {
    loginError.value = 'Invalid administrative password';
  }
}

// Data State
const drivers = ref<any[]>([]);
const loading = ref(true);
const activeFilter = ref('All');
const searchQuery = ref('');
const expandedRowId = ref<string | null>(null);
const connectionStatus = ref<'connecting' | 'connected' | 'error'>('connecting');
const connectionError = ref('');

// Lightbox State
const selectedDoc = ref<{ url: string, type: string } | null>(null);

function openDoc(url: string, docType: any) {
  selectedDoc.value = { url, type: String(docType) };
}

function closeDoc() {
  selectedDoc.value = null;
}

function fetchDrivers() {
  if (!db.value) {
    connectionStatus.value = 'error';
    connectionError.value = 'Database not initialized';
    return;
  }
  
  loading.value = true;
  connectionStatus.value = 'connecting';
  console.log("Connecting to Firestore collection: 'drivers'...");
  
  const q = query(collection(db.value, 'drivers'), orderBy('createdAt', 'desc'));
  
  onSnapshot(q, (snapshot) => {
    console.log(`[Firestore] Sync successful. Documents found: ${snapshot.size}`);
    drivers.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    loading.value = false;
    connectionStatus.value = 'connected';
  }, (err) => {
    console.error("[Firestore] Connection error:", err);
    loading.value = false;
    connectionStatus.value = 'error';
    connectionError.value = err.message;
  });
}

// Ensure data loads when db is ready
watch(db, (newDb) => {
  if (newDb && isAuthenticated.value) {
    fetchDrivers();
  }
}, { immediate: true });

// Computed Stats
const stats = computed(() => {
  return {
    total: drivers.value.length,
    pending: drivers.value.filter(d => d.status === 'pending').length,
    approved: drivers.value.filter(d => d.status === 'approved').length,
    rejected: drivers.value.filter(d => d.status === 'rejected').length
  };
});

// Filtering
const filteredDrivers = computed(() => {
  return drivers.value.filter(d => {
    const matchesFilter = activeFilter.value === 'All' || d.status === activeFilter.value.toLowerCase();
    const matchesSearch = !searchQuery.value || 
      d.fullName?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      d.email?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      d.phone?.includes(searchQuery.value);
    return matchesFilter && matchesSearch;
  });
});

// Actions
async function updateStatus(id: string, status: string) {
  if (!db.value) return;
  try {
    const docRef = doc(db.value, 'drivers', id);
    await updateDoc(docRef, { status });
  } catch (err) {
    console.error("Update error:", err);
  }
}

async function toggleFieldVerification(driverId: string, field: any, currentStatus: boolean) {
  if (!db.value) return;
  try {
    const docRef = doc(db.value, 'drivers', driverId);
    // Use an object to ensure Firestore merges the field correctly
    const updates: Record<string, any> = {};
    updates[`verifiedFields.${field}`] = !currentStatus;
    await updateDoc(docRef, updates);
    console.log(`Updated ${field} to ${!currentStatus}`);
  } catch (err) {
    console.error("Verification toggle error:", err);
  }
}

function isFieldVerified(driver: any, field: any) {
  return driver.verifiedFields?.[field] === true;
}

function toggleRow(id: string) {
  expandedRowId.value = expandedRowId.value === id ? null : id;
}

// Helpers
function getStatusColor(status: string) {
  switch (status) {
    case 'approved': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    case 'rejected': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    default: return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  }
}

function formatDate(dateStr: any) {
  if (!dateStr) return 'N/A';
  if (dateStr instanceof Timestamp) return dateStr.toDate().toLocaleDateString();
  return new Date(dateStr).toLocaleDateString();
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
}

function stringToColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
  return "#" + "00000".substring(0, 6 - c.length) + c;
}

const isPDF = (url: string) => url?.toLowerCase().includes('.pdf');

function formatDocType(docType: any) {
  return String(docType).replace(/([A-Z])/g, ' $1').trim();
}
</script>

<template>
  <div class="driver-verification-container min-h-screen bg-[var(--page-bg)] text-[var(--text-primary)] font-sans">
    
    <!-- Auth Lock Screen -->
    <div v-if="!isAuthenticated" class="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--page-bg)]/80 backdrop-blur-md">
      <div class="w-full max-w-md p-8 bg-[var(--surface-primary)] rounded-[32px] border border-[var(--border-color)] shadow-2xl">
        <div class="flex flex-col items-center text-center mb-8">
          <div class="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-4">
            <Lock class="w-8 h-8 text-emerald-500" />
          </div>
          <h2 class="text-2xl font-bold text-[var(--text-primary)] mb-2">Internal Access Only</h2>
          <p class="text-[var(--text-muted)]">Enter administrative password to proceed</p>
        </div>
        
        <div class="space-y-4">
          <div class="relative">
            <input 
              v-model="passwordInput" 
              type="password" 
              placeholder="••••••••" 
              class="w-full px-6 py-4 bg-[var(--surface-secondary)] border border-[var(--border-color)] rounded-2xl focus:outline-none focus:border-emerald-500/50 transition-all text-center text-xl tracking-widest text-[var(--text-primary)]"
              @keyup.enter="handleLogin"
            />
          </div>
          <p v-if="loginError" class="text-rose-400 text-sm text-center font-medium">{{ loginError }}</p>
          <button 
            @click="handleLogin"
            class="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
          >
            Sign In
          </button>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else class="p-6 lg:p-10 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-700">
      
      <!-- Top Bar -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 class="text-3xl font-bold tracking-tight text-[var(--text-primary)] flex items-center gap-3">
            <ShieldCheck class="w-8 h-8 text-emerald-500" />
            Driver Applications
          </h1>
          <p class="text-[var(--text-muted)] mt-1">Review and manage independent driver registrations</p>
        </div>
        
        <div class="flex items-center gap-4">
          <!-- Connection Status Badge -->
          <div class="flex flex-col items-end gap-1">
            <div :class="[
              'px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center gap-2',
              connectionStatus === 'connected' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
              connectionStatus === 'connecting' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse' : 
              'bg-rose-500/10 text-rose-400 border-rose-500/20'
            ]">
              <div :class="['w-1.5 h-1.5 rounded-full', connectionStatus === 'connected' ? 'bg-emerald-400' : connectionStatus === 'connecting' ? 'bg-amber-400' : 'bg-rose-400']"></div>
              {{ connectionStatus }}
            </div>
            <p v-if="connectionStatus === 'error'" class="text-[9px] text-rose-400 font-bold max-w-[200px] text-right">{{ connectionError }}</p>
          </div>

          <div class="relative group">
            <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within:text-emerald-500 transition-colors" />
            <input 
              v-model="searchQuery"
              type="text" 
              placeholder="Search by name, email..." 
              class="pl-11 pr-6 py-3 bg-[var(--surface-primary)] border border-[var(--border-color)] rounded-2xl focus:outline-none focus:border-emerald-500/30 transition-all w-[300px] text-[var(--text-primary)]"
            />
          </div>
          <button @click="fetchDrivers" class="p-3 bg-[var(--surface-primary)] border border-[var(--border-color)] rounded-2xl hover:bg-[var(--surface-secondary)] transition-all text-[var(--text-primary)] shadow-sm">
            <RefreshCw class="w-5 h-5" :class="{'animate-spin': loading}" />
          </button>
        </div>
      </div>

      <!-- Stats Row -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div v-for="(val, key) in stats" :key="key" class="stat-card">
          <p class="text-xs uppercase tracking-widest text-[var(--text-muted)] font-bold">{{ key }}</p>
          <p class="text-3xl font-bold text-[var(--text-primary)] mt-1">{{ val }}</p>
          <div class="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl"></div>
        </div>
      </div>

      <!-- Filter Tabs -->
      <div class="flex items-center gap-2 p-1.5 bg-[var(--surface-primary)] rounded-[20px] border border-[var(--border-color)] w-fit">
        <button 
          v-for="tab in ['All', 'Pending', 'Approved', 'Rejected']" 
          :key="tab"
          @click="activeFilter = tab"
          :class="[
            'px-6 py-2.5 rounded-[14px] text-sm font-bold transition-all',
            activeFilter === tab ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          ]"
        >
          {{ tab }}
        </button>
      </div>

      <!-- Data Table -->
      <div class="bg-[var(--surface-primary)] rounded-[32px] border border-[var(--border-color)] overflow-hidden shadow-xl">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-bottom border-[var(--border-color)]">
                <th class="px-6 py-5 text-xs uppercase tracking-widest text-[var(--text-muted)] font-bold">Driver</th>
                <th class="px-6 py-5 text-xs uppercase tracking-widest text-[var(--text-muted)] font-bold">Contact</th>
                <th class="px-6 py-5 text-xs uppercase tracking-widest text-[var(--text-muted)] font-bold">City</th>
                <th class="px-6 py-5 text-xs uppercase tracking-widest text-[var(--text-muted)] font-bold">Applied Date</th>
                <th class="px-6 py-5 text-xs uppercase tracking-widest text-[var(--text-muted)] font-bold text-center">Status</th>
                <th class="px-6 py-5 text-xs uppercase tracking-widest text-[var(--text-muted)] font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[var(--border-color)]">
              <template v-for="driver in filteredDrivers" :key="driver.id">
                <tr 
                  @click="toggleRow(driver.id)"
                  class="group hover:bg-[var(--surface-secondary)] cursor-pointer transition-colors"
                >
                  <td class="px-6 py-5">
                    <div class="flex items-center gap-4">
                      <div v-if="driver.documents?.passport" class="w-10 h-10 rounded-full overflow-hidden border border-[var(--border-color)]">
                        <img :src="driver.documents.passport" class="w-full h-full object-cover" />
                      </div>
                      <div v-else :style="{ backgroundColor: stringToColor(driver.fullName || '') + '20' }" class="w-10 h-10 rounded-full flex items-center justify-center border border-[var(--border-color)]">
                        <span class="text-xs font-bold" :style="{ color: stringToColor(driver.fullName || '') }">{{ getInitials(driver.fullName || '?') }}</span>
                      </div>
                      <div>
                        <p class="font-bold text-[var(--text-primary)] group-hover:text-emerald-400 transition-colors">{{ driver.fullName }}</p>
                        <p class="text-xs text-[var(--text-muted)] font-mono mt-0.5 tracking-tight uppercase">{{ driver.id.substring(0,8) }}</p>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-5">
                    <p class="text-sm font-medium">{{ driver.email }}</p>
                    <p class="text-xs text-[#64748B] mt-0.5">{{ driver.phone }}</p>
                  </td>
                  <td class="px-6 py-5">
                    <span class="text-sm font-medium">{{ driver.city || '—' }}</span>
                  </td>
                  <td class="px-6 py-5">
                    <span class="text-sm font-medium">{{ formatDate(driver.createdAt) }}</span>
                  </td>
                  <td class="px-6 py-5">
                    <div class="flex justify-center">
                      <span :class="['px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border', getStatusColor(driver.status)]">
                        {{ driver.status || 'pending' }}
                      </span>
                    </div>
                  </td>
                  <td class="px-6 py-5 text-right">
                    <div class="flex items-center justify-end gap-2" @click.stop>
                      <button @click="updateStatus(driver.id, 'approved')" class="action-btn text-emerald-400 hover:bg-emerald-500/20" title="Approve">
                        <CheckCircle2 class="w-5 h-5" />
                      </button>
                      <button @click="updateStatus(driver.id, 'rejected')" class="action-btn text-rose-400 hover:bg-rose-500/20" title="Reject">
                        <XCircle class="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
                
                <!-- Expanded Detail Panel -->
                <tr v-if="expandedRowId === driver.id" @click.stop>
                  <td colspan="6" class="p-0 bg-[var(--surface-secondary)]/50">
                    <div class="px-10 py-12 animate-in slide-in-from-top-4 duration-300">
                      <div class="grid grid-cols-1 lg:grid-cols-3 gap-12">
                        
                        <!-- Column 1: Personal -->
                        <div class="space-y-8">
                          <div class="flex flex-col items-center mb-8">
                            <div v-if="driver.documents?.passport" class="w-20 h-20 rounded-full overflow-hidden border-2 border-emerald-500/30 shadow-lg shadow-emerald-500/10 mb-4">
                              <img :src="driver.documents.passport" class="w-full h-full object-cover" />
                            </div>
                            <div v-else :style="{ backgroundColor: stringToColor(driver.fullName || '') + '20' }" class="w-20 h-20 rounded-full flex items-center justify-center border-2 border-[var(--border-color)] mb-4">
                              <span class="text-xl font-bold" :style="{ color: stringToColor(driver.fullName || '') }">{{ getInitials(driver.fullName || '?') }}</span>
                            </div>
                            <h3 class="text-xl font-bold text-[var(--text-primary)]">{{ driver.fullName }}</h3>
                            <p class="text-sm text-[var(--text-muted)]">{{ driver.id }}</p>
                          </div>
                          
                          <div>
                            <h4 class="text-emerald-500 text-xs font-black uppercase tracking-[0.2em] mb-6 flex items-center justify-between gap-2">
                              <span class="flex items-center gap-2"><User class="w-4 h-4" /> Personal Profile</span>
                              <button 
                                @click="toggleFieldVerification(driver.id, 'personal', isFieldVerified(driver, 'personal'))"
                                :class="['p-1 rounded-lg transition-all', isFieldVerified(driver, 'personal') ? 'bg-emerald-500 text-white' : 'bg-[var(--surface-secondary)] text-[var(--text-muted)] border border-[var(--border-color)]']"
                              >
                                <CheckCircle2 class="w-4 h-4" />
                              </button>
                            </h4>
                            <div class="space-y-4">
                              <div class="detail-item">
                                <label>Date of Birth</label>
                                <p>{{ formatDate(driver.dob) }}</p>
                              </div>
                              <div class="detail-item">
                                <label>NI Number</label>
                                <p class="font-mono text-[var(--text-primary)]">{{ driver.nationalInsuranceNumber }}</p>
                              </div>
                              <div class="detail-item">
                                <label>Share Code</label>
                                <p class="font-mono text-emerald-400">{{ driver.shareCode || 'Not provided' }}</p>
                              </div>
                              <div class="detail-item">
                                <label>WhatsApp</label>
                                <p>{{ driver.whatsappNumber || driver.phone }}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <!-- Column 2: Driving & Vehicle -->
                        <div class="space-y-8 border-l border-[var(--border-color)] pl-12">
                          <div>
                            <h4 class="text-emerald-500 text-xs font-black uppercase tracking-[0.2em] mb-6 flex items-center justify-between gap-2">
                              <span class="flex items-center gap-2"><Calendar class="w-4 h-4" /> Driving Credentials</span>
                              <button 
                                @click="toggleFieldVerification(driver.id, 'driving', isFieldVerified(driver, 'driving'))"
                                :class="['p-1 rounded-lg transition-all', isFieldVerified(driver, 'driving') ? 'bg-emerald-500 text-white' : 'bg-[var(--surface-secondary)] text-[var(--text-muted)] border border-[var(--border-color)]']"
                              >
                                <CheckCircle2 class="w-4 h-4" />
                              </button>
                            </h4>
                            <div class="space-y-4">
                              <div class="detail-item">
                                <label>Licence No</label>
                                <p class="font-mono">{{ driver.licenceNumber }}</p>
                              </div>
                              <div class="detail-item">
                                <label>Expiry Date</label>
                                <p>{{ formatDate(driver.licenceExpiry) }}</p>
                              </div>
                              <div class="detail-item">
                                <label>Penalty Points</label>
                                <p :class="{'text-rose-400 font-bold': (driver.penaltyPoints || 0) > 3}">{{ driver.penaltyPoints || 0 }} Points</p>
                              </div>
                            </div>
                          </div>
                          
                          <div class="pt-4">
                            <h4 class="text-emerald-500 text-xs font-black uppercase tracking-[0.2em] mb-6 flex items-center justify-between gap-2">
                              <span class="flex items-center gap-2"><RefreshCw class="w-4 h-4" /> Vehicle Information</span>
                              <button 
                                @click="toggleFieldVerification(driver.id, 'vehicle', isFieldVerified(driver, 'vehicle'))"
                                :class="['p-1 rounded-lg transition-all', isFieldVerified(driver, 'vehicle') ? 'bg-emerald-500 text-white' : 'bg-[var(--surface-secondary)] text-[var(--text-muted)] border border-[var(--border-color)]']"
                              >
                                <CheckCircle2 class="w-4 h-4" />
                              </button>
                            </h4>
                            <div class="space-y-4">
                              <div class="detail-item">
                                <label>Reg Plate</label>
                                <div class="bg-amber-400 text-black px-3 py-1 rounded font-black text-sm w-fit">{{ driver.registrationNumber }}</div>
                              </div>
                              <div class="detail-item">
                                <label>Make / Model</label>
                                <p>{{ driver.vehicleMake }} {{ driver.vehicleModel }} <span class="text-[#64748B] text-xs">({{ driver.vehicleType }})</span></p>
                              </div>
                              <div class="detail-item">
                                <label>Insurance Expiry</label>
                                <p>{{ formatDate(driver.insuranceExpiry) }}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <!-- Column 3: Documents -->
                        <div class="space-y-8 border-l border-[var(--border-color)] pl-12">
                          <h4 class="text-emerald-500 text-xs font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            <FileText class="w-4 h-4" /> Verified Documents
                          </h4>
                          <div class="grid grid-cols-2 gap-4">
                            <div 
                              v-for="(url, docType) in driver.documents" 
                              :key="docType" 
                              class="group/doc relative aspect-[4/3] bg-[var(--surface-secondary)] rounded-xl border border-[var(--border-color)] overflow-hidden flex flex-col items-center justify-center p-4 cursor-pointer hover:border-emerald-500/50 transition-all"
                            >
                              <!-- Verified Badge -->
                              <div 
                                @click.stop="toggleFieldVerification(driver.id, docType, isFieldVerified(driver, docType))"
                                :class="[
                                  'absolute top-2 right-2 z-20 p-1 rounded-full border transition-all',
                                  isFieldVerified(driver, docType) ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-black/20 text-white/50 border-white/10 hover:bg-emerald-500/50'
                                ]"
                              >
                                <CheckCircle2 class="w-3 h-3" />
                              </div>

                              <div @click="openDoc(url, docType)" class="contents">
                                <template v-if="isPDF(url)">
                                  <FileText class="w-10 h-10 text-emerald-500/50 mb-2" />
                                  <span class="text-[10px] uppercase font-bold text-[#64748B]">{{ formatDocType(docType) }}</span>
                                  <div class="absolute inset-0 flex items-center justify-center bg-emerald-500 opacity-0 group-hover/doc:opacity-100 transition-opacity">
                                    <span class="text-white font-black text-xs uppercase tracking-widest">Inspect PDF</span>
                                  </div>
                                </template>
                                <template v-else>
                                  <img :src="url" class="absolute inset-0 w-full h-full object-cover opacity-50 group-hover/doc:opacity-80 transition-opacity" />
                                  <span class="relative z-10 text-[10px] uppercase font-black text-white bg-black/40 px-2 py-1 rounded backdrop-blur-sm">{{ formatDocType(docType) }}</span>
                                  <div class="absolute inset-0 flex items-center justify-center bg-emerald-500/40 opacity-0 group-hover/doc:opacity-100 transition-opacity">
                                    <ExternalLink class="w-6 h-6 text-white" />
                                  </div>
                                </template>
                              </div>
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>
                  </td>
                </tr>
              </template>
              
              <!-- Empty State -->
              <tr v-if="filteredDrivers.length === 0">
                <td colspan="6" class="px-6 py-20 text-center">
                  <div class="flex flex-col items-center justify-center opacity-40">
                    <div class="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                      <Search class="w-8 h-8" />
                    </div>
                    <p class="text-lg font-bold">No applications found</p>
                    <p class="text-sm">Try adjusting your filters or search terms</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>

    <!-- Document Viewer Modal -->
    <Transition name="fade">
      <div v-if="selectedDoc" class="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-10 bg-[var(--page-bg)]/90 backdrop-blur-xl">
        <button 
          @click="closeDoc" 
          class="absolute top-6 right-6 p-4 bg-[var(--surface-secondary)] hover:bg-rose-500 text-[var(--text-primary)] hover:text-white rounded-full transition-all z-[210] group border border-[var(--border-color)]"
        >
          <XCircle class="w-8 h-8 group-hover:scale-110 transition-transform" />
        </button>
        
        <div class="w-full max-w-5xl h-full flex flex-col items-center justify-center gap-6 animate-in zoom-in-95 duration-300">
          <div class="flex items-center gap-3 text-[var(--text-primary)]">
            <ShieldCheck class="w-6 h-6 text-emerald-500" />
            <h3 class="text-xl font-bold uppercase tracking-widest">{{ selectedDoc.type.replace(/([A-Z])/g, ' $1') }}</h3>
          </div>
          
          <div class="w-full h-full flex-1 bg-[var(--surface-primary)] rounded-3xl border border-[var(--border-color)] overflow-hidden shadow-2xl relative">
            <iframe 
              v-if="isPDF(selectedDoc.url)" 
              :src="selectedDoc.url" 
              class="w-full h-full border-none"
            ></iframe>
            <img 
              v-else 
              :src="selectedDoc.url" 
              class="w-full h-full object-contain"
            />
          </div>
          
          <div class="flex gap-4">
            <a :href="selectedDoc.url" target="_blank" class="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20">
              <ExternalLink class="w-4 h-4" /> Open Original
            </a>
            <button @click="closeDoc" class="px-8 py-3 bg-[var(--surface-secondary)] hover:bg-[var(--surface-primary)] text-[var(--text-primary)] font-bold rounded-xl transition-all border border-[var(--border-color)]">
              Close Viewer
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');

.driver-verification-container {
  font-family: 'Plus Jakarta Sans', sans-serif;
}

h1, h2, h3, h4, .font-bold {
  font-family: 'Plus Jakarta Sans', sans-serif;
  letter-spacing: -0.02em;
}

.font-mono {
  font-family: 'DM Mono', monospace;
}

.stat-card {
  position: relative;
  overflow: hidden;
  padding: 24px;
  background: var(--surface-primary);
  border: 1px solid var(--border-color);
  border-radius: 28px;
  backdrop-filter: blur(20px);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.stat-card:hover {
  transform: translateY(-4px);
  background: var(--surface-secondary);
  border-color: rgba(16, 185, 129, 0.3);
}

.detail-item label {
  display: block;
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
  margin-bottom: 6px;
}

.detail-item p {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.action-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  background: var(--surface-secondary);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
}

.action-btn:hover {
  transform: scale(1.1);
}

/* Custom Scrollbar */
.overflow-x-auto::-webkit-scrollbar {
  height: 6px;
}
.overflow-x-auto::-webkit-scrollbar-track {
  background: var(--page-bg);
}
.overflow-x-auto::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 10px;
}
.overflow-x-auto::-webkit-scrollbar-thumb:hover {
  background: var(--text-muted);
}

/* Animations */
.animate-in {
  animation-duration: 0.5s;
  animation-fill-mode: both;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.fade-in {
  animation-name: fadeIn;
}

/* Modal Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.zoom-in-95 {
  animation: zoomIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes zoomIn {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
</style>
