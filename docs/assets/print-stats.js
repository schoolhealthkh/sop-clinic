/* ============================================================
   ១៥. មជ្ឈមណ្ឌលបោះពុម្ព A4
   ============================================================ */
const PRINT_SCOPE_ALL='__ALL__';

function printCentreHTML(){
  return `<div class="card p-6">
    <div class="flex flex-wrap items-end justify-between gap-4 pb-4 mb-5" style="border-bottom:1px solid var(--line)">
      <div class="min-w-0">
        <p class="t12 muted leading-relaxed m-0">រចនាសម្រាប់អ្នកជំងឺគ្រប់វ័យ ក្នុងទំហំ A4។ ខ្លឹមសារដែលលើសទំព័រនឹងហូរទៅទំព័របន្ទាប់ — មិនកាត់ចោលឡើយ។</p>
      </div>
      <div class="flex flex-col items-stretch sm:items-end gap-2.5">
        <div class="flex items-center gap-2">
          <label class="lab m-0 whitespace-nowrap" for="printScope">ជំងឺដែលត្រូវបោះពុម្ព</label>
          <select id="printScope" class="fld t11" style="width:auto;min-width:13rem" onchange="onPrintScopeChange()"></select>
        </div>
        <div class="flex flex-wrap gap-2 justify-end">
          <button class="btn t11" onclick="triggerPrint('caregiver')">🧾 ១. ប័ណ្ណអ្នកជំងឺ</button>
          <button class="btn t11" style="background:var(--ink)" onclick="triggerPrint('staff')">🩺 ២. SOP បុគ្គលិក</button>
          <button class="btn t11" style="background:var(--ok)" onclick="triggerPrint('both')">📚 ៣. ទាំងពីរ</button>
        </div>
        <div id="printScopeHint" class="t10 px-3 py-1.5 rounded-lg font-medium"
             style="background:color-mix(in srgb,var(--primary) 8%,transparent);color:var(--primary)"></div>
      </div>
    </div>
    <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
      <h3 class="t13 font-bold pri m-0">👁 ផ្ទាំងមើលមុនបោះពុម្ព</h3>
      <div class="flex gap-2">
        <button class="chip on" id="btn-prev-caregiver" onclick="togglePreviewType('caregiver')">ប័ណ្ណអ្នកជំងឺ</button>
        <button class="chip" id="btn-prev-staff" onclick="togglePreviewType('staff')">SOP បុគ្គលិក</button>
      </div>
    </div>
    <div class="rounded-2xl p-4 sm:p-6" style="border:2px dashed var(--line);background:var(--bg);max-height:620px;overflow:auto">
      <div id="previewCanvas" class="bg-white p-6 rounded-xl" style="color:#1e293b;border:1px solid #e2e8f0;font-size:16px;line-height:1.5"></div>
    </div>
  </div>`;
}

