/* ============================================================
   ផ្ទាំងអ្នកគ្រប់គ្រង — កែបានគ្រប់ផ្នែក
   ១. ចំណុចពិធីការ  ២. ជំងឺ  ៣. អត្តសញ្ញាណ និងរូបរាង  ៤. ទម្រង់ព្រីន
   ============================================================ */
let admTab = 'items';
let admDisease = null;
let admPillar = 'questions';

const ADM_TABS = [
  {k:'items',    t:'ចំណុចពិធីការ',        icon:'📝'},
  {k:'diseases', t:'ជំងឺ',                 icon:'🏥'},
  {k:'identity', t:'អត្តសញ្ញាណ និងរូបរាង', icon:'🎨'},
  {k:'print',    t:'ទម្រង់ព្រីន A4',        icon:'🖨'}
];

const SETTING_FIELDS = [
  {k:'appNameKh',  t:'ឈ្មោះគ្លីនិក (ខ្មែរ)',        type:'text'},
  {k:'appNameEn',  t:'ឈ្មោះគ្លីនិក (ឡាតាំង)',       type:'text'},
  {k:'logoText',   t:'អក្សរកាត់ក្នុងរូបសញ្ញា',      type:'text'},
  {k:'docTitle',   t:'ចំណងជើងទំព័រ (browser tab)',  type:'text'},
  {k:'codePrefix', t:'បុព្វបទកូដឯកសារ',             type:'text'},
  {k:'footerNote', t:'អត្ថបទបាតទំព័រ',              type:'text'},
  {k:'primary',    t:'ពណ៌ចម្បង',                    type:'color'},
  {k:'primary2',   t:'ពណ៌ចម្បង (ស្រាល)',            type:'color'},
  {k:'accent',     t:'ពណ៌រំលេច',                    type:'color'}
];

const PRINT_FIELDS = [
  {g:'បណ្ណថែទាំ (Caregiver Card)', f:[
    {k:'cgTitle',    t:'ចំណងជើង'},
    {k:'cgTitleEn',  t:'ចំណងជើងឡាតាំង'},
    {k:'cgObjTitle', t:'ចំណងជើងគោលបំណង'},
    {k:'cgObj1',     t:'គោលបំណងទី ១'},
    {k:'cgObj2',     t:'គោលបំណងទី ២'},
    {k:'cgObj3',     t:'គោលបំណងទី ៣'}
  ]},
  {g:'សន្លឹក SOP បុគ្គលិក', f:[
    {k:'stTitle',   t:'ចំណងជើង'},
    {k:'stTitleEn', t:'ចំណងជើងឡាតាំង'},
    {k:'qtTitle',   t:'ចំណងជើងតារាងតាមដាន'}
  ]},
  {g:'ប្រអប់បំពេញ និងហត្ថលេខា', f:[
    {k:'fieldPatient', t:'ឈ្មោះអ្នកជំងឺ'},
    {k:'fieldAge',     t:'អាយុ'},
    {k:'fieldWeight',  t:'ទម្ងន់'},
    {k:'fieldBed',     t:'បន្ទប់/គ្រែ'},
    {k:'fieldDay',     t:'ថ្ងៃជំងឺទី'},
    {k:'fieldGuard',   t:'អ្នកថែទាំ'},
    {k:'signNurse',    t:'ហត្ថលេខាគិលានុបដ្ឋាយិកា'},
    {k:'signDoctor',   t:'ហត្ថលេខាវេជ្ជបណ្ឌិត'}
  ]}
];

/* ------------------------------------------------------------ */
function renderAdmin(force){
  const box = $('#adminBox'); if(!box) return;

  if(!isAdmin()){
    box.innerHTML = `<div class="card p-8 text-center space-y-3">
      <div class="t24">🔒</div>
      <div class="t13 font-bold">ផ្នែកនេះសម្រាប់អ្នកគ្រប់គ្រង</div>
      <div class="t11 muted">សូមចូលដោយលេខសម្ងាត់ ដើម្បីកែសម្រួលខ្លឹមសារ និងរូបរាងកម្មវិធី។</div>
      <div><button class="btn" onclick="openPinModal()">ចូលជាអ្នកគ្រប់គ្រង</button></div>
    </div>`;
    return;
  }

  /* កុំសរសេរជាន់ពេលកំពុងវាយអក្សរ */
  if(!force && box.contains(document.activeElement)) return;

  const keys = diseaseKeys();
  if(!admDisease || keys.indexOf(admDisease)<0) admDisease = activeDiseaseTab || keys[0] || null;

  box.innerHTML = `
    <div class="adm-tabs">
      ${ADM_TABS.map(t=>`<button class="chip${admTab===t.k?' on':''}"
         onclick="admGo('${t.k}')">${t.icon} ${escapeHtml(t.t)}</button>`).join('')}
    </div>
    <div class="card p-5 space-y-4">${admBody()}</div>`;
}

