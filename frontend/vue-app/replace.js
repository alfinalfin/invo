const fs = require('fs');
const file = 'c:/Users/alfin/Documents/invocrm/frontend/vue-app/components/crm/ScrapeLeadsModal.vue';
let content = fs.readFileSync(file, 'utf8');

const startString = `<!-- 2 Column Body -->`;
const endString = `<!-- Footer Actions -->`;

const startIndex = content.indexOf(startString);
const endIndex = content.indexOf(endString);

if (startIndex === -1 || endIndex === -1) {
  console.error('Markers not found');
  process.exit(1);
}

const replacement = `<!-- Unified Scrollable Body -->
        <div class="flex-1 overflow-y-auto no-scrollbar p-6 lg:p-8 space-y-8 bg-surface dark:bg-[#0c1322]/20">
            
            <!-- ROW 1: Search Architecture -->
            <div class="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-10">
               
               <!-- Left: Keywords -->
               <div class="lg:col-span-3 space-y-4">
                 <label class="text-[14px] font-black text-on-surface tracking-wide flex items-center gap-2">
                    <div class="w-1.5 h-1.5 rounded-full bg-primary"></div> Target Keywords
                 </label>
                 <div class="flex flex-wrap items-center gap-2 rounded-2xl border-2 border-outline-variant/30 bg-white dark:bg-surface-container-lowest p-4 min-h-[72px] focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 transition-all shadow-sm">
                   <template v-for="kw in keywords" :key="kw">
                     <span class="flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-2 text-sm font-bold text-primary border border-primary/20 hover:-translate-y-0.5 transition-transform">
                       {{ kw }}
                       <button @click="removeKeyword(kw)" class="hover:text-primary transition-colors hover:bg-primary/20 rounded-full p-0.5">
                         <X class="h-4 w-4" stroke-width="3" />
                       </button>
                     </span>
                   </template>
                   <input
                     v-model="keywordInput"
                     @keydown="addKeyword"
                     placeholder="Type keyword and press Enter..."
                     class="min-w-[200px] flex-1 bg-transparent px-2 py-2 text-sm font-semibold text-on-surface placeholder:font-medium placeholder:text-outline outline-none border-none focus:ring-0"
                   />
                 </div>
               </div>

               <!-- Right: Location & Volume -->
               <div class="lg:col-span-2 space-y-6">
                 <!-- Location -->
                 <div class="space-y-4">
                   <label class="text-[14px] font-black text-on-surface tracking-wide flex items-center gap-2">
                      <div class="w-1.5 h-1.5 rounded-full bg-primary"></div> Geographic Region
                   </label>
                   <div class="relative group mt-2" ref="locationRef">
                     <MapPin class="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors" stroke-width="2.5" />
                     <input
                       v-model="locationSearch"
                       @focus="showPredictions = true"
                       placeholder="e.g. London, UK"
                       class="w-full appearance-none rounded-2xl border-2 border-outline-variant/30 bg-white dark:bg-surface-container-lowest hover:bg-surface-container-low transition-colors py-4 px-14 text-[15px] font-bold text-on-surface outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 shadow-sm"
                     />
                     <div v-if="showPredictions && placePredictions.length > 0" class="absolute z-50 left-0 right-0 top-[calc(100%+8px)] max-h-60 overflow-y-auto rounded-2xl border-2 border-outline-variant/30 bg-surface shadow-xl py-2 no-scrollbar">
                       <button
                         v-for="place in placePredictions"
                         :key="place.place_id"
                         @click.prevent="selectLocation(place)"
                         class="w-full text-left px-5 py-3 text-[14px] font-bold text-on-surface hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-3 border-b border-outline-variant/10 last:border-0"
                       >
                         <MapPin class="h-4 w-4 shrink-0 text-outline" />
                         <span class="truncate">{{ place.description }}</span>
                       </button>
                     </div>
                   </div>
                 </div>

                 <!-- Max Leads Slider -->
                 <div class="space-y-4 pt-1">
                   <div class="flex items-center justify-between">
                     <label class="text-[14px] font-black text-on-surface tracking-wide flex items-center gap-2">
                        <div class="w-1.5 h-1.5 rounded-full bg-primary"></div> Extraction Volume
                     </label>
                     <div class="text-[13px] font-black bg-primary/10 text-primary px-3 py-1 rounded-xl border border-primary/20">
                       {{ maxLeads }} <span class="opacity-80 ml-1 uppercase tracking-widest text-[10px]">Leads</span>
                     </div>
                   </div>
                   <div class="relative w-full px-2 pt-2">
                     <input
                       type="range"
                       v-model="maxLeads"
                       min="10"
                       max="100"
                       step="10"
                       class="custom-slider w-full h-2 appearance-none rounded-full bg-outline-variant/30 outline-none"
                     />
                     <div class="flex justify-between items-center mt-3">
                       <span class="text-[10px] font-black uppercase text-outline tracking-wider">10 (Quick)</span>
                       <span class="text-[10px] font-black uppercase text-outline tracking-wider">100 (Deep)</span>
                     </div>
                   </div>
                 </div>
               </div>
            </div>

            <!-- ROW 2: Engine Configuration -->
            <div class="space-y-8 pt-8 border-t border-outline-variant/10">
               
               <!-- Data Sources -->
               <div class="space-y-4">
                  <label class="text-[14px] font-black text-on-surface tracking-wide flex items-center gap-2">
                     <div class="w-1.5 h-1.5 rounded-full bg-purple-500"></div> Intelligence Sources
                  </label>
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <!-- Maps -->
                     <label 
                       class="flex w-full items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all duration-300"
                       :class="sourceMaps ? 'bg-white dark:bg-[#131b2e] border-blue-500 ring-1 ring-blue-500 shadow-md transform -translate-y-0.5' : 'bg-surface border-outline-variant/30 hover:border-outline-variant/80'"
                     >
                       <div class="flex items-center gap-3">
                         <div class="flex h-10 w-10 items-center justify-center rounded-[14px] bg-blue-500/10 text-blue-600 transition-colors">
                           <MapPin class="h-5 w-5" stroke-width="2.5" />
                         </div>
                         <div class="flex flex-col">
                            <span class="text-[13px] font-extrabold transition-colors" :class="sourceMaps ? 'text-blue-600 dark:text-blue-400' : 'text-on-surface'">Google Maps</span>
                            <span class="text-[10px] font-semibold text-outline">Geospatial Data</span>
                         </div>
                       </div>
                       <div class="flex items-center">
                         <span v-if="sourceMaps" class="text-[9px] font-black tracking-widest uppercase bg-blue-600 text-white px-2.5 py-1 rounded-full shadow-sm">ON</span>
                         <input type="checkbox" v-model="sourceMaps" class="hidden" />
                       </div>
                     </label>

                     <!-- LinkedIn -->
                     <label 
                       class="flex w-full items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all duration-300 relative overflow-hidden"
                       :class="sourceLinkedIn ? 'bg-white dark:bg-[#131b2e] border-[#0a66c2] ring-1 ring-[#0a66c2] shadow-md transform -translate-y-0.5' : 'bg-surface border-outline-variant/30 hover:border-outline-variant/80'"
                     >
                       <div v-if="sourceLinkedIn" class="absolute right-0 top-0 w-24 h-24 bg-[#0a66c2]/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
                       <div class="flex items-center gap-3 relative z-10">
                         <div class="flex h-10 w-10 items-center justify-center rounded-[14px] text-white shadow-sm transition-all duration-300" :class="sourceLinkedIn ? 'bg-[#0a66c2]' : 'bg-slate-300 dark:bg-slate-700'">
                           <Linkedin class="h-5 w-5" stroke-width="2.5" />
                         </div>
                         <div class="flex flex-col">
                            <span class="text-[13px] font-extrabold transition-colors" :class="sourceLinkedIn ? 'text-[#0a66c2]' : 'text-on-surface'">LinkedIn AI</span>
                            <span class="text-[10px] font-semibold text-outline">Executive Data</span>
                         </div>
                       </div>
                       <div class="flex items-center relative z-10">
                         <span v-if="sourceLinkedIn" class="text-[9px] font-black tracking-widest uppercase bg-[#0a66c2] text-white px-2.5 py-1 rounded-full shadow-sm">ON</span>
                         <input type="checkbox" v-model="sourceLinkedIn" class="hidden" />
                       </div>
                     </label>

                     <!-- Directories -->
                     <label 
                       class="flex w-full items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all duration-300"
                       :class="sourceDirectories ? 'bg-white dark:bg-[#131b2e] border-purple-500 ring-1 ring-purple-500 shadow-md transform -translate-y-0.5' : 'bg-surface border-outline-variant/30 hover:border-outline-variant/80'"
                     >
                       <div class="flex items-center gap-3">
                         <div class="flex h-10 w-10 items-center justify-center rounded-[14px] bg-purple-500/10 text-purple-600 transition-colors">
                           <Database class="h-5 w-5" stroke-width="2.5" />
                         </div>
                         <div class="flex flex-col">
                            <span class="text-[13px] font-extrabold transition-colors" :class="sourceDirectories ? 'text-purple-600 dark:text-purple-400' : 'text-on-surface'">Global Dirs</span>
                            <span class="text-[10px] font-semibold text-outline">Registry Listings</span>
                         </div>
                       </div>
                       <div class="flex items-center">
                         <span v-if="sourceDirectories" class="text-[9px] font-black tracking-widest uppercase bg-purple-600 text-white px-2.5 py-1 rounded-full shadow-sm">ON</span>
                         <input type="checkbox" v-model="sourceDirectories" class="hidden" />
                       </div>
                     </label>
                  </div>
               </div>

               <!-- Pipeline Toggles -->
               <div class="space-y-4">
                  <label class="text-[14px] font-black text-on-surface tracking-wide flex items-center gap-2">
                     <div class="w-1.5 h-1.5 rounded-full bg-blue-500"></div> Pipeline Automation
                  </label>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                     
                     <div class="border rounded-[20px] p-5 transition-all duration-300 cursor-pointer group bg-white dark:bg-surface-container-lowest" :class="enableAIFiltering ? 'border-primary shadow-sm' : 'border-outline-variant/30 hover:border-outline-variant/60'" @click="enableAIFiltering = !enableAIFiltering">
                        <div class="flex items-start justify-between gap-4">
                          <div>
                            <h4 class="text-[13px] font-extrabold text-on-surface transition-colors" :class="enableAIFiltering ? 'text-primary' : ''">Enable AI Filtering</h4>
                            <p class="text-[11px] font-medium text-outline mt-1.5 leading-relaxed pr-2">
                              Filter out irrelevant hits using generative language models in real-time.
                            </p>
                          </div>
                          <label class="relative inline-flex cursor-pointer items-center shrink-0 mt-0.5">
                            <div class="h-6 w-11 rounded-full transition-colors duration-300" :class="enableAIFiltering ? 'bg-primary' : 'bg-outline-variant/40'"></div>
                            <div class="absolute left-[2px] top-[2px] h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-300" :class="enableAIFiltering ? 'translate-x-full' : ''"></div>
                          </label>
                        </div>
                     </div>

                     <div class="border rounded-[20px] p-5 transition-all duration-300 cursor-pointer group bg-white dark:bg-surface-container-lowest" :class="skipExisting ? 'border-primary shadow-sm' : 'border-outline-variant/30 hover:border-outline-variant/60'" @click="skipExisting = !skipExisting">
                        <div class="flex items-start justify-between gap-4">
                          <div>
                            <h4 class="text-[13px] font-extrabold text-on-surface transition-colors" :class="skipExisting ? 'text-primary' : ''">Skip Existing Leads</h4>
                            <p class="text-[11px] font-medium text-outline mt-1.5 leading-relaxed pr-2">
                              Automatically cross-reference & discard if already in your CRM.
                            </p>
                          </div>
                          <label class="relative inline-flex cursor-pointer items-center shrink-0 mt-0.5">
                    <div class="h-6 w-11 rounded-full transition-colors duration-300" :class="skipExisting ? 'bg-primary' : 'bg-outline-variant/40'"></div>
                            <div class="absolute left-[2px] top-[2px] h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-300" :class="skipExisting ? 'translate-x-full' : ''"></div>
                          </label>
                        </div>
                     </div>
                     
                  </div>
               </div>

            </div>
        </div>

        `;

const newContent = content.substring(0, startIndex) + replacement + content.substring(endIndex);
fs.writeFileSync(file, newContent, 'utf8');
console.log('Successfully completed regex match and file replacement!');