function populatePrintScope(){
  const sel=$('#printScope'); if(!sel) return;
  const prev=sel.value;
  const keys=diseaseKeys();
  sel.innerHTML=`<option value="${PRINT_SCOPE_ALL}">ជំងឺទាំងអស់ (${keys.length} ប្រភេទ)</option>`+
    keys.map(k=>`<option value="${k}">${escapeHtml(diseaseLabel(k))}</option>`).join('');
  sel.value = (prev && [...sel.options].some(o=>o.value===prev)) ? prev : activeDiseaseTab;
  updatePrintScopeHint();
}
function getPrintDiseaseKeys(){
  const sel=$('#printScope');
  const v=(sel&&sel.value)||activeDiseaseTab;
  return v===PRINT_SCOPE_ALL ? diseaseKeys() : [v];
}
function updatePrintScopeHint(){
  const el=$('#printScopeHint'); if(!el) return;
  const n=getPrintDiseaseKeys().length;
  el.innerHTML = n===1
    ? '១ ជំងឺ → ១ ច្បាប់ក្នុងប៊ូតុង ១ ឬ ២ · ២ ច្បាប់ក្នុងប៊ូតុង ៣'
    : `${n} ជំងឺ → ${n} ច្បាប់ក្នុងប៊ូតុង ១ ឬ ២ · <b>${n*2} ច្បាប់</b>ក្នុងប៊ូតុង ៣`;
}
function onPrintScopeChange(){ updatePrintScopeHint(); renderPrintPreview(); }
function togglePreviewType(t){
  activePreviewType=t;
  const a=$('#btn-prev-caregiver'), b=$('#btn-prev-staff');
  if(a) a.classList.toggle('on',t==='caregiver');
  if(b) b.classList.toggle('on',t==='staff');
  renderPrintPreview();
}
function buildPrintDocuments(type){
  const keys=getPrintDiseaseKeys(), parts=[];
  keys.forEach(k=>{
    if(type==='caregiver'||type==='both') parts.push(getCaregiverCardHTML(true,k));
    if(type==='staff'||type==='both')     parts.push(getStaffFlowsheetHTML(true,k));
  });
  return {html:parts.join(''),sheets:parts.length,diseases:keys.length};
}
function renderPrintPreview(){
  const c=$('#previewCanvas'); if(!c) return;
  const keys=getPrintDiseaseKeys();
  const build=k=>activePreviewType==='caregiver'?getCaregiverCardHTML(false,k):getStaffFlowsheetHTML(false,k);
  c.innerHTML=keys.map((k,i)=>`
    ${i>0?'<div class="my-6" style="border-top:2px dashed #cbd5e1"></div>':''}
    ${keys.length>1?`<div class="mb-3 t10 font-bold inline-block px-2.5 py-1 rounded-lg"
      style="background:#e0f2fe;color:#0369a1">សន្លឹកទី ${i+1} / ${keys.length} — ${escapeHtml(diseaseLabel(k))}</div>`:''}
    ${build(k)}`).join('');
}
function triggerPrint(type){
  const box=$('#printContentBody'); if(!box) return;
  const {html,sheets,diseases}=buildPrintDocuments(type);
  if(!html){ toast('គ្មានឯកសារសម្រាប់បោះពុម្ពទេ','warning'); return; }
  box.innerHTML=html;
  toast(`កំពុងរៀបចំបោះពុម្ព៖ ${sheets} ច្បាប់ (${diseases} ជំងឺ)`,'info');
  setTimeout(()=>window.print(),140);
}

/* ============================================================
   ១៦. ស្ថិតិ
   ============================================================ */
/* ពណ៌ក្រាហ្វិក — ផ្ទៀងផ្ទាត់រួចដោយឧបករណ៍វាស់ភាពខុសគ្នា (CVD)
   ស្ថានភាព៖ គូពណ៌ស្ថានភាព បូកនឹងរូបសញ្ញា និងលេខផ្ទាល់
   អាយុ៖ ជម្រាលពណ៌តែមួយ (sequential) បូកនឹងលេខផ្ទាល់ */
function chartTokens(){
  const cs=getComputedStyle(document.body);
  const v=n=>cs.getPropertyValue(n).trim();
  const dark=document.documentElement.getAttribute('data-theme')==='dark';
  return {
    ink:v('--ink'), line:v('--line'), muted:v('--muted'), surface:v('--card'),
    pending: dark?'#fcd34d':'#b45309',
    merged:  dark?'#5eead4':'#047857',
    ageRamp: dark?['#94a3b8','#bfdbfe','#60a5fa','#2563eb']
                 :['#94a3b8','#93c5fd','#3b82f6','#1e3a8a']
  };
}

