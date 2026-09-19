/* បំបែក "ចំណងជើង៖ ខ្លឹមសារ" ជាអក្សរដិត + អត្ថបទ */
function objHTML(v){
  const t=String(v==null?"":v);
  const i=t.indexOf("៖");
  if(i<0) return escapeHtml(t);
  return '<strong class="text-sky-900">'+escapeHtml(t.slice(0,i+1))+'</strong> '+escapeHtml(t.slice(i+1).trim());
}

function getCaregiverCardHTML(isPrint, diseaseKey) {
      const key = diseaseKey || activeDiseaseTab;
      const proto = (currentProtocols && currentProtocols[key]) || Object.values(currentProtocols || {})[0] || EMPTY_PROTO;

      const mergedItems = (feedbacks || []).filter(fb => fb.targetDisease === key && fb.status === 'MERGED');
      const allRestrictions = [...textList(proto.restrictions), ...mergedItems.filter(f => f.targetSection === 'RESTRICTIONS').map(m => withAgeTag(m))];
      const allQuestions = [...textList(proto.questions), ...mergedItems.filter(f => f.targetSection === 'QUESTIONS').map(m => withAgeTag(m))];
      const allRedFlags = [...textList(proto.redFlags), ...mergedItems.filter(f => f.targetSection === 'REDFLAGS').map(m => withAgeTag(m))];

      return `
        <div class="${isPrint ? 'a4-page-lock' : ''} font-sans leading-tight">
          <!-- Professional Official Clinic Header -->
          <div class="border-b-2 border-sky-950 pb-1.5 mb-1.5 flex items-center justify-between gap-3">
            <div>
              <div class="text-[11.5pt] font-bold text-sky-950 tracking-wide flex items-center gap-2">
                <span>${CLINIC.nameKh}</span>
                <span class="text-[8.5pt] px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 font-semibold border border-sky-200">${CLINIC.nameEn}</span>
              </div>
              <h1 class="text-[12pt] font-bold text-sky-900 mt-0.5 leading-snug">${escapeHtml(PT("cgTitle","ប័ណ្ណតាមដាន និងសំណួរសួរនាំសុខភាពអ្នកជំងឺ"))} (${proto.title.split('(')[0]})</h1>
              <div class="text-[7.2pt] text-slate-500 font-medium">${escapeHtml(PT("cgTitleEn","PATIENT & CAREGIVER MONITORING FLOWSHEET"))} • ស្តង់ដារ A4 សម្រាប់អ្នកជំងឺគ្រប់វ័យ (កុមារ ពេញវ័យ ចាស់)</div>
            </div>
            
            <div class="text-right text-[7.2pt] text-slate-600 bg-sky-50/80 p-1.5 rounded-xl border border-sky-200 flex-shrink-0">
              <div><strong class="text-sky-900">ទូរសព្ទបន្ទាន់:</strong> ....................</div>
              <div><strong class="text-sky-900">បន្ទប់/គ្រែ:</strong> ....................</div>
              <div><strong class="text-sky-900">កូដ:</strong> ${docCode("CG",key)}</div>
            </div>
          </div>

          <!-- Purpose Box for Caregivers (គោលបំណងនៃការប្រើប្រាស់ប័ណ្ណ) -->
          <div class="border border-sky-300 bg-gradient-to-r from-sky-50 via-blue-50/60 to-cyan-50 p-1.5 rounded-lg mb-1.5 text-[7.5pt] text-sky-950">
            <div class="font-bold text-sky-900 text-[8pt] flex items-center gap-1 mb-0.5">
              <span class="inline-block w-2 h-2 rounded-full bg-sky-600"></span>
              <span>${escapeHtml(PT("cgObjTitle","គោលបំណងនៃការប្រើប្រាស់ប័ណ្ណនេះសម្រាប់អ្នកជំងឺ និងអាណាព្យាបាល (Caregiver Card Objectives):"))}</span>
            </div>
            <div class="grid grid-cols-3 gap-2 leading-snug">
              <div class="border-r border-sky-200 pr-1">
                ${objHTML(PT("cgObj1","១. ដឹងពីសំណួរត្រូវសួរ៖ សង្កេត និងសួរនាំអ្នកជំងឺរៀងរាល់ ២-៣ ម៉ោង មិនភ្លេចភ្លាំងចំណុចគន្លឹះ។"))}
              </div>
              <div class="border-r border-sky-200 pr-1">
                ${objHTML(PT("cgObj2","២. កត់ត្រាជូនគ្រូពេទ្យ៖ កត់ត្រាកម្តៅ ជាតិទឹកញ៉ាំ និងការនោមជាក់ស្តែងរាយការណ៍ពេលគ្រូពេទ្យចុះជុំ (Round)។"))}
              </div>
              <div>
                ${objHTML(PT("cgObj3","៣. សង្គ្រោះទាន់ពេល៖ យល់ច្បាស់ពីសញ្ញាគ្រោះថ្នាក់ (Red Flags) និងតំណម ដើម្បីចុចកណ្តឹងហៅគ្រូពេទ្យភ្លាមៗ។"))}
              </div>
            </div>
          </div>

          <!-- Info Box with Multi-Age Demographic options -->
          <div class="border border-sky-200 bg-sky-50/40 p-1.5 rounded-lg mb-1.5 text-[7.8pt]">
            <div class="grid grid-cols-3 gap-1.5">
              <div><strong>ឈ្មោះអ្នកជំងឺ៖</strong> .....................................</div>
              <div><strong>ភេទ៖</strong> [ ] ប្រុស &nbsp; [ ] ស្រី</div>
              <div><strong>អាយុ៖</strong> ....... ឆ្នាំ ([ ] កុមារ [ ] ពេញវ័យ [ ] ចាស់)</div>
              <div><strong>ទម្ងន់អ្នកជំងឺ៖</strong> ........... គ.ក</div>
              <div><strong>បន្ទប់/គ្រែ៖</strong> .........................</div>
              <div><strong>ថ្ងៃក្តៅខ្លួន (Day 1)៖</strong> ....../……/…… (ថ្ងៃទី ......)</div>
              <div><strong>អ្នកជំងឺ/អាណាព្យាបាល៖</strong> .....................................</div>
              <div><strong>ទូរសព្ទបន្ទប់ពេទ្យ៖</strong> .........................</div>
              <div><strong>វេជ្ជបណ្ឌិតទទួលបន្ទុក៖</strong> .........................</div>
            </div>
          </div>

          <!-- Level 1: Questions -->
          <div class="bg-sky-100/80 text-sky-950 font-bold px-2 py-0.5 rounded text-[8pt] mb-1 flex justify-between items-center">
            <span>ផ្នែកទី ១៖ សំណួរតាមដានប្រចាំម៉ោង (កម្រិតស្រាល — សួររៀងរាល់ ២-៣ ម៉ោងម្តង)</span>
            <span class="font-normal text-[7pt]">[តាមដានកម្លាំង និងកម្រិតជាតិទឹក]</span>
          </div>
          <table class="w-full border-collapse text-[7.5pt] mb-1 border border-slate-300">
            <thead>
              <tr class="bg-slate-100 text-slate-700">
                <th class="border border-slate-300 p-0.5 w-6 text-center">ល.រ</th>
                <th class="border border-slate-300 p-0.5 w-28 text-left">ចំណុចតាមដាន</th>
                <th class="border border-slate-300 p-0.5 text-left">សំណួរជាក់ស្តែងដែលត្រូវសួរអ្នកជំងឺ/កូនផ្ទាល់</th>
                <th class="border border-slate-300 p-0.5 w-36 text-left">ការវាយតម្លៃ/កត់ត្រា</th>
              </tr>
            </thead>
            <tbody>
              ${allQuestions.map((q, i) => {
                const labels = ["ក្បាល និងភ្នែក", "សាច់ដុំ និងឆ្អឹង", "មាត់ និងបំពង់ក", "ចំណង់អាហារ", "ការស្រេកទឹក", "ការបន្ទោបង់ (នោម)"];
                const options = [
                  "[ ] មិនឈឺ &nbsp; [ ] ឈឺស្រាល &nbsp; [ ] ឈឺខ្លាំង",
                  "[ ] ធម្មតា &nbsp; [ ] រួយខ្លួន &nbsp; [ ] ចុកខ្លាំង",
                  "[ ] ដឹងជាតិ &nbsp; [ ] ល្វីងមាត់/ឈឺក",
                  "[ ] បានច្រើន &nbsp; [ ] តិចតួច &nbsp; [ ] មិនញ៉ាំ",
                  "ទឹក/ORS ញ៉ាំ៖ ......... ml",
                  "ម៉ោងនោមចុងក្រោយ៖ ........"
                ];
                return `
                  <tr>
                    <td class="border border-slate-300 p-0.5 text-center">${i + 1}</td>
                    <td class="border border-slate-300 p-0.5 font-semibold">${labels[i] || 'តាមដានទូទៅ'}</td>
                    <td class="border border-slate-300 p-0.5">${escapeHtml(q)}</td>
                    <td class="border border-slate-300 p-0.5">${options[i] || '[ ] ធម្មតា &nbsp; [ ] ប្រែប្រួល'}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          <!-- Caregiver Contraindications & Restrictions -->
          <div class="border border-rose-300 bg-rose-50/50 p-1.5 rounded-lg mb-1 text-[7.2pt] text-rose-950">
            <div class="font-bold text-rose-900 text-[7.8pt] flex items-center justify-between mb-0.5">
              <span>🚫 តំណម និងការប្រុងប្រយ័ត្នសម្រាប់អ្នកជំងឺ/អាណាព្យាបាល (Strict Restrictions):</span>
              <span class="text-[6.8pt] text-rose-700 font-semibold bg-rose-100 px-1 rounded">ហាមដាច់ខាត</span>
            </div>
            <div class="grid grid-cols-2 gap-x-2 gap-y-0.5">
              ${allRestrictions.map(r => `<div>• ${escapeHtml(r)}</div>`).join('')}
            </div>
          </div>

          <!-- Level 3: Red Flags -->
          <div class="border border-rose-400 bg-rose-50/70 p-1.5 rounded-lg mb-1 text-[7.5pt] text-rose-950">
            <div class="font-bold text-rose-800 text-[8pt] mb-0.5">🚨 សញ្ញាអាសន្នធ្ងន់ធ្ងរ (RED FLAGS) — ចុចកណ្តឹង ឬរត់ទៅហៅគ្រូពេទ្យភ្លាមៗ!</div>
            <div class="grid grid-cols-2 gap-x-3 gap-y-0.5">
              ${allRedFlags.map(rf => `<div>• ${escapeHtml(rf)}</div>`).join('')}
              <div class="col-span-2">• <strong>ពិបាកដកដង្ហើម/ណែនទ្រូង:</strong> ដកដង្ហើមដង្ហក់ ផតដើមទ្រូង ឬ SpO2 < 95%។</div>
            </div>
          </div>

          <!-- Quick Tracker Table -->
          <div class="font-bold text-[7.8pt] text-slate-800 mb-0.5">${escapeHtml(PT("qtTitle","តារាងកត់ត្រារហ័សប្រចាំថ្ងៃ (Quick Time Tracker)"))}</div>
          <table class="w-full border-collapse text-[7.2pt] mb-1 border border-slate-300">
            <thead>
              <tr class="bg-slate-100 text-slate-700">
                <th class="border border-slate-300 p-0.5 w-11 text-center">ម៉ោង</th>
                <th class="border border-slate-300 p-0.5 w-14 text-center">កម្តៅ (°C)</th>
                <th class="border border-slate-300 p-0.5 w-20 text-center">ទឹក/ORS ញ៉ាំ</th>
                <th class="border border-slate-300 p-0.5 w-20 text-center">នោម (បាន/អត់)</th>
                <th class="border border-slate-300 p-0.5 w-14 text-center">ក្អួត (ដង)</th>
                <th class="border border-slate-300 p-0.5 text-left">អាការៈប្លែកដែលបានសង្កេតឃើញ</th>
              </tr>
            </thead>
            <tbody>
              <tr><td class="border border-slate-300 p-0.5 text-center">06:00</td><td></td><td></td><td class="text-center">[ ] បាន &nbsp; [ ] អត់</td><td></td><td></td></tr>
              <tr><td class="border border-slate-300 p-0.5 text-center">10:00</td><td></td><td></td><td class="text-center">[ ] បាន &nbsp; [ ] អត់</td><td></td><td></td></tr>
              <tr><td class="border border-slate-300 p-0.5 text-center">14:00</td><td></td><td></td><td class="text-center">[ ] បាន &nbsp; [ ] អត់</td><td></td><td></td></tr>
              <tr><td class="border border-slate-300 p-0.5 text-center">18:00</td><td></td><td></td><td class="text-center">[ ] បាន &nbsp; [ ] អត់</td><td></td><td></td></tr>
              <tr><td class="border border-slate-300 p-0.5 text-center">22:00</td><td></td><td></td><td class="text-center">[ ] បាន &nbsp; [ ] អត់</td><td></td><td></td></tr>
              <tr><td class="border border-slate-300 p-0.5 text-center">យប់</td><td></td><td></td><td class="text-center">[ ] បាន &nbsp; [ ] អត់</td><td></td><td></td></tr>
            </tbody>
          </table>

          <div class="border border-dashed border-slate-300 p-1 rounded text-[7pt] text-slate-600">
            <strong>កំណត់សម្គាល់៖</strong> ពេលស្រកកម្តៅមិនមែនជាដំណាក់កាលជាសះស្បើយទេ គឺជាដំណាក់កាលងាយធ្លាក់ចុះសម្ពាធឈាម (Shock) បំផុតចំពោះគ្រប់វ័យ។ សូមសួរសំណួរផ្នែកទី ១ ជាប្រចាំ និងចុចកណ្តឹងហៅបន្ទាន់ពេលឃើញសញ្ញាក្នុងផ្នែក Red Flags។
          </div>
        </div>
      `;
    }

    function getStaffFlowsheetHTML(isPrint, diseaseKey) {
      const key = diseaseKey || activeDiseaseTab;
      const proto = (currentProtocols && currentProtocols[key]) || Object.values(currentProtocols || {})[0] || EMPTY_PROTO;

      const mergedItems = (feedbacks || []).filter(fb => fb.targetDisease === key && fb.status === 'MERGED');

      const allQuestions = [...textList(proto.questions), ...mergedItems.filter(f => f.targetSection === 'QUESTIONS').map(m => withAgeTag(m))];
      const allRestrictions = [...textList(proto.restrictions), ...mergedItems.filter(f => f.targetSection === 'RESTRICTIONS').map(m => withAgeTag(m))];
      const allRedFlags = [...textList(proto.redFlags), ...mergedItems.filter(f => f.targetSection === 'REDFLAGS').map(m => withAgeTag(m))];
      const allOrders = [...textList(proto.orders), ...mergedItems.filter(f => f.targetSection === 'ORDERS').map(m => withAgeTag(m))];
      const allMonitoring = [...textList(proto.monitoring), ...mergedItems.filter(f => f.targetSection === 'MONITORING').map(m => withAgeTag(m))];
      const allEscalation = [...textList(proto.escalation), ...mergedItems.filter(f => f.targetSection === 'ESCALATION').map(m => withAgeTag(m))];

      return `
        <div class="${isPrint ? 'a4-page-lock' : ''} font-sans leading-tight">
          <!-- Professional Official Clinic Header -->
          <div class="border-b-2 border-slate-800 pb-1.5 mb-1.5 flex items-center justify-between gap-3">
            <div>
              <div class="text-[11.5pt] font-bold text-slate-900 tracking-wider flex items-center gap-2">
                <span>${CLINIC.nameKh}</span>
                <span class="text-[8.5pt] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold border border-slate-300">${CLINIC.nameEn}</span>
              </div>
              <h1 class="text-[12pt] font-bold text-slate-900 mt-0.5 leading-snug">${escapeHtml(PT("stTitle","ពិធីការស្តង់ដារ និងតារាងតាមដានគ្លីនិក"))} (${escapeHtml(PT("stTitleEn","INPATIENT CLINICAL FLOWSHEET"))})</h1>
              <div class="text-[7.2pt] text-slate-500 font-medium">ឯកសារការងារសម្រាប់វេជ្ជបណ្ឌិត និងគិលានុបដ្ឋាយិកាប្រចាំការ | គ្រប់វ័យ (កុមារ ពេញវ័យ ចាស់) | Ref: ${docCode("SOP",key)}</div>
            </div>

            <div class="text-right text-[7.2pt] text-slate-600 bg-slate-50 p-1.5 rounded-xl border border-slate-300 flex-shrink-0">
              <div><strong class="text-slate-800">ឯកសារលេខ:</strong> ${docCode("FLOW","01")}</div>
              <div><strong class="text-slate-800">អនុម័តដោយ:</strong> ប្រធានគ្លីនិក</div>
              <div><strong class="text-slate-800">កាលបរិច្ឆេទ:</strong> 2026</div>
            </div>
          </div>

          <div class="border border-slate-300 bg-slate-50 p-1.5 rounded mb-1.5 text-[8pt]">
            <table class="w-full border-none">
              <tr>
                <td><strong>ឈ្មោះអ្នកជំងឺ៖</strong> .....................................</td>
                <td><strong>ភេទ៖</strong> [ ] ប្រុស  [ ] ស្រី</td>
                <td><strong>អាយុ៖</strong> ........ ឆ្នាំ ([ ] កុមារ [ ] ពេញវ័យ [ ] ចាស់)</td>
                <td><strong>ទម្ងន់៖</strong> ........ គ.ក</td>
              </tr>
              <tr>
                <td><strong>បន្ទប់/គ្រែ៖</strong> .........................</td>
                <td><strong>ថ្ងៃក្តៅខ្លួន (Day 1)៖</strong> ....../……/……</td>
                <td><strong>ថ្ងៃទីនៃជំងឺ៖</strong> ថ្ងៃទី ......</td>
                <td><strong>វេជ្ជបណ្ឌិត៖</strong> .........................</td>
              </tr>
              <tr>
                <td colspan="4"><strong>ជំងឺប្រចាំកាយ (Comorbidities)៖</strong> [ ] គ្មាន  [ ] លើសសម្ពាធឈាម  [ ] ទឹកនោមផ្អែម  [ ] ជំងឺបេះដូង  [ ] តម្រងនោម  [ ] ហឺត/សួត  [ ] ផ្សេងៗ: ................</td>
              </tr>
            </table>
          </div>

          <!-- Section 1: Clinical Pillars -->
          <table class="w-full border-collapse text-[7.5pt] mb-1.5 border border-slate-300">
            <thead>
              <tr class="bg-slate-100">
                <th class="border border-slate-300 p-1 w-1/4 text-left">សរសរទ្រូងនៃពិធីការ</th>
                <th class="border border-slate-300 p-1 text-left">ខ្លឹមសារស្តង់ដារ និងបទបញ្ជាគ្លីនិក (គ្រប់វ័យ & ទាំងពីរភេទ)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="border border-slate-300 p-1 font-bold text-sky-900">១. សំណួរសួរនាំអ្នកជំងឺ/អាណាព្យាបាល</td>
                <td class="border border-slate-300 p-1">
                  ${allQuestions.map(q => `• ${escapeHtml(q)}`).join('<br>')}
                </td>
              </tr>
              <tr>
                <td class="border border-slate-300 p-1 font-bold text-rose-800">២. តំណមដាច់ខាត (Contraindications)</td>
                <td class="border border-slate-300 p-1">
                  ${allRestrictions.map(r => `• ${escapeHtml(r)}`).join('<br>')}
                </td>
              </tr>
              <tr>
                <td class="border border-slate-300 p-1 font-bold text-amber-800">៣. សញ្ញាគ្រោះថ្នាក់ (Red Flags)</td>
                <td class="border border-slate-300 p-1">
                  ${allRedFlags.map(rf => `• ${escapeHtml(rf)}`).join('<br>')}
                </td>
              </tr>
              <tr>
                <td class="border border-slate-300 p-1 font-bold text-indigo-900">៤. បទបញ្ជាព្យាបាល & សេរ៉ូម</td>
                <td class="border border-slate-300 p-1">
                  ${allOrders.map(o => `• ${escapeHtml(o)}`).join('<br>')}
                </td>
              </tr>
              ${allMonitoring.length ? `
              <tr class="keep-together">
                <td class="border border-slate-300 p-1 font-bold text-teal-900">៥. ការតាមដាន & ការចេញពីគ្លីនិក</td>
                <td class="border border-slate-300 p-1">
                  ${allMonitoring.map(x => `• ${escapeHtml(x)}`).join('<br>')}
                </td>
              </tr>` : ''}
              ${allEscalation.length ? `
              <tr class="keep-together">
                <td class="border border-slate-300 p-1 font-bold text-fuchsia-900">៦. ការជូនដំណឹងបន្ទាន់ & SBAR</td>
                <td class="border border-slate-300 p-1">
                  ${allEscalation.map(x => `• ${escapeHtml(x)}`).join('<br>')}
                </td>
              </tr>` : ''}
            </tbody>
          </table>

          <!-- Vital Signs & Fluid Tracker -->
          <div class="font-bold text-[7.8pt] text-slate-800 mb-0.5">តារាងតាមដានសញ្ញាជីវិត និងបាលែនជាតិទឹក (Vital Signs & Fluid Intake/Output)</div>
          <table class="w-full border-collapse text-[7.2pt] mb-1.5 border border-slate-300">
            <thead>
              <tr class="bg-slate-100">
                <th rowspan="2" class="border border-slate-300 p-0.5 text-center w-11">ម៉ោង</th>
                <th colspan="4" class="border border-slate-300 p-0.5 text-center">សញ្ញាជីវិត (Vital Signs)</th>
                <th colspan="2" class="border border-slate-300 p-0.5 text-center">ជាតិទឹកចូល (Intake)</th>
                <th colspan="2" class="border border-slate-300 p-0.5 text-center">ជាតិទឹកចេញ (Output)</th>
                <th rowspan="2" class="border border-slate-300 p-0.5 text-left">សញ្ញាគ្លីនិក/ស្មារតី/ស្បែក</th>
                <th rowspan="2" class="border border-slate-300 p-0.5 text-center w-14">គិលានុបដ្ឋាក</th>
              </tr>
              <tr class="bg-slate-50">
                <th class="border border-slate-300 p-0.5">T (°C)</th>
                <th class="border border-slate-300 p-0.5">BP</th>
                <th class="border border-slate-300 p-0.5">PR</th>
                <th class="border border-slate-300 p-0.5">RR</th>
                <th class="border border-slate-300 p-0.5">IVF (ml)</th>
                <th class="border border-slate-300 p-0.5">ញ៉ាំ/ORS</th>
                <th class="border border-slate-300 p-0.5">នោម (ml)</th>
                <th class="border border-slate-300 p-0.5">ក្អួត/រាគ</th>
              </tr>
            </thead>
            <tbody>
              <tr><td class="border border-slate-300 p-0.5 text-center">06:00</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
              <tr><td class="border border-slate-300 p-0.5 text-center">10:00</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
              <tr><td class="border border-slate-300 p-0.5 text-center">14:00</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
              <tr><td class="border border-slate-300 p-0.5 text-center">18:00</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
              <tr><td class="border border-slate-300 p-0.5 text-center">22:00</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
            </tbody>
          </table>

          <!-- Escalation Log -->
          <div class="border border-slate-300 p-1.5 rounded text-[7.2pt]">
            <strong>កំណត់ត្រារាយការណ៍វេជ្ជសាស្ត្របន្ទាន់ (Doctor Escalation Log):</strong>
            <table class="w-full border-none mt-0.5">
              <tr>
                <td style="width: 25%;">ម៉ោងរាយការណ៍៖ ........................</td>
                <td style="width: 35%;">វេជ្ជបណ្ឌិតទទួលព័ត៌មាន៖ ........................</td>
                <td style="width: 40%;">បទបញ្ជាទទួលបាន៖ .............................................</td>
              </tr>
            </table>
          </div>
        </div>
      `;
    }