function admGo(tab){ admTab=tab; renderAdmin(true); }

function admBody(){
  switch(admTab){
    case 'diseases': return admDiseasesHTML();
    case 'identity': return admIdentityHTML();
    case 'print':    return admPrintHTML();
    default:         return admItemsHTML();
  }
}

/* ============================================================
   ១. ចំណុចពិធីការ
   ============================================================ */
function admItemsHTML(){
  const keys = diseaseKeys();
  if(!keys.length) return `<div class="muted t12">មិនទាន់មានជំងឺទេ។ សូមបន្ថែមក្នុងផ្ទាំង «ជំងឺ» ជាមុនសិន។</div>`;

  const p = currentProtocols[admDisease] || EMPTY_PROTO;
  const list = p[admPillar] || [];
  const ui = PILLAR_UI.filter(x=>x.key===admPillar)[0] || PILLAR_UI[0];

  return `
  <div class="adm-grid">
    <label class="adm-field"><span>ជំងឺ</span>
      <select class="fld" onchange="admSetDisease(this.value)">
        ${keys.map(k=>`<option value="${escapeAttr(k)}"${k===admDisease?' selected':''}>${escapeHtml(diseaseLabel(k))}</option>`).join('')}
      </select></label>
    <label class="adm-field"><span>ផ្នែក (សសរស្តម្ភ)</span>
      <select class="fld" onchange="admSetPillar(this.value)">
        ${PILLAR_UI.map(x=>`<option value="${x.key}"${x.key===admPillar?' selected':''}>${x.icon} ${escapeHtml(x.short)}</option>`).join('')}
      </select></label>
  </div>

  <div class="t11 muted">${escapeHtml(ui.title)} — មាន <b>${list.length}</b> ចំណុច</div>

  <div class="space-y-2">
    ${list.length ? list.map((it,i)=>admItemRow(it,i,list.length)).join('')
                  : `<div class="muted t11 py-3">មិនទាន់មានចំណុចក្នុងផ្នែកនេះទេ។</div>`}
  </div>

  <div class="adm-row" style="align-items:stretch">
    <textarea class="fld" id="admNewItem" rows="2" placeholder="${escapeAttr(ui.ph)}"></textarea>
    <div class="adm-tools" style="align-items:center">
      <button class="btn" onclick="admAddItem()">បន្ថែម</button>
    </div>
  </div>

  <div class="flex justify-end pt-1">
    <button class="btn btn-ghost" onclick="admResetDisease()">↺ ស្តារជំងឺនេះទៅទិន្នន័យស្រាវជ្រាវដើម</button>
  </div>`;
}

function admItemRow(it,i,total){
  const id = escapeAttr(it.id);
  return `<div class="adm-row">
    <div class="t10 muted font-bold" style="min-width:1.6rem;padding-top:.55rem">${i+1}.</div>
    <textarea class="fld" id="it-${id}" rows="2">${escapeHtml(it.text)}</textarea>
    <div class="adm-tools" style="flex-direction:column">
      <button class="adm-mini" title="រក្សាទុក" onclick="admSaveItem('${id}')">💾</button>
      <button class="adm-mini" title="ឡើងលើ"  onclick="admMoveItem('${id}','up')"   ${i===0?'disabled':''}>▲</button>
      <button class="adm-mini" title="ចុះក្រោម" onclick="admMoveItem('${id}','down')" ${i===total-1?'disabled':''}>▼</button>
      <button class="adm-mini bad" title="លុប" onclick="admDeleteItem('${id}')">✕</button>
    </div>
  </div>`;
}

function admSetDisease(k){ admDisease=k; renderAdmin(true); }
function admSetPillar(k){ admPillar=k; renderAdmin(true); }