function renderStats(){
  const box=$('#statsBox'); if(!box) return;
  const keys=diseaseKeys();
  const totalItems=keys.reduce((n,k)=>n+PILLAR_KEYS.reduce((m,p)=>m+(currentProtocols[k][p]||[]).length,0),0);
  const pending=feedbacks.filter(f=>f.status==='PENDING').length;
  const merged=feedbacks.filter(f=>f.status==='MERGED').length;
  const mediaN=allMedia().length;

  const tiles=[
    ['ចំណុច SOP សរុប',totalItems,`${keys.length} ជំងឺ × ៦ សសរស្តម្ភ`,'--primary'],
    ['សំណើទទួលបាន',feedbacks.length,'ពីបុគ្គលិកគ្រប់ផ្នែក','--p1'],
    ['រង់ចាំពិនិត្យ',pending,'ត្រូវការការសម្រេច','--warn'],
    ['អនុម័តចូល SOP',merged,'ក្លាយជាផ្នែកនៃស្តង់ដារ','--ok'],
    ['ឯកសារភ្ជាប់',mediaN,'រូបភាព វីដេអូ និង PDF','--p6']
  ];

  box.innerHTML=`
    <div class="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
      ${tiles.map(([l,v,s,c])=>`<div class="card p-4">
        <div class="t26 font-bold tnum" style="color:var(${c})">${v}</div>
        <div class="t11 font-semibold mt-1">${l}</div>
        <div class="t9 muted mt-[2px]">${s}</div></div>`).join('')}
    </div>

    <div class="card p-6 mb-4">
      <div class="t13 font-bold pri">ការគ្របដណ្តប់ខ្លឹមសារ SOP</div>
      <div class="t10 muted mt-1 mb-4">ចំនួនចំណុចក្នុងជំងឺនីមួយៗ តាមសសរស្តម្ភទាំង ៦ — ពណ៌ចាស់ជាង = ចំណុចច្រើនជាង</div>
      ${coverageHeatmap()}
    </div>

    <div class="grid lg:grid-cols-2 gap-4">
      <div class="card p-6">
        <div class="t13 font-bold pri">សំណើតាមជំងឺ</div>
        <div class="t10 muted mt-1 mb-3">បែងចែកតាមស្ថានភាពការពិនិត្យ</div>
        <div class="flex flex-wrap gap-3 mb-2 t10 font-semibold">
          <span class="flex items-center gap-1.5"><span style="width:11px;height:11px;border-radius:3px;background:var(--warn);display:inline-block"></span>⏳ រង់ចាំពិនិត្យ</span>
          <span class="flex items-center gap-1.5"><span style="width:11px;height:11px;border-radius:3px;background:var(--ok);display:inline-block"></span>✓ អនុម័តរួច</span>
        </div>
        <div class="chartbox"><canvas id="cDisease"></canvas></div>
      </div>
      <div class="card p-6">
        <div class="t13 font-bold pri">សំណើតាមក្រុមអាយុគោលដៅ</div>
        <div class="t10 muted mt-1 mb-3">បង្ហាញថាតើសំណើផ្តោតលើក្រុមអាយុណាខ្លះ</div>
        <div class="chartbox"><canvas id="cAge"></canvas></div>
      </div>
    </div>

    <div class="card p-6 mt-4">
      <div class="flex flex-wrap items-center gap-3 mb-3">
        <div class="t13 font-bold pri flex-1">ទិន្នន័យ</div>
        <button class="chip" onclick="exportDataJSON()">⬇ ទាញយក JSON</button>
        <button class="chip" onclick="copySOPMarkdown()">📋 ចម្លង SOP ជា Markdown</button>
        <button class="chip" onclick="refreshAll(true)">🔄 ទាញទិន្នន័យថ្មី</button>
      </div>
      <div class="t11 leading-relaxed rounded-xl p-3.5" style="background:color-mix(in srgb,var(--ok) 9%,transparent);border:1px solid color-mix(in srgb,var(--ok) 30%,transparent)">
        <b>ចែករំលែក៖</b> ចម្លងតំណទំព័រនេះផ្ញើទៅបុគ្គលិក។ ពួកគេអាចមើល ដាក់សំណើ និងឯកភាពបាន<u>ដោយមិនចាំបាច់មានគណនី</u>។
        ការអនុម័ត ការលុប ការកែពិធីការ និងការភ្ជាប់ឯកសារ តម្រូវឱ្យមានលេខសម្ងាត់អ្នកគ្រប់គ្រង។
      </div>
    </div>`;

  drawCharts();
}

