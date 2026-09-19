/* ============================================================
   ២. អត្តសញ្ញាណគ្លីនិក និងកូនសោ
   ============================================================ */
/* តម្លៃដើម — ត្រូវបានជំនួសដោយការកំណត់ដែលអានពីម៉ាស៊ីនបម្រើ */
const CLINIC = { nameKh:"មន្ទីរសម្រាកព្យាបាល សាយ រះ", nameEn:"SAY RAS CLINIC", slug:"say_ras" };

const ONLINE = () => !!(window.API && API.isConfigured());
const REFRESH_MS = (window.SOP_CONFIG && window.SOP_CONFIG.refreshMs) || 30000;

/** អត្តសញ្ញាណតាមកម្មវិធីរុករក — ប្រើការពារការឯកភាពស្ទួន មិនមែនជាការចូលគណនីទេ */
function voterToken(){
  const KEY='say_ras_voter_token';
  try{
    let v=localStorage.getItem(KEY);
    if(!v){ v='v-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10); localStorage.setItem(KEY,v); }
    return v;
  }catch(e){ return 'v-session-'+Math.random().toString(36).slice(2,10); }
}

const itemText = x => (x&&typeof x==='object') ? String(x.text||'') : String(x||'');
const itemId   = x => (x&&typeof x==='object') ? x.id : null;
const textList = a => (a||[]).map(itemText);

function escapeHtml(t){
  return String(t==null?'':t).replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function escapeAttr(t){ return escapeHtml(t); }

/* ============================================================
   ៣. សសរស្តម្ភ · ក្រុមអាយុ · តួនាទី
   ============================================================ */
const PILLAR_UI = [
  {key:'questions',   section:'QUESTIONS',   v:'--p1', t:'--p1t', icon:'❓', numbered:true,
   title:'សំណួរគន្លឹះសួរនាំអ្នកជំងឺ/អាណាព្យាបាល', short:'សំណួរសួរនាំ', tag:'Caregiver Questions',
   ph:'បន្ថែមសំណួរសួរនាំថ្មី…'},
  {key:'restrictions',section:'RESTRICTIONS',v:'--p2', t:'--p2t', icon:'🚫', numbered:false,
   title:'តំណមវេជ្ជសាស្ត្រ និងចំណីអាហារហាមឃាត់ដាច់ខាត', short:'តំណមដាច់ខាត', tag:'Contraindications',
   ph:'បន្ថែមចំណុចតំណមថ្មី…'},
  {key:'redFlags',    section:'REDFLAGS',    v:'--p3', t:'--p3t', icon:'🚨', numbered:false,
   title:'សញ្ញាគ្រោះថ្នាក់ត្រូវប្រុងប្រយ័ត្ន', short:'សញ្ញាគ្រោះថ្នាក់', tag:'Red Flags',
   ph:'បន្ថែមសញ្ញាគ្រោះថ្នាក់ថ្មី…'},
  {key:'orders',      section:'ORDERS',      v:'--p4', t:'--p4t', icon:'💉', numbered:false,
   title:'បទបញ្ជាព្យាបាល និងការគ្រប់គ្រងសារធាតុរាវ', short:'បទបញ្ជាព្យាបាល', tag:'Clinical Orders',
   ph:'បន្ថែមបទបញ្ជាព្យាបាលថ្មី…'},
  {key:'monitoring',  section:'MONITORING',  v:'--p5', t:'--p5t', icon:'📈', numbered:false,
   title:'ការតាមដាន ប្រេកង់ និងលក្ខណៈវិនិច្ឆ័យចេញពីគ្លីនិក', short:'ការតាមដាន', tag:'Q1H / Q2H / Q4H',
   ph:'បន្ថែមចំណុចតាមដានថ្មី…'},
  {key:'escalation',  section:'ESCALATION',  v:'--p6', t:'--p6t', icon:'📢', numbered:false,
   title:'ការជូនដំណឹងបន្ទាន់ និងទម្រង់ SBAR', short:'ជូនដំណឹងបន្ទាន់', tag:'ហៅវេជ្ជបណ្ឌិត < ៣ នាទី',
   ph:'បន្ថែមចំណុចជូនដំណឹងបន្ទាន់ថ្មី…'}
];
const PILLAR_KEYS = PILLAR_UI.map(p=>p.key);
const pillarOf = sec => PILLAR_UI.filter(p=>p.section===sec)[0] || PILLAR_UI[0];

const AGE_GROUPS = {
  ALL:      {label:'គ្រប់វ័យ',   full:'គ្រប់វ័យទាំងអស់',            c:'--muted'},
  PEDIATRIC:{label:'កុមារ',      full:'កុមារ (< ១៨ ឆ្នាំ)',         c:'--p1'},
  ADULT:    {label:'ពេញវ័យ',     full:'មនុស្សពេញវ័យ (១៨–៥៩ ឆ្នាំ)', c:'--p4'},
  ELDERLY:  {label:'មនុស្សចាស់', full:'មនុស្សចាស់ (≥ ៦០ ឆ្នាំ)',    c:'--p6'}
};
const ageInfo = k => AGE_GROUPS[k] || AGE_GROUPS.ALL;
function ageBadge(k){
  const a=ageInfo(k);
  return `<span class="t9 font-bold px-2 py-[2px] rounded-md" style="color:var(${a.c});background:color-mix(in srgb,var(${a.c}) 14%,transparent)">${a.full}</span>`;
}
function ageChip(k){
  if(!k||k==='ALL') return '';
  const a=ageInfo(k);
  return ` <span class="t9 font-bold px-1.5 rounded" style="color:var(${a.c});background:color-mix(in srgb,var(${a.c}) 16%,transparent)">${a.label}</span>`;
}
const ageTagText = k => (!k||k==='ALL') ? '' : ` [${ageInfo(k).label}]`;
const withAgeTag = m => (m.content||'') + ageTagText(m.targetAgeGroup);

const ROLE_LABELS = {DOCTOR:'វេជ្ជបណ្ឌិត',NURSE:'គិលានុបដ្ឋាយិកា',PHARMACIST:'ឱសថការី',ADMIN:'ប្រធានផ្នែក',OTHER:'ផ្សេងៗ'};
const DEPT_LABELS = {IPD:'IPD',OPD:'OPD',ER:'ER',ALL:'ទូទៅ'};
const roleLabel = k => ROLE_LABELS[k]||k||'—';
const deptLabel = k => DEPT_LABELS[k]||k||'—';

/* ============================================================
   ៤. ស្ថានភាព
   ============================================================ */
let currentProtocols={}, feedbacks=[], mediaMap={};
let settings={}, printText={}, diseaseOrder=[];
/** អត្ថបទក្នុងទម្រង់ព្រីន — កែបានពីផ្ទាំងអ្នកគ្រប់គ្រង */
const PT = (key, fallback) => (printText && printText[key] != null && String(printText[key]).trim())
  ? String(printText[key]) : (fallback == null ? '' : fallback);
let activeDiseaseTab='DENGUE', activePreviewType='caregiver';
let adminPin=null, refreshTimer=null, K=1;
const isAdmin = () => !!adminPin;
const EMPTY_PROTO = {title:'—',subtitle:'',questions:[],restrictions:[],redFlags:[],orders:[],monitoring:[],escalation:[]};
const $  = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

window.addEventListener('DOMContentLoaded',()=>{
  initConfirmModal(); initPinModal(); initLightbox(); initPresent(); initChrome();
  $$('[data-clinic-en]').forEach(e=>e.textContent=CLINIC.nameEn);
  $$('[data-clinic-kh]').forEach(e=>e.textContent=CLINIC.nameKh);
  renderAdminBar();
  refreshAll(true);
  refreshTimer=setInterval(()=>{ if(!document.hidden) refreshAll(false); },REFRESH_MS);
  document.addEventListener('visibilitychange',()=>{ if(!document.hidden) refreshAll(false); });
});

/* ============================================================
   ៥. ការទាញទិន្នន័យពីម៉ាស៊ីនបម្រើ
   ============================================================ */
function setSync(text,tone){
  const el=$('#syncState'); if(!el) return;
  const c = tone==='ok'?'--ok' : tone==='error'?'--bad' : '--primary';
  el.style.color=`var(${c})`;
  el.style.background=`color-mix(in srgb,var(${c}) 10%,transparent)`;
  el.textContent=text;
}

function refreshAll(spinner){
  if(!ONLINE()){ setSync('មិនបានកំណត់ API','error'); renderAll(); return Promise.resolve(false); }
  if(spinner) setSync('កំពុងទាញ…','load');
  return call('apiBootstrap').then(d=>{
    if(!d||!d.ok) throw new Error('ទិន្នន័យមិនត្រឹមត្រូវ');
    currentProtocols=d.protocols||{}; feedbacks=d.feedbacks||[]; mediaMap=d.media||{};
    settings=d.settings||{}; printText=d.printText||{};
    diseaseOrder=(d.order&&d.order.length)?d.order:Object.keys(currentProtocols);
    applySettings();
    if(!currentProtocols[activeDiseaseTab]) activeDiseaseTab=diseaseOrder[0]||Object.keys(currentProtocols)[0]||'';
    renderAll();
    setSync('ថ្មី '+new Date().toLocaleTimeString('km-KH',{hour:'2-digit',minute:'2-digit'}),'ok');
    return true;
  }).catch(err=>{
    setSync('ទាញមិនបាន','error');
    if(spinner) toast('ភ្ជាប់ម៉ាស៊ីនបម្រើមិនបាន៖ '+err.message,'error');
    return false;
  });
}

async function serverAction(fn,args,okMsg){
  try{
    const res = await call.apply(null,[fn].concat(args));
    if(!res||!res.ok){ toast((res&&res.error)||'ប្រតិបត្តិការមិនបានសម្រេច','error'); return false; }
    await refreshAll(false);
    if(okMsg) toast(okMsg,'success');
    return true;
  }catch(err){ toast('ភ្ជាប់ម៉ាស៊ីនបម្រើមិនបាន៖ '+err.message,'error'); return false; }
}

/* ============================================================
   ៦. អ្នកគ្រប់គ្រង
   ============================================================ */
function renderAdminBar(){
  const bar=$('#adminBar'); if(!bar) return;
  document.body.classList.toggle('isadmin',isAdmin());
  bar.innerHTML = isAdmin()
    ? `<span class="chip on" style="cursor:default">🔓 អ្នកគ្រប់គ្រង</span>
       <button class="chip" onclick="adminLogout()">ចាកចេញ</button>`
    : `<button class="chip" onclick="openPinModal()">🔒 អ្នកគ្រប់គ្រង</button>`;
}
function requireAdmin(){
  if(isAdmin()) return true;
  toast('សកម្មភាពនេះតម្រូវឱ្យចូលជាអ្នកគ្រប់គ្រងជាមុនសិន','warning');
  openPinModal(); return false;
}
function openPinModal(){
  const m=$('#pinModal'); if(!m) return;
  $('#pinInput').value=''; $('#pinError').hidden=true; m.hidden=false;
  setTimeout(()=>$('#pinInput').focus(),50);
}
const closePinModal = () => { const m=$('#pinModal'); if(m) m.hidden=true; };
async function submitPin(){
  const input=$('#pinInput'), err=$('#pinError');
  const pin=(input.value||'').trim(); if(!pin) return;
  const fail=msg=>{ err.textContent=msg; err.hidden=false; input.value=''; input.focus(); };
  try{
    const res=await call('apiCheckPin',pin);
    if(res&&res.ok){ adminPin=pin; closePinModal(); renderAdminBar(); renderAll(); toast('បានចូលជាអ្នកគ្រប់គ្រង','success'); }
    else fail('លេខសម្ងាត់មិនត្រឹមត្រូវ');
  }catch(e){ fail('ភ្ជាប់ម៉ាស៊ីនបម្រើមិនបាន'); }
}
function adminLogout(){ adminPin=null; renderAdminBar(); renderAll(); toast('បានចាកចេញ','info'); }
function initPinModal(){
  const m=$('#pinModal'); if(!m) return;
  $('#pinOkBtn').addEventListener('click',submitPin);
  $('#pinCancelBtn').addEventListener('click',closePinModal);
  $('#pinInput').addEventListener('keydown',e=>{ if(e.key==='Enter'){e.preventDefault();submitPin();} });
  m.addEventListener('click',e=>{ if(e.target===m) closePinModal(); });
  document.addEventListener('keydown',e=>{ if(!m.hidden&&e.key==='Escape') closePinModal(); });
}

/* ============================================================
   ៧. ប្រអប់បញ្ជាក់ និងសារជូនដំណឹង
   ============================================================ */
let _confirmResolve=null;
function askConfirm({title,message,okLabel='បញ្ជាក់',danger=true}){
  return new Promise(resolve=>{
    const m=$('#confirmModal'), ok=$('#confirmOkBtn');
    if(!m||!ok){ resolve(true); return; }
    $('#confirmTitle').textContent=title;
    $('#confirmMessage').textContent=message;
    ok.textContent=okLabel;
    ok.className='btn '+(danger?'btn-bad':'');
    $('#confirmIcon').textContent = danger?'⚠️':'❓';
    $('#confirmIcon').style.background = `color-mix(in srgb,var(${danger?'--bad':'--primary'}) 14%,transparent)`;
    _confirmResolve=resolve; m.hidden=false; ok.focus();
  });
}
function closeConfirm(v){
  const m=$('#confirmModal'); if(m) m.hidden=true;
  if(_confirmResolve){ const r=_confirmResolve; _confirmResolve=null; r(v); }
}
function initConfirmModal(){
  const m=$('#confirmModal'); if(!m) return;
  $('#confirmOkBtn').addEventListener('click',()=>closeConfirm(true));
  $('#confirmCancelBtn').addEventListener('click',()=>closeConfirm(false));
  m.addEventListener('click',e=>{ if(e.target===m) closeConfirm(false); });
  document.addEventListener('keydown',e=>{
    if(m.hidden) return;
    if(e.key==='Escape') closeConfirm(false);
    if(e.key==='Enter') closeConfirm(true);
  });
}

function toast(msg,type='info'){
  const box=$('#toastContainer'); if(!box) return;
  const tones={success:'--ok',info:'--primary',warning:'--warn',error:'--bad'};
  const icons={success:'✓',info:'ℹ',warning:'⚠',error:'✕'};
  const c=tones[type]||tones.info;
  const el=document.createElement('div');
  el.className='card px-4 py-2.5 t11 font-semibold flex items-center gap-2 pointer-events-auto max-w-sm';
  el.style.borderColor=`var(${c})`;
  el.style.transform='translateY(8px)'; el.style.opacity='0';
  el.style.transition='all .3s';
  el.innerHTML=`<span style="color:var(${c});font-weight:800">${icons[type]||'ℹ'}</span><span>${escapeHtml(msg)}</span>`;
  box.appendChild(el);
  requestAnimationFrame(()=>{ el.style.transform='none'; el.style.opacity='1'; });
  setTimeout(()=>{ el.style.opacity='0'; el.style.transform='translateY(8px)';
    setTimeout(()=>el.remove(),320); }, 3800);
}


/* ============================================================
   ៨. អនុវត្តការកំណត់ដែលអានពីម៉ាស៊ីនបម្រើ (ឈ្មោះ ពណ៌ រូបរាង)
   ============================================================ */
const HEX = /^#[0-9a-fA-F]{6}$/;

function applySettings(){
  const s = settings || {};
  if(s.appNameKh) CLINIC.nameKh = s.appNameKh;
  if(s.appNameEn) CLINIC.nameEn = s.appNameEn;

  $$('[data-clinic-en]').forEach(e=>e.textContent=CLINIC.nameEn);
  $$('[data-clinic-kh]').forEach(e=>e.textContent=CLINIC.nameKh);
  $$('[data-logo-text]').forEach(e=>e.textContent=s.logoText||'SR');

  if(s.docTitle) document.title = s.docTitle;

  /* ពណ៌ស្នូល — អនុវត្តតែក្នុងផ្ទាំងភ្លឺ ព្រោះផ្ទាំងងងឹតមានសំណុំពណ៌ផ្ទាល់ខ្លួន */
  const root = document.documentElement;
  const dark = root.getAttribute('data-theme')==='dark';
  ['primary','primary-2','accent'].forEach((cssVar,i)=>{
    const key = ['primary','primary2','accent'][i];
    const v = s[key];
    if(!dark && HEX.test(String(v||''))) root.style.setProperty('--'+cssVar, v);
    else if(dark) root.style.removeProperty('--'+cssVar);
  });
}

/** បង្កើតកូដឯកសារ ឧ. SRC-CG-DENGUE */
function docCode(kind, diseaseKey){
  const pre = (settings && settings.codePrefix) || 'SRC';
  return [pre, kind, String(diseaseKey||'').toUpperCase()].filter(Boolean).join('-');
}

/** លំដាប់ជំងឺតាមការរៀបចំរបស់អ្នកគ្រប់គ្រង */
function diseaseKeys(){
  const have = currentProtocols || {};
  const ordered = (diseaseOrder||[]).filter(k=>have[k]);
  Object.keys(have).forEach(k=>{ if(ordered.indexOf(k)<0) ordered.push(k); });
  return ordered;
}
