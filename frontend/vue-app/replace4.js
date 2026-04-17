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

if (si === -1 || ei === -1) { console.error('Markers not found', si, ei); process.exit(1); }

const newBlock = `      <!-- ======================== -->
      <!-- PROGRESS (SCRAPING VIEW) -->
      <template v-else-if="viewState === 'progress'">
        <div class="relative w-full flex flex-col bg-[#080d16]" style="min-height: 460px;">
          
          <!-- Ambient glow -->
          <div class="absolute inset-0 pointer-events-none overflow-hidden">
            <div class="absolute -top-40 -left-20 w-96 h-96 rounded-full bg-primary/10 blur-3xl"></div>
            <div class="absolute -bottom-20 -right-10 w-72 h-72 rounded-full bg-indigo-600/10 blur-3xl"></div>
          </div>

          <!-- Header -->
          <div class="flex items-center justify-between px-8 pt-8 pb-6 relative z-10">
            <div class="flex items-center gap-3">
              <div class="relative flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20 border border-primary/30">
                <Rocket class="w-4 h-4 text-primary" stroke-width="2.5" />
                <span class="absolute -top-1 -right-1 flex h-3 w-3">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/60 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                </span>
              </div>
              <div>
                <h3 class="text-[15px] font-black text-white">AI Engine Active</h3>
                <p class="text-[11px] text-white/40 font-medium">Extracting &amp; scoring intelligence...</p>
              </div>
            </div>
            <button @click="cancelScraping" class="p-2 text-white/30 hover:text-white/70 hover:bg-white/10 rounded-lg transition-all">
              <X class="w-4 h-4" />
            </button>
          </div>

          <!-- Steps -->
          <div class="flex-1 px-8 space-y-3 relative z-10">
            
            <div class="flex items-center gap-4 p-4 rounded-[14px] border transition-all duration-500"
              :class="currentStep === 1 ? 'bg-blue-500/10 border-blue-500/20' : currentStep > 1 ? 'bg-white/[0.03] border-white/5 opacity-60' : 'bg-transparent border-transparent opacity-20'">
              <div class="flex-none w-8 h-8 flex items-center justify-center rounded-xl"
                :class="currentStep > 1 ? 'bg-green-500/20' : 'bg-blue-500/20'">
                <RefreshCcw v-if="currentStep === 1" class="w-4 h-4 text-blue-400 animate-spin" stroke-width="2.5" />
                <CheckCircle2 v-else-if="currentStep > 1" class="w-4 h-4 text-green-400" stroke-width="2.5" />
                <div v-else class="w-1.5 h-1.5 rounded-full bg-white/20"></div>
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-[13px] font-extrabold" :class="currentStep === 1 ? 'text-blue-300' : 'text-white/50'">Indexing Directories</div>
                <div class="text-[11px] font-medium mt-0.5 text-white/25">Crawling Google Maps &amp; business registries</div>
              </div>
              <div v-if="currentStep === 1" class="text-[9px] font-black text-blue-400/50 uppercase tracking-widest shrink-0">Live</div>
            </div>

            <div class="flex items-center gap-4 p-4 rounded-[14px] border transition-all duration-500"
              :class="currentStep === 2 ? 'bg-purple-500/10 border-purple-500/20' : currentStep > 2 ? 'bg-white/[0.03] border-white/5 opacity-60' : 'bg-transparent border-transparent opacity-20'">
              <div class="flex-none w-8 h-8 flex items-center justify-center rounded-xl"
                :class="currentStep === 2 ? 'bg-purple-500/20' : currentStep > 2 ? 'bg-green-500/20' : 'bg-white/10'">
                <Brain v-if="currentStep === 2" class="w-4 h-4 text-purple-400 animate-pulse" stroke-width="2.5" />
                <CheckCircle2 v-else-if="currentStep > 2" class="w-4 h-4 text-green-400" stroke-width="2.5" />
                <div v-else class="w-1.5 h-1.5 rounded-full bg-white/20"></div>
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-[13px] font-extrabold" :class="currentStep === 2 ? 'text-purple-300' : 'text-white/50'">AI Intent Scoring</div>
                <div class="text-[11px] font-medium mt-0.5 text-white/25">Filtering high-intent prospects via LLM</div>
              </div>
              <div v-if="currentStep === 2" class="text-[9px] font-black text-purple-400/50 uppercase tracking-widest shrink-0">Live</div>
            </div>

            <div class="flex items-center gap-4 p-4 rounded-[14px] border transition-all duration-500"
              :class="currentStep === 3 ? 'bg-primary/10 border-primary/20' : currentStep > 3 ? 'bg-white/[0.03] border-white/5 opacity-60' : 'bg-transparent border-transparent opacity-20'">
              <div class="flex-none w-8 h-8 flex items-center justify-center rounded-xl"
                :class="currentStep === 3 ? 'bg-primary/20' : currentStep > 3 ? 'bg-green-500/20' : 'bg-white/10'">
                <Database v-if="currentStep === 3" class="w-4 h-4 text-blue-400 animate-pulse" stroke-width="2.5" />
                <CheckCircle2 v-else-if="currentStep > 3" class="w-4 h-4 text-green-400" stroke-width="2.5" />
                <div v-else class="w-1.5 h-1.5 rounded-full bg-white/20"></div>
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-[13px] font-extrabold" :class="currentStep === 3 ? 'text-blue-300' : 'text-white/50'">Populating CRM</div>
                <div class="text-[11px] font-medium mt-0.5 text-white/25">Writing {{ processedLeads }} leads to database</div>
              </div>
              <div v-if="currentStep === 3" class="text-[9px] font-black text-blue-400/50 uppercase tracking-widest shrink-0">Live</div>
            </div>

          </div>

          <!-- Footer -->
          <div class="px-8 pb-8 pt-6 relative z-10 space-y-4">
            <!-- Indeterminate shimmer bar -->
            <div class="w-full h-px bg-white/10 rounded-full overflow-hidden relative">
              <div class="absolute top-0 left-0 h-full bg-gradient-to-r from-transparent via-primary/80 to-transparent animate-[shimmer_1.8s_ease-in-out_infinite]" style="width: 40%;"></div>
            </div>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-4">
                <span class="text-[11px] text-white/30 font-semibold flex items-center gap-1.5">
                  <Clock class="w-3 h-3" /> {{ elapsedTime }}s elapsed
                </span>
                <span v-if="processedLeads > 0" class="text-[11px] text-green-400/60 font-bold">{{ processedLeads }} leads captured</span>
              </div>
              <button @click="cancelScraping" class="text-[11px] font-bold text-white/25 hover:text-red-400/80 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-500/10">
                Abort
              </button>
            </div>
          </div>
        </div>
      </template>

      `;

const newContent = content.substring(0, si) + newBlock + endString + content.substring(ei + endString.length);
fs.writeFileSync(file, newContent, 'utf8');
console.log('Done! File has', newContent.split('\n').length, 'lines.');