/* ជម្រាលពណ៌តែមួយ + លេខក្នុងគ្រប់ប្រអប់ ដូច្នេះពណ៌មិនមែនជាការបញ្ជាក់តែមួយគត់ទេ */
function coverageHeatmap(){
  const keys=diseaseKeys(); if(!keys.length) return '';
  let max=1;
  keys.forEach(k=>PILLAR_KEYS.forEach(p=>{ max=Math.max(max,(currentProtocols[k][p]||[]).length); }));
  const cls=n=>n?('h'+Math.min(4,1+Math.floor((n/max)*3.999))):'h0';
  return `<div style="overflow-x:auto"><table class="hm apptable" style="border:none;min-width:520px">
    <thead><tr><th style="border:none;background:none"></th>
      ${PILLAR_UI.map(P=>`<th style="border:none;background:none;text-align:center;color:var(--muted);font-weight:700"
        class="t9">${P.icon}<br>${P.short}</th>`).join('')}
      <th style="border:none;background:none;text-align:center;color:var(--muted)" class="t9">សរុប</th></tr></thead>
    <tbody>${keys.map(k=>{
      const tot=PILLAR_KEYS.reduce((n,p)=>n+(currentProtocols[k][p]||[]).length,0);
      return `<tr><td style="border:none;background:none;font-weight:700;white-space:nowrap" class="t11 pri">${escapeHtml(diseaseLabel(k))}</td>
      ${PILLAR_KEYS.map(p=>{ const n=(currentProtocols[k][p]||[]).length;
        return `<td class="t11 tnum ${cls(n)}">${n}</td>`; }).join('')}
      <td style="border:none;background:none;text-align:center;font-weight:800" class="t11 tnum pri">${tot}</td></tr>`;
    }).join('')}</tbody></table></div>`;
}

let charts=[];

/* លេខផ្ទាល់លើសសរ — ដូច្នេះពណ៌មិនមែនជាការបញ្ជាក់តែមួយគត់ទេ
   (តម្រូវការភាពងាយអាន៖ តម្លៃត្រូវអានបានដោយមិនពឹងលើពណ៌) */
const valueLabels = {
  id:'valueLabels',
  afterDatasetsDraw(chart,args,opts){
    const {ctx}=chart;
    ctx.save();
    ctx.font='700 '+(opts.size||11)+'px "Kantumruy Pro", sans-serif';
    ctx.fillStyle=opts.color||'#000';
    chart.data.datasets.forEach((ds,di)=>{
      const meta=chart.getDatasetMeta(di);
      if(meta.hidden) return;
      meta.data.forEach((el,i)=>{
        const v=ds.data[i];
        if(!v) return;                       // កុំដាក់លេខ ០ ឱ្យរញ៉េរញ៉ៃ
        const pos=el.tooltipPosition();
        if(chart.options.indexAxis==='y'){
          ctx.textAlign='center'; ctx.textBaseline='middle';
          ctx.fillText(String(v),pos.x,pos.y);
        }else{
          ctx.textAlign='center'; ctx.textBaseline='bottom';
          ctx.fillText(String(v),pos.x,pos.y-5);
        }
      });
    });
    ctx.restore();
  }
};

function drawCharts(){
  if(typeof Chart==='undefined') return;
  charts.forEach(c=>{ try{c.destroy();}catch(e){} }); charts=[];
  const T=chartTokens(), S=n=>Math.round(n*K*10)/10;
  Chart.defaults.font.family='Kantumruy Pro';
  Chart.defaults.font.size=S(11);
  Chart.defaults.color=T.ink;

  const keys=diseaseKeys();
  const cD=document.getElementById('cDisease');
  if(cD && keys.length){
    const pend=keys.map(k=>feedbacks.filter(f=>f.targetDisease===k&&f.status==='PENDING').length);
    const merg=keys.map(k=>feedbacks.filter(f=>f.targetDisease===k&&f.status==='MERGED').length);
    charts.push(new Chart(cD,{type:'bar',
      data:{labels:keys.map(diseaseLabel),datasets:[
        {label:'⏳ រង់ចាំពិនិត្យ',data:pend,backgroundColor:T.pending,borderRadius:4,borderWidth:2,borderColor:T.surface},
        {label:'✓ អនុម័តរួច',   data:merg,backgroundColor:T.merged, borderRadius:4,borderWidth:2,borderColor:T.surface}]},
      plugins:[valueLabels],
      options:{maintainAspectRatio:false,indexAxis:'y',
        plugins:{legend:{display:false},
          valueLabels:{color:'#fff',size:S(11)},
          tooltip:{callbacks:{label:c=>c.dataset.label+'៖ '+c.parsed.x+' សំណើ'}}},
        scales:{x:{stacked:true,beginAtZero:true,grid:{color:T.line},
                   ticks:{precision:0,font:{size:S(10)},color:T.muted}},
                y:{stacked:true,grid:{display:false},ticks:{font:{size:S(10)},color:T.ink}}}}}));
  }

  const cA=document.getElementById('cAge');
  if(cA){
    const ks=Object.keys(AGE_GROUPS);
    const data=ks.map(k=>feedbacks.filter(f=>(f.targetAgeGroup||'ALL')===k).length);
    charts.push(new Chart(cA,{type:'bar',
      data:{labels:ks.map(k=>AGE_GROUPS[k].label),
        datasets:[{label:'សំណើ',data:data,backgroundColor:T.ageRamp,borderRadius:4,
                   borderWidth:2,borderColor:T.surface}]},
      plugins:[valueLabels],
      options:{maintainAspectRatio:false,
        plugins:{legend:{display:false},
          valueLabels:{color:T.ink,size:S(12)},
          tooltip:{callbacks:{label:c=>c.parsed.y+' សំណើ'}}},
        scales:{y:{beginAtZero:true,grid:{color:T.line},ticks:{precision:0,font:{size:S(10)},color:T.muted}},
                x:{grid:{display:false},ticks:{font:{size:S(10)},color:T.ink}}}}}));
  }
}

