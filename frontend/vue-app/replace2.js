const fs = require('fs');
const file = 'c:/Users/alfin/Documents/invocrm/frontend/vue-app/components/crm/ScrapeLeadsModal.vue';
let content = fs.readFileSync(file, 'utf8');

// Replace the max width class
content = content.replace(
  `viewState === 'setup'    ? 'max-w-5xl h-[85vh] flex flex-col' : ''`,
  `viewState === 'setup'    ? 'max-w-[660px] max-h-[90vh] flex flex-col' : ''`
);

const startString = `<!-- Header -->`;
const endString = `</template>`;

const startIndex = content.indexOf(startString);
const endIndex = content.indexOf(endString, startIndex);

if (startIndex === -1 || endIndex === -1) {
  console.error("Markers not found");
  process.exit(1);
}

const replacement = `<!-- Header -->
        <div class="px-8 pt-8 pb-5 flex-none border-b border-outline-variant/15 relative overflow-hidden bg-surface dark:bg-surface-container-lowest">
          <div class="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none"></div>
          <div class="flex items-start justify-between relative z-10">
            <div>
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                  <Search class="h-5 w-5" stroke-width="2.5" />
                </div>
                <h2 class="text-2xl font-black tracking-tight text-on-surface">Scrape Engine</h2>
              </div>
              <p class="text-[13px] text-outline mt-2 font-semibold">
                Configure intent signals and extraction targets.
              </p>
            </div>
            <button
              @click="closeModal"
              class="rounded-full p-2 text-outline hover:bg-surface-variant hover:text-on-surface transition-colors"
            >
              <X class="h-5 w-5" stroke-width="2.5" />
            </button>
          </div>
        </div>

        <!-- Narrow Form Body -->
        <div class="flex-1 overflow-y-auto no-scrollbar p-8 space-y-8 bg-surface-container-lowest dark:bg-[#080d16]">
            
            <!-- SECTION: Target Acquisition -->
            <div class="space-y-6">
              
              <!-- Keywords -->
              <div class="space-y-2">
                 <label class="text-[13px] font-black text-on-surface tracking-wide flex items-center gap-2">Target Keywords</label>
                 <div class="flex flex-wrap items-center gap-2 rounded-[14px] border border-outline-variant/40 bg-surface p-3 min-h-[56px] focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all shadow-sm">
                   <template v-for="kw in keywords" :key="kw">
                     <span class="flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1.5 text-xs font-bold text-primary border border-primary/20">
                       {{ kw }}
                       <button @click="removeKeyword(kw)" class="hover:text-primary transition-colors hover:bg-primary/20 rounded-full p-0.5">
                         <X class="h-3 w-3" stroke-width="3" />
                       </button>
                     </span>
                   </template>
                   <input
                     v-model="keywordInput"
                     @keydown="addKeyword"
                     placeholder="e.g. freight forwarder..."
                     class="min-w-[150px] flex-1 bg-transparent px-2 py-1 text-[13px] font-semibold text-on-surface placeholder:text-outline outline-none border-none focus:ring-0"
                   />
                 </div>
              </div>

              <!-- Location -->
              <div class="space-y-2">
                 <label class="text-[13px] font-black text-on-surface tracking-wide flex items-center gap-2">Geographic Region</label>
                 <div class="relative group" ref="locationRef">
                   <MapPin class="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-outline transition-colors" stroke-width="2.5" />
                   <input
                     v-model="locationSearch"
                     @focus="showPredictions = true"
                     placeholder="e.g. London, United Kingdom"
                     class="w-full appearance-none rounded-[14px] border border-outline-variant/40 bg-surface py-3.5 px-11 text-[13px] font-semibold text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm"
                   />
                   <div v-if="showPredictions && placePredictions.length > 0" class="absolute z-50 left-0 right-0 top-[calc(100%+6px)] max-h-52 overflow-y-auto rounded-[14px] border border-outline-variant/30 bg-surface shadow-xl py-2 no-scrollbar">
                     <button
                       v-for="place in placePredictions"
                       :key="place.place_id"
                       @click.prevent="selectLocation(place)"
                       class="w-full text-left px-5 py-2.5 text-[13px] font-bold text-on-surface hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-3"
                     >
                       <MapPin class="h-4 w-4 shrink-0 text-outline" />
                       <span class="truncate">{{ place.description }}</span>
                     </button>
                   </div>
                 </div>
              </div>

              <!-- Volume Slider -->
              <div class="space-y-4 pt-2">
                 <div class="flex items-center justify-between">
                   <label class="text-[13px] font-black text-on-surface tracking-wide">Extraction Volume</label>
                   <div class="text-[12px] font-black bg-surface-variant text-on-surface px-3 py-1 rounded-lg border border-outline-variant/40">
                     {{ maxLeads }} <span class="opacity-60 font-semibold ml-0.5">Leads</span>
                   </div>
                 </div>
                 <div class="relative w-full px-1">
                   <input
                     type="range"
                     v-model="maxLeads"
                     min="10"
                     max="100"
                     step="10"
                     class="custom-slider w-full h-1.5 appearance-none rounded-full bg-outline-variant/40 outline-none"
                   />
                   <div class="flex justify-between items-center mt-3 text-[10px] font-bold text-outline">
                     <span>10</span>
                     <span>50</span>
                     <span>100</span>
                   </div>
                 </div>
              </div>
            </div>

            <hr class="border-outline-variant/20" />

            <!-- SECTION: Pipeline Configuration -->
            <div class="space-y-4">
              <label class="text-[13px] font-black text-on-surface tracking-wide">Intelligence Pipelines</label>
              
              <!-- Source Toggles (Compact List) -->
              <div class="flex flex-col gap-2 rounded-[16px] border border-outline-variant/30 bg-surface p-2 shadow-sm">
                
                <!-- Maps -->
                <label class="flex items-center justify-between p-3 rounded-xl hover:bg-surface-variant/50 cursor-pointer transition-colors">
                  <div class="flex items-center gap-3">
                    <div class="text-blue-500 bg-blue-500/10 p-2 rounded-lg"><MapPin class="w-4 h-4" /></div>
                    <div>
                      <div class="text-[13px] font-extrabold text-on-surface">Google Maps Core</div>
                      <div class="text-[11px] font-medium text-outline">Extract verified business listings</div>
                    </div>
                  </div>
                  <label class="relative inline-flex cursor-pointer items-center pr-1">
                    <div class="h-5 w-9 rounded-full transition-colors duration-300" :class="sourceMaps ? 'bg-primary' : 'bg-outline-variant/40'"></div>
                    <div class="absolute left-[2px] top-[2px] h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-300" :class="sourceMaps ? 'translate-x-4' : ''"></div>
                    <input type="checkbox" v-model="sourceMaps" class="hidden" />
                  </label>
                </label>

                <!-- LinkedIn -->
                <label class="flex items-center justify-between p-3 rounded-xl hover:bg-surface-variant/50 cursor-pointer transition-colors border-t border-outline-variant/10">
                  <div class="flex items-center gap-3">
                    <div class="text-[#0a66c2] bg-[#0a66c2]/10 p-2 rounded-lg"><Linkedin class="w-4 h-4" /></div>
                    <div>
                      <div class="text-[13px] font-extrabold text-on-surface">LinkedIn Cross-Ref</div>
                      <div class="text-[11px] font-medium text-outline">Append executive identities</div>
                    </div>
                  </div>
                  <label class="relative inline-flex cursor-pointer items-center pr-1">
                    <div class="h-5 w-9 rounded-full transition-colors duration-300" :class="sourceLinkedIn ? 'bg-[#0a66c2]' : 'bg-outline-variant/40'"></div>
                    <div class="absolute left-[2px] top-[2px] h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-300" :class="sourceLinkedIn ? 'translate-x-4' : ''"></div>
                    <input type="checkbox" v-model="sourceLinkedIn" class="hidden" />
                  </label>
                </label>

                <!-- System AI Filter -->
                <label class="flex items-center justify-between p-3 rounded-xl hover:bg-surface-variant/50 cursor-pointer transition-colors border-t border-outline-variant/10">
                  <div class="flex items-center gap-3">
                    <div class="text-purple-500 bg-purple-500/10 p-2 rounded-lg"><Rocket class="w-4 h-4" /></div>
                    <div>
                      <div class="text-[13px] font-extrabold text-on-surface">AI Filtering Layer</div>
                      <div class="text-[11px] font-medium text-outline">Discard poor-fit prospects instantly</div>
                    </div>
                  </div>
                  <label class="relative inline-flex cursor-pointer items-center pr-1">
                    <div class="h-5 w-9 rounded-full transition-colors duration-300" :class="enableAIFiltering ? 'bg-primary' : 'bg-outline-variant/40'"></div>
                    <div class="absolute left-[2px] top-[2px] h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-300" :class="enableAIFiltering ? 'translate-x-4' : ''"></div>
                    <input type="checkbox" v-model="enableAIFiltering" class="hidden" />
                  </label>
                </label>

              </div>
            </div>
        </div>

        <!-- Footer Actions -->
        <div class="flex-none flex items-center justify-between py-5 px-8 bg-surface border-t border-outline-variant/15 relative z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
          <div class="text-[11px] font-bold text-outline uppercase tracking-wider flex items-center gap-2">
             <span class="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e] animate-pulse"></span>
             Engine Ready
          </div>
          <div class="flex items-center gap-3">
            <button
              @click="closeModal"
              class="px-5 py-2.5 text-[13px] font-bold text-outline hover:text-on-surface rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              @click="startScraping"
              class="group flex items-center justify-center gap-2 rounded-xl bg-on-surface px-6 py-2.5 text-[13px] font-bold text-surface shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              <span>Launch</span>
              <Rocket class="w-3.5 h-3.5 ml-0.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" stroke-width="2.5" />
            </button>
          </div>
        </div>
      `;

const newContent = content.substring(0, startIndex) + replacement + content.substring(endIndex);
fs.writeFileSync(file, newContent, 'utf8');
console.log('Successfully completed regex match and file replacement!');