async function admAddItem(){
  const el=$('#admNewItem'); const text=(el&&el.value||'').trim();
  if(!text){ toast('សូមបំពេញអត្ថបទជាមុនសិន','warning'); return; }
  if(await serverAction('apiAddProtocolItem',[adminPin,admDisease,admPillar,text],'បានបន្ថែមចំណុចថ្មី')) renderAdmin(true);
}
async function admSaveItem(id){
  const el=$('#it-'+id); const text=(el&&el.value||'').trim();
  if(!text){ toast('អត្ថបទមិនអាចទទេបានទេ','warning'); return; }
  if(await serverAction('apiUpdateProtocolItem',[adminPin,id,text],'បានរក្សាទុក')) renderAdmin(true);
}
async function admMoveItem(id,dir){
  if(await serverAction('apiMoveProtocolItem',[adminPin,id,dir],'')) renderAdmin(true);
}
async function admDeleteItem(id){
  const ok=await askConfirm({title:'លុបចំណុចនេះ?',message:'ចំណុចនេះនឹងត្រូវលុបចេញពី SOP ជាអចិន្ត្រៃយ៍។',okLabel:'លុប'});
  if(!ok) return;
  if(await serverAction('apiDeleteProtocolItem',[adminPin,id],'បានលុប')) renderAdmin(true);
}
async function admResetDisease(){
  const ok=await askConfirm({title:'ស្តារទិន្នន័យដើម?',
    message:'ចំណុចទាំងអស់របស់ជំងឺនេះនឹងត្រូវជំនួសដោយទិន្នន័យស្រាវជ្រាវដើម។ ការកែសម្រួលដែលបានធ្វើនឹងបាត់បង់។',
    okLabel:'ស្តារ'});
  if(!ok) return;
  if(await serverAction('apiResetDisease',[adminPin,admDisease],'បានស្តារទិន្នន័យដើម')) renderAdmin(true);
}

/* ============================================================
   ២. ជំងឺ
   ============================================================ */
function admDiseasesHTML(){
  const keys = diseaseKeys();
  return `
  <div class="t11 muted">មាន <b>${keys.length}</b> ជំងឺ។ លំដាប់ត្រង់នេះ គឺជាលំដាប់ដែលបុគ្គលិកឃើញ។</div>

  <div class="space-y-2">
    ${keys.map((k,i)=>{
      const p=currentProtocols[k]||EMPTY_PROTO;
      const count=PILLAR_KEYS.reduce((n,pk)=>n+((p[pk]||[]).length),0);
      const kk=escapeAttr(k);
      return `<div class="adm-row" style="flex-direction:column;gap:.45rem">
        <div class="flex items-center gap-2 w-full">
          <span class="chip on" style="cursor:default">${escapeHtml(k)}</span>
          <span class="t10 muted">${count} ចំណុច</span>
          <span class="flex-1"></span>
          <div class="adm-tools">
            <button class="adm-mini" title="ឡើងលើ"  onclick="admMoveDisease('${kk}','up')"   ${i===0?'disabled':''}>▲</button>
            <button class="adm-mini" title="ចុះក្រោម" onclick="admMoveDisease('${kk}','down')" ${i===keys.length-1?'disabled':''}>▼</button>
            <button class="adm-mini" title="រក្សាទុក" onclick="admSaveDisease('${kk}')">💾</button>
            <button class="adm-mini bad" title="លុប" onclick="admDeleteDisease('${kk}')">✕</button>
          </div>
        </div>
        <input class="fld" id="dt-${kk}" value="${escapeAttr(p.title||'')}" placeholder="ចំណងជើងជំងឺ">
        <input class="fld" id="ds-${kk}" value="${escapeAttr(p.subtitle||'')}" placeholder="ចំណងជើងរង">
      </div>`;
    }).join('')}
  </div>

  <div class="card p-4 space-y-2" style="box-shadow:none">
    <div class="t12 font-bold">បន្ថែមជំងឺថ្មី</div>
    <div class="adm-grid">
      <label class="adm-field"><span>កូដ (អក្សរឡាតាំងធំ ឧ. MALARIA)</span>
        <input class="fld" id="admNewKey" placeholder="MALARIA" maxlength="24"></label>
      <label class="adm-field"><span>ចំណងជើង</span>
        <input class="fld" id="admNewTitle" placeholder="៧. ជំងឺគ្រុនចាញ់ (Malaria)"></label>
    </div>
    <label class="adm-field"><span>ចំណងជើងរង</span>
      <input class="fld" id="admNewSub" placeholder="ពិធីការតាមដាន…"></label>
    <div class="flex justify-end"><button class="btn" onclick="admAddDisease()">បន្ថែមជំងឺ</button></div>
  </div>`;
}