/* ============================================================
   ១៧. ការនាំចេញ
   ============================================================ */
function exportDataJSON(){
  const obj={schemaVersion:5,source:'google-sheet',clinic:CLINIC.nameEn,
    exportedAt:new Date().toISOString(),protocols:currentProtocols,feedbacks:feedbacks,media:mediaMap};
  const stamp=new Date().toISOString().slice(0,10);
  saveFile(`${CLINIC.slug.toUpperCase()}_SOP_BACKUP_${stamp}.json`,JSON.stringify(obj,null,2));
}
function saveFile(filename,text){
  try{
    const url=URL.createObjectURL(new Blob([text],{type:'application/json'}));
    const a=document.createElement('a'); a.href=url; a.download=filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),2000);
    toast('បានទាញយកទិន្នន័យរួចរាល់','success');
  }catch(e){ toast('ទាញយកមិនបានក្នុងបរិយាកាសនេះទេ','error'); }
}

const MD_TITLES={questions:'១. សំណួរសួរនាំអ្នកជំងឺ/អាណាព្យាបាល',restrictions:'២. តំណមដាច់ខាត',
  redFlags:'៣. សញ្ញាគ្រោះថ្នាក់ (Red Flags)',orders:'៤. បទបញ្ជាព្យាបាល',
  monitoring:'៥. ការតាមដាន និងការចេញពីគ្លីនិក',escalation:'៦. ការជូនដំណឹងបន្ទាន់ និង SBAR'};

function copySOPMarkdown(){
  const key=activeDiseaseTab, proto=currentProtocols[key];
  if(!proto){ toast('គ្មានទិន្នន័យសម្រាប់ចម្លង','warning'); return; }
  const merged=mergedFor(key);
  let md=`# ${CLINIC.nameKh} (${CLINIC.nameEn})\n## SOP: ${proto.title}\n\n`;
  PILLAR_UI.forEach(P=>{
    const base=textList(proto[P.key]), mine=merged.filter(m=>m.targetSection===P.section);
    if(!base.length&&!mine.length) return;
    md+=`### ${MD_TITLES[P.key]||P.key}:\n`;
    base.forEach(x=>md+=`- ${x}\n`);
    mine.forEach(m=>md+=`- [Merged]${ageTagText(m.targetAgeGroup)} ${m.content} (${m.authorName})\n`);
    md+='\n';
  });
  copyText(md);
}
async function copyText(text){
  try{
    if(navigator.clipboard&&window.isSecureContext){
      await navigator.clipboard.writeText(text);
      toast('បានចម្លងចូល Clipboard','success'); return;
    }
  }catch(e){}
  try{
    const ta=document.createElement('textarea');
    ta.value=text; ta.style.position='fixed'; ta.style.opacity='0';
    document.body.appendChild(ta); ta.select();
    const ok=document.execCommand('copy'); document.body.removeChild(ta);
    toast(ok?'បានចម្លងចូល Clipboard':'ចម្លងមិនបាន សូមចម្លងដោយដៃ',ok?'success':'error');
  }catch(e){ toast('ចម្លងមិនបានក្នុងបរិយាកាសនេះទេ','error'); }
}
