const fs = require('fs');
const file = 'c:/Users/alfin/Documents/invocrm/frontend/vue-app/components/crm/ScrapeLeadsModal.vue';
let content = fs.readFileSync(file, 'utf8');

const startString = `      <!-- ======================== -->
      <!-- PROGRESS (SCRAPING VIEW) -->
      <template v-else-if="viewState === 'progress'">`;

const endString = `      <!-- ======================= -->
      <!-- SUCCESS (COMPLETED) VIEW -->`;

const si = content.indexOf(startString);
const ei = content.indexOf(endString);

if (si === -1 || ei === -1) { 
  console.error('Markers not found', si, ei); 
  process.exit(1); 
}

const newBlock = `      <!-- ======================== -->
      <!-- PROGRESS (SCRAPING VIEW) -->
      <template v-else-if="viewState === 'progress'">
        <div class="relative w-full overflow-hidden" style="background: radial-gradient(ellipse at 20% 0%, rgba(79,70,229,0.15) 0%, transparent 60%), radial-gradient(ellipse at 80% 100%, rgba(14,165,233,0.1) 0%, transparent 60%), #0a0e1a;">

          <!-- Close -->
          <button @click="cancelScraping" class="absolute right-5 top-5 p-1.5 text-white/20 hover:text-white/60 hover:bg-white/10 rounded-lg transition-all z-20">
            <X class="w-4 h-4" />
          </button>

          <!-- === CENTRAL VISUALIZATION === -->
          <div class="flex flex-col items-center pt-10 pb-6 relative z-10">

            <!-- Radar Ring Stack -->
            <div class="relative flex items-center justify-center mb-8" style="width:160px;height:160px;">
              <!-- Outer pulse ring -->
              <div class="absolute inset-0 rounded-full animate-ping opacity-10" style="background: radial-gradient(circle, rgba(99,102,241,0.4) 0%, transparent 70%);"></div>
              
              <!-- SVG spinning arcs -->
              <svg class="absolute inset-0 w-full h-full" style="animation: spin 6s linear infinite;" viewBox="0 0 160 160">
                <circle cx="80" cy="80" r="72" fill="none" stroke="rgba(99,102,241,0.08)" stroke-width="1.5"/>
                <circle cx="80" cy="80" r="72" fill="none" stroke="rgba(99,102,241,0.6)" stroke-width="1.5" stroke-dasharray="60 392" stroke-linecap="round"/>
                <circle cx="80" cy="80" r="72" fill="none" stroke="rgba(99,102,241,0.3)" stroke-width="1.5" stroke-dasharray="20 432" stroke-dashoffset="200" stroke-linecap="round"/>
              </svg>
              <svg class="absolute inset-0 w-full h-full" style="animation: spin 4s linear infinite reverse;" viewBox="0 0 160 160">
                <circle cx="80" cy="80" r="58" fill="none" stroke="rgba(14,165,233,0.07)" stroke-width="1"/>
                <circle cx="80" cy="80" r="58" fill="none" stroke="rgba(14,165,233,0.5)" stroke-width="1" stroke-dasharray="40 324" stroke-linecap="round"/>
              </svg>
              <svg class="absolute inset-0 w-full h-full" style="animation: spin 10s linear infinite;" viewBox="0 0 160 160">
                <circle cx="80" cy="80" r="44" fill="none" stroke="rgba(139,92,246,0.15)" stroke-width="1"/>
                <circle cx="80" cy="80" r="44" fill="none" stroke="rgba(139,92,246,0.4)" stroke-width="1" stroke-dasharray="25 251" stroke-dashoffset="80" stroke-linecap="round"/>
              </svg>
              
              <!-- Core icon -->
              <div class="relative z-10 flex items-center justify-center w-20 h-20 rounded-[22px]" style="background: linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(14,165,233,0.2) 100%); border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 0 40px rgba(99,102,241,0.25), inset 0 1px 0 rgba(255,255,255,0.1);">
                <Rocket v-if="currentStep <= 1" class="w-8 h-8 text-indigo-300" stroke-width="1.5" style="animation: pulse 2s ease-in-out infinite;" />
                <Brain v-else-if="currentStep === 2" class="w-8 h-8 text-violet-300" stroke-width="1.5" style="animation: pulse 1.5s ease-in-out infinite;" />
                <Database v-else-if="currentStep === 3" class="w-8 h-8 text-sky-300" stroke-width="1.5" style="animation: pulse 1.5s ease-in-out infinite;" />
                <CheckCircle2 v-else class="w-8 h-8 text-emerald-400" stroke-width="1.5" />
              </div>
            </div>

            <!-- Live status label -->
            <div class="flex items-center gap-2 mb-1">
              <span class="flex h-1.5 w-1.5 rounded-full bg-indigo-400" style="box-shadow: 0 0 6px rgba(129,140,248,1); animation: pulse 1s infinite;"></span>
              <span class="text-[11px] font-black tracking-[0.15em] text-indigo-300/80 uppercase">Live Extraction</span>
            </div>
            <h3 class="text-[18px] font-black text-white tracking-tight">
              {{ currentStep === 1 ? 'Indexing Directories' : currentStep === 2 ? 'AI Intent Scoring' : currentStep === 3 ? 'Populating CRM' : 'Finalizing...' }}
            </h3>
            <p class="text-[12px] text-white/30 mt-1 font-medium">
              {{ currentStep === 1 ? 'Crawling Google Maps & business registries...' : currentStep === 2 ? 'Filtering high-intent prospects via LLM...' : 'Writing records to your CRM database...' }}
            </p>
          </div>

          <!-- === STEP TIMELINE === -->
          <div class="flex items-center justify-center gap-0 px-10 mb-6 relative z-10">
            
            <!-- Step 1 -->
            <div class="flex flex-col items-center" style="min-width:100px;">
              <div class="w-8 h-8 rounded-full flex items-center justify-center mb-2 transition-all duration-500"
                :style="currentStep === 1 ? 'background:rgba(99,102,241,0.25);box-shadow:0 0 16px rgba(99,102,241,0.4);border:1px solid rgba(99,102,241,0.5)' : currentStep > 1 ? 'background:rgba(52,211,153,0.2);border:1px solid rgba(52,211,153,0.4)' : 'background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1)'">
                <RefreshCcw v-if="currentStep === 1" class="w-3.5 h-3.5 text-indigo-300 animate-spin" stroke-width="2.5"/>
                <CheckCircle2 v-else-if="currentStep > 1" class="w-3.5 h-3.5 text-emerald-400" stroke-width="2.5"/>
                <span v-else class="text-[11px] font-black text-white/20">1</span>
              </div>
              <span class="text-[10px] font-bold transition-colors" :class="currentStep === 1 ? 'text-indigo-300' : currentStep > 1 ? 'text-white/50' : 'text-white/20'">Index</span>
            </div>

            <!-- Connector 1 -->
            <div class="h-px flex-1 mb-6 transition-all duration-1000" :style="currentStep > 1 ? 'background: linear-gradient(90deg, rgba(52,211,153,0.6), rgba(139,92,246,0.6))' : 'background: rgba(255,255,255,0.06)'"></div>

            <!-- Step 2 -->
            <div class="flex flex-col items-center" style="min-width:100px;">
              <div class="w-8 h-8 rounded-full flex items-center justify-center mb-2 transition-all duration-500"
                :style="currentStep === 2 ? 'background:rgba(139,92,246,0.25);box-shadow:0 0 16px rgba(139,92,246,0.4);border:1px solid rgba(139,92,246,0.5)' : currentStep > 2 ? 'background:rgba(52,211,153,0.2);border:1px solid rgba(52,211,153,0.4)' : 'background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1)'">
                <Brain v-if="currentStep === 2" class="w-3.5 h-3.5 text-violet-300 animate-pulse" stroke-width="2.5"/>
                <CheckCircle2 v-else-if="currentStep > 2" class="w-3.5 h-3.5 text-emerald-400" stroke-width="2.5"/>
                <span v-else class="text-[11px] font-black text-white/20">2</span>
              </div>
              <span class="text-[10px] font-bold transition-colors" :class="currentStep === 2 ? 'text-violet-300' : currentStep > 2 ? 'text-white/50' : 'text-white/20'">AI Score</span>
            </div>

            <!-- Connector 2 -->
            <div class="h-px flex-1 mb-6 transition-all duration-1000" :style="currentStep > 2 ? 'background: linear-gradient(90deg, rgba(139,92,246,0.6), rgba(14,165,233,0.6))' : 'background: rgba(255,255,255,0.06)'"></div>

            <!-- Step 3 -->
            <div class="flex flex-col items-center" style="min-width:100px;">
              <div class="w-8 h-8 rounded-full flex items-center justify-center mb-2 transition-all duration-500"
                :style="currentStep === 3 ? 'background:rgba(14,165,233,0.25);box-shadow:0 0 16px rgba(14,165,233,0.4);border:1px solid rgba(14,165,233,0.5)' : currentStep > 3 ? 'background:rgba(52,211,153,0.2);border:1px solid rgba(52,211,153,0.4)' : 'background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1)'">
                <Database v-if="currentStep === 3" class="w-3.5 h-3.5 text-sky-300 animate-pulse" stroke-width="2.5"/>
                <CheckCircle2 v-else-if="currentStep > 3" class="w-3.5 h-3.5 text-emerald-400" stroke-width="2.5"/>
                <span v-else class="text-[11px] font-black text-white/20">3</span>
              </div>
              <span class="text-[10px] font-bold transition-colors" :class="currentStep === 3 ? 'text-sky-300' : currentStep > 3 ? 'text-white/50' : 'text-white/20'">CRM Sync</span>
            </div>
          </div>

          <!-- === STATS FOOTER === -->
          <div class="mx-6 mb-6 rounded-[14px] relative z-10" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);backdrop-filter:blur(20px);">
            <div class="flex items-center divide-x divide-white/8">
              <div class="flex-1 flex flex-col items-center py-4">
                <span class="text-[20px] font-black text-white tracking-tight">{{ elapsedTime }}<span class="text-[12px] text-white/30 font-semibold ml-0.5">s</span></span>
                <span class="text-[10px] font-semibold text-white/30 uppercase tracking-wider mt-0.5">Elapsed</span>
              </div>
              <div class="flex-1 flex flex-col items-center py-4">
                <span class="text-[20px] font-black tracking-tight" :class="processedLeads > 0 ? 'text-emerald-400' : 'text-white/20'">{{ processedLeads }}</span>
                <span class="text-[10px] font-semibold text-white/30 uppercase tracking-wider mt-0.5">Captured</span>
              </div>
              <div class="flex-1 flex flex-col items-center py-4">
                <button @click="cancelScraping" class="text-[11px] font-black text-red-400/50 hover:text-red-400 transition-colors uppercase tracking-wider">Abort</button>
                <span class="text-[10px] font-semibold text-white/20 uppercase tracking-wider mt-0.5">Mission</span>
              </div>
            </div>
          </div>

        </div>
      </template>

      `;

const newContent = content.substring(0, si) + newBlock + endString + content.substring(ei + endString.length);
fs.writeFileSync(file, newContent, 'utf8');
console.log('Done! Lines:', newContent.split('\n').length);