async function admAddDisease(){
  const key=($('#admNewKey').value||'').trim();
  const title=($('#admNewTitle').value||'').trim();
  const sub=($('#admNewSub').value||'').trim();
  if(!key||!title){ toast('សូមបំពេញកូដ និងចំណងជើង','warning'); return; }
  if(await serverAction('apiAddDisease',[adminPin,key,title,sub],'បានបន្ថែមជំងឺថ្មី')) renderAdmin(true);
}
async function admSaveDisease(k){
  const title=($('#dt-'+k).value||'').trim();
  const sub=($('#ds-'+k).value||'').trim();
  if(!title){ toast('ចំណងជើងមិនអាចទទេបានទេ','warning'); return; }
  if(await serverAction('apiUpdateDisease',[adminPin,k,title,sub],'បានរក្សាទុក')) renderAdmin(true);
}
async function admMoveDisease(k,dir){
  if(await serverAction('apiMoveDisease',[adminPin,k,dir],'')) renderAdmin(true);
}
async function admDeleteDisease(k){
  const p=currentProtocols[k]||EMPTY_PROTO;
  const count=PILLAR_KEYS.reduce((n,pk)=>n+((p[pk]||[]).length),0);
  const ok=await askConfirm({title:'លុបជំងឺ '+k+'?',
    message:'ចំណុចពិធីការ '+count+' និងឯកសារភ្ជាប់ទាំងអស់របស់ជំងឺនេះនឹងត្រូវលុបជាអចិន្ត្រៃយ៍។',
    okLabel:'លុប'});
  if(!ok) return;
  if(await serverAction('apiDeleteDisease',[adminPin,k],'បានលុបជំងឺ')) renderAdmin(true);
}

/* ============================================================
   ៣. អត្តសញ្ញាណ និងរូបរាង
   ============================================================ */
function admIdentityHTML(){
  return `
  <div class="t11 muted">ការកែត្រង់នេះ ប៉ះពាល់ដល់ក្បាលទំព័រ ឈ្មោះ ពណ៌ និងកូដឯកសារព្រីនទាំងអស់។</div>
  <div class="adm-grid">
    ${SETTING_FIELDS.map(f=>{
      const v = (settings&&settings[f.k]!=null)?String(settings[f.k]):'';
      return `<label class="adm-field"><span>${escapeHtml(f.t)}</span>
        <input class="fld" type="${f.type==='color'?'color':'text'}"
               id="set-${f.k}" value="${escapeAttr(v)}"></label>`;
    }).join('')}
  </div>
  <div class="flex justify-end gap-2">
    <button class="btn btn-ghost" onclick="renderAdmin(true)">បោះបង់</button>
    <button class="btn" onclick="admSaveSettings()">រក្សាទុកការកំណត់</button>
  </div>`;
}

async function admSaveSettings(){
  const out={};
  SETTING_FIELDS.forEach(f=>{ const el=$('#set-'+f.k); if(el) out[f.k]=el.value; });
  if(await serverAction('apiSaveSettings',[adminPin,out],'បានរក្សាទុកការកំណត់')) renderAdmin(true);
}

/* ============================================================
   ៤. ទម្រង់ព្រីន A4
   ============================================================ */
function admPrintHTML(){
  return `
  <div class="t11 muted">អត្ថបទទាំងនេះបង្ហាញលើសន្លឹកព្រីន។ ការកែមានប្រសិទ្ធភាពភ្លាមៗ។</div>
  ${PRINT_FIELDS.map(g=>`
    <div class="space-y-2">
      <div class="t12 font-bold pri">${escapeHtml(g.g)}</div>
      <div class="adm-grid">
        ${g.f.map(f=>{
          const v=(printText&&printText[f.k]!=null)?String(printText[f.k]):'';
          return `<label class="adm-field"><span>${escapeHtml(f.t)}</span>
            <input class="fld" id="pt-${f.k}" value="${escapeAttr(v)}"></label>`;
        }).join('')}
      </div>
    </div>`).join('')}
  <div class="flex justify-end gap-2">
    <button class="btn btn-ghost" onclick="renderAdmin(true)">បោះបង់</button>
    <button class="btn" onclick="admSavePrintText()">រក្សាទុកទម្រង់ព្រីន</button>
  </div>`;
}

async function admSavePrintText(){
  const out={};
  PRINT_FIELDS.forEach(g=>g.f.forEach(f=>{ const el=$('#pt-'+f.k); if(el) out[f.k]=el.value; }));
  if(await serverAction('apiSavePrintText',[adminPin,out],'បានរក្សាទុកទម្រង់ព្រីន')) renderAdmin(true);
}
