<script setup lang="ts">
import { Map, List, Truck, Navigation } from "lucide-vue-next";
import { ref } from "vue";

const activeTab = ref("map");

const vehicles = [
  { id: "V-102", driver: "James Miller", status: "In Transit", location: "M1 Southbound", eta: "14:30", type: "LWB Sprinter", color: "text-emerald-400", bg: "bg-emerald-400/20" },
  { id: "V-441", driver: "Sarah Connor", status: "Delayed", location: "Sheffield City", eta: "15:45", type: "Luton", color: "text-amber-400", bg: "bg-amber-400/20" },
  { id: "V-089", driver: "Tom Hardy", status: "Loading", location: "Depot A", eta: "--:--", type: "Small Van", color: "text-blue-400", bg: "bg-blue-400/20" },
  { id: "V-213", driver: "Emma Frost", status: "Delivered", location: "Leeds", eta: "13:10", type: "MWB", color: "text-[var(--text-muted)]", bg: "bg-white/10" }
];
</script>

<template>
  <div class="h-full w-full flex flex-col">
    <div class="flex items-center justify-between mb-8 mt-2">
      <div>
        <h2 class="text-3xl font-black text-[var(--text-primary)] tracking-tight">Fleet Tracking</h2>
        <p class="text-[var(--text-secondary)] text-sm mt-1">Real-time logistics and ETA monitoring (Preview)</p>
      </div>
      
      <div class="flex items-center p-1 bg-[var(--surface-primary)] border border-[var(--border-color)] rounded-xl relative z-10 shadow-sm">
        <button 
          @click="activeTab = 'map'" 
          :class="['px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2', activeTab === 'map' ? 'bg-[var(--sidebar-surface)] text-[var(--text-primary)] shadow-sm border border-[var(--border-color)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-transparent']"
        >
          <Map class="h-4 w-4" /> Map
        </button>
        <button 
          @click="activeTab = 'list'" 
          :class="['px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2', activeTab === 'list' ? 'bg-[var(--sidebar-surface)] text-[var(--text-primary)] shadow-sm border border-[var(--border-color)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-transparent']"
        >
          <List class="h-4 w-4" /> List
        </button>
      </div>
    </div>

    <!-- Layout Grid -->
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6 flex-1 min-h-[600px] mb-8">
      
      <!-- List Column -->
      <div class="col-span-1 glass-panel flex flex-col overflow-hidden h-full shadow-[var(--shadow-md)] relative">
        <div class="p-5 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--surface-primary)] z-10">
          <h3 class="font-bold text-[var(--text-primary)] text-sm tracking-wide uppercase">Active Vehicles</h3>
          <div class="px-3 py-1 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] text-xs font-bold border border-[var(--border-strong)] shadow-sm hover-lift">
            4 Online
          </div>
        </div>
        
        <div class="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar relative z-10 blur-backdrop bg-gradient-to-b from-transparent to-[rgba(0,0,0,0.2)]">
          <div v-for="v in vehicles" :key="v.id" class="p-4 rounded-xl bg-[var(--sidebar-surface)] border border-[var(--border-color)] hover:border-[var(--accent-soft)] hover:shadow-[0_0_12px_var(--accent-soft)] transition-all cursor-pointer group hover:-translate-y-[1px]">
            <div class="flex justify-between items-start mb-3">
              <div class="flex items-center gap-3">
                <div class="p-2 rounded-xl bg-[var(--surface-primary)] border border-[var(--border-color)] group-hover:scale-110 group-hover:border-[var(--accent-soft)] transition-all">
                  <Truck class="h-5 w-5 text-[var(--text-secondary)] group-hover:text-[var(--accent)]" />
                </div>
                <div>
                  <h4 class="font-bold text-sm text-[var(--text-primary)]">{{ v.id }}</h4>
                  <p class="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-bold mt-0.5">{{ v.driver }}</p>
                </div>
              </div>
              <div :class="['px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg border border-[var(--border-strong)] shadow-inner transform transition-transform group-hover:scale-105', v.color, v.bg]">
                {{ v.status }}
              </div>
            </div>
            
            <div class="flex items-center justify-between mt-3 pt-3 border-t border-[var(--border-color)] border-dashed">
              <p class="text-xs font-mono text-[var(--text-secondary)] flex items-center gap-1 group-hover:text-[var(--text-primary)] transition-colors">
                <Navigation class="h-3 w-3 text-[var(--accent)]" /> {{ v.location }}
              </p>
              <p class="text-xs font-black font-mono text-[var(--text-primary)]">{{ v.eta }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Map Column Placeholder -->
      <div class="col-span-1 xl:col-span-2 glass-panel overflow-hidden relative group border-[var(--border-strong)] shadow-[var(--shadow-lg)]">
        <!-- Mock Map Background utilizing mesh grid or gradients -->
        <div class="absolute inset-0 bg-[#0B0E14] opacity-50 z-0"></div>
        <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(139,92,246,0.15)_0%,transparent_60%)] z-0 transition-opacity duration-1000"></div>
        <div class="absolute inset-0 mix-blend-overlay opacity-30 pointer-events-none" style="background-image: radial-gradient(var(--border-strong) 1px, transparent 1px); background-size: 28px 28px;"></div>
        
        <div class="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none p-6">
          <div class="relative group-hover:scale-105 transition-transform duration-700 ease-in-out">
            <!-- Pulsing dots to simulate radar/map -->
            <div class="absolute -inset-10 bg-emerald-500/10 rounded-full blur-2xl animate-pulse delay-700"></div>
            <div class="h-20 w-20 bg-gradient-to-tr from-emerald-400 to-teal-600 rounded-[24px] flex items-center justify-center shadow-[0_0_50px_rgba(52,211,153,0.3)] relative rotate-3 hover:rotate-0 transition-all duration-300">
              <Map class="h-9 w-9 text-white" />
              <!-- Radar sweep ring -->
              <div class="absolute inset-0 border-2 border-emerald-400/40 rounded-[24px] animate-ping" style="animation-duration: 2s;"></div>
            </div>
          </div>
          <h3 class="mt-8 text-2xl md:text-3xl font-black text-[var(--text-primary)] tracking-tight drop-shadow-md">Interactive Telemetry Map</h3>
          
          <div class="mt-6 p-6 max-w-sm w-full glass-panel border border-[var(--border-strong)] rounded-2xl shadow-xl relative overflow-hidden flex flex-col items-center pointer-events-auto">
            <div class="absolute inset-0 bg-gradient-to-br from-[var(--surface-primary)] to-[var(--surface-secondary)] opacity-95 z-0"></div>
            
            <p class="relative z-10 text-[var(--text-primary)] text-sm text-center leading-relaxed font-medium mb-6">
              In the final release, this area will render a live <span class="font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-600">Mapbox SDK</span> integration projecting real-time GPS coordinates directly from the driver App.
            </p>
            
            <button class="relative z-10 w-full px-6 py-3 rounded-xl bg-[var(--sidebar-surface)] border border-[var(--border-color)] text-xs font-black uppercase tracking-widest text-[var(--text-primary)] hover:border-emerald-500 hover:text-emerald-600 transition-all shadow-sm hover:shadow-[0_0_20px_rgba(52,211,153,0.3)] hover:-translate-y-0.5 pointer-events-auto">
              Unlock Phase 2
            </button>
          </div>
        </div>
      </div>
      
    </div>
  </div>
</template>
