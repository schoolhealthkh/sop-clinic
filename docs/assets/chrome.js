/* ============================================================
   ១៨. ទំហំអក្សរ · ពណ៌ផ្ទៃ · ស្វែងរក · មាតិកា
   ============================================================ */
function setK(v){
  K=Math.min(2.2,Math.max(.85,Math.round(v*100)/100));
  document.documentElement.style.setProperty('--k',K);
  const b=$('#sizeBadge'); if(b) b.textContent=Math.round(K*100)+'%';
  try{ localStorage.setItem('say_ras_k',String(K)); }catch(e){}
  clearTimeout(setK._t); setK._t=setTimeout(drawCharts,220);
}
function fs(d){ setK(K+d*0.1); }

function setTheme(mode){
  document.documentElement.setAttribute('data-theme',mode);
  const b=$('#btnTheme'); if(b) b.textContent = mode==='dark'?'☀️':'🌙';
  try{ localStorage.setItem('say_ras_theme',mode); }catch(e){}
  /* ពណ៌ផ្ទាល់ខ្លួនអនុវត្តតែក្នុងផ្ទាំងភ្លឺ — ត្រូវអនុវត្តឡើងវិញរាល់ពេលប្តូរផ្ទាំង */
  if(typeof applySettings==='function') applySettings();
  setTimeout(drawCharts,60);
}

function initChrome(){
  try{
    const k=parseFloat(localStorage.getItem('say_ras_k')); if(k) K=k;
    const t=localStorage.getItem('say_ras_theme');
    setTheme(t==='dark'?'dark':'light');
  }catch(e){ setTheme('light'); }
  setK(K);

  $('#btnTheme').onclick=()=>setTheme(
    document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark');
  $('#btnToc').onclick=()=>$('#toc').classList.toggle('hidden');

  const q=$('#q'), qn=$('#qn');
  if(q) q.addEventListener('input',()=>runSearch(q.value.trim(),qn));

  addEventListener('scroll',()=>{
    const h=document.documentElement;
    const pct=h.scrollTop/Math.max(1,h.scrollHeight-h.clientHeight)*100;
    $('#prog').style.width=pct+'%';
    $('#readStat').textContent='អានរួច '+Math.round(pct)+'%';
    let cur=SECTIONS[0].id;
    SECTIONS.forEach(s=>{ const el=document.getElementById(s.id);
      if(el&&el.getBoundingClientRect().top<170) cur=s.id; });
    $$('.tocl').forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+cur));
  },{passive:true});

  addEventListener('keydown',e=>{
    if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA'||e.target.isContentEditable) return;
    if($('#show').style.display==='flex') return;
    if(e.key==='+'||e.key==='=') fs(1);
    else if(e.key==='-'||e.key==='_') fs(-1);
    else if(e.key==='0') setK(1);
    else if(e.key.toLowerCase()==='p') openPicker();
    else if(e.key==='/'){ e.preventDefault(); const el=$('#q'); if(el) el.focus(); }
  });
}

function runSearch(term,qn){
  $$('mark').forEach(m=>{ const p=m.parentNode; p.replaceChild(document.createTextNode(m.textContent),m); p.normalize(); });
  if(!qn) qn=$('#qn');
  if(term.length<2){ if(qn) qn.textContent=''; return; }

  let n=0;
  const root=$('#sopBox'); if(!root) return;
  const walk=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  const hits=[]; let node;
  while(node=walk.nextNode()){ if(node.nodeValue.indexOf(term)>=0) hits.push(node); }
  hits.forEach(nd=>{
    const parts=nd.nodeValue.split(term), frag=document.createDocumentFragment();
    parts.forEach((p,i)=>{
      frag.appendChild(document.createTextNode(p));
      if(i<parts.length-1){ const m=document.createElement('mark'); m.textContent=term; frag.appendChild(m); n++; }
    });
    nd.parentNode.replaceChild(frag,nd);
  });
  $$('mark').forEach(m=>{ let a=m.closest('.acc'); while(a){ a.classList.add('open'); a=a.parentElement&&a.parentElement.closest('.acc'); } });
  if(qn) qn.textContent = n ? `ជួប ${n} កន្លែង` : 'រកមិនឃើញ';
  const first=$('mark'); if(first) first.scrollIntoView({block:'center'});
}

/* ============================================================
   ១៩. របៀបបទបង្ហាញ
   ============================================================ */
let slides=[], slIdx=0, slTimer=null;

function initPresent(){
  $('#btnPresent').onclick=openPicker;
  $('#pkCancel').onclick=closePicker;
  $('#pkGo').onclick=runShow;
  $('#showpick').addEventListener('click',e=>{ if(e.target===$('#showpick')) closePicker(); });
  $('#shclose').onclick=e=>{e.stopPropagation();closeShow();};
  $('#shnext').onclick=e=>{e.stopPropagation();stopAuto();slGo(slIdx+1);};
  $('#shprev').onclick=e=>{e.stopPropagation();stopAuto();slGo(slIdx-1);};
  $('#shplay').onclick=e=>{e.stopPropagation();toggleAuto();};
  $('#showslides').addEventListener('click',e=>{
    if(e.target.closest('.sl-body,a,button')) return;
    stopAuto(); slGo(slIdx+1);
  });
  window.addEventListener('keydown',e=>{
    const pick=$('#showpick');
    if(pick.style.display==='flex'){ if(e.key==='Escape'){ closePicker(); e.stopImmediatePropagation(); } return; }
    if($('#show').style.display!=='flex') return;
    if(e.key==='Escape') closeShow();
    else if(e.key==='ArrowRight'||e.key===' '||e.key==='Enter'||e.key==='PageDown'){ e.preventDefault(); stopAuto(); slGo(slIdx+1); }
    else if(e.key==='ArrowLeft'||e.key==='PageUp'){ e.preventDefault(); stopAuto(); slGo(slIdx-1); }
    else if(e.key==='Home') slGo(0);
    else if(e.key==='End') slGo(slides.length-1);
    else return;
    e.stopImmediatePropagation();
  },true);
}

function openPicker(){
  const keys=diseaseKeys();
  if(!keys.length){ toast('មិនទាន់មានទិន្នន័យសម្រាប់បង្ហាញទេ','warning'); return; }
  let savedD=keys, savedP=PILLAR_KEYS;
  try{
    const s=JSON.parse(localStorage.getItem('say_ras_show')||'null');
    if(s){ savedD=s.d||keys; savedP=s.p||PILLAR_KEYS; }
  }catch(e){}

  $('#pkPresets').innerHTML=`
    <button class="chip" data-preset="bedside">សន្លឹកក្បាលគ្រែ</button>
    <button class="chip" data-preset="training">បណ្តុះបណ្តាលពេញ</button>
    <button class="chip" data-preset="current">ជំងឺបច្ចុប្បន្ន</button>
    <button class="chip" data-preset="none">សម្អាត</button>`;
  $('#pkDiseases').innerHTML=keys.map(k=>`<label class="pkrow">
    <input type="checkbox" data-d value="${k}" ${savedD.indexOf(k)>=0?'checked':''}>
    <span class="flex-1 min-w-0">${escapeHtml(diseaseLabel(k))}</span></label>`).join('');
  $('#pkPillars').innerHTML=PILLAR_UI.map(P=>`<label class="pkrow">
    <input type="checkbox" data-p value="${P.key}" ${savedP.indexOf(P.key)>=0?'checked':''}>
    <span class="flex-1 min-w-0">${P.icon} ${P.short}</span></label>`).join('');

  $$('#pkPresets [data-preset]').forEach(b=>b.onclick=()=>applyPreset(b.dataset.preset,keys));
  $$('#showpick input[type=checkbox]').forEach(i=>i.onchange=countSlides);
  countSlides();
  $('#showpick').style.display='flex';
  document.body.style.overflow='hidden';
}
function applyPreset(p,keys){
  const D=p==='current'?[activeDiseaseTab]:p==='none'?[]:keys;
  const P=p==='bedside'?['restrictions','redFlags','escalation']:p==='none'?[]:PILLAR_KEYS;
  $$('#pkDiseases input').forEach(i=>i.checked=D.indexOf(i.value)>=0);
  $$('#pkPillars input').forEach(i=>i.checked=P.indexOf(i.value)>=0);
  $('#pkOnePer').checked = p==='bedside';
  countSlides();
}
const pickedD = () => $$('#pkDiseases input:checked').map(i=>i.value);
const pickedP = () => $$('#pkPillars input:checked').map(i=>i.value);
function countSlides(){
  const n=buildSlideSpec().length;
  $('#pkCount').textContent = n+' ស្លាយ · ប្រហែល '+Math.max(1,Math.round(n*25/60))+' នាទី';
}
function closePicker(){ $('#showpick').style.display='none'; document.body.style.overflow=''; }

function buildSlideSpec(){
  const D=pickedD(), P=pickedP(), onePer=$('#pkOnePer')&&$('#pkOnePer').checked;
  const spec=[{t:'title'}];
  D.forEach((k,i)=>{
    spec.push({t:'divider',key:k,n:i+1,total:D.length});
    PILLAR_UI.filter(x=>P.indexOf(x.key)>=0).forEach(pl=>{
      const proto=currentProtocols[k]||EMPTY_PROTO;
      const items=textList(proto[pl.key])
        .concat(mergedFor(k).filter(m=>m.targetSection===pl.section).map(withAgeTag));
      if(!items.length) return;
      if(onePer) items.forEach((txt,j)=>spec.push({t:'item',key:k,pl:pl,txt:txt,j:j+1,of:items.length}));
      else spec.push({t:'list',key:k,pl:pl,items:items});
    });
  });
  spec.push({t:'end'});
  return spec;
}

function runShow(){
  const spec=buildSlideSpec();
  if(spec.length<=2){ toast('សូមជ្រើសជំងឺ និងផ្នែកយ៉ាងតិចមួយ','warning'); return; }
  try{ localStorage.setItem('say_ras_show',JSON.stringify({d:pickedD(),p:pickedP()})); }catch(e){}
  closePicker();

  const holder=$('#showslides'); holder.innerHTML=''; slides=[];
  spec.forEach(s=>{
    const d=document.createElement('div'); d.className='sl';
    d.innerHTML=slideHTML(s); holder.appendChild(d); slides.push(d);
  });
  $('#show').style.display='flex';
  document.body.style.overflow='hidden';
  slGo(0);
  if(document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(()=>{});
}

function slideHTML(s){
  if(s.t==='title') return `
    <div class="moul sl-sub" style="color:#f0cd60">${escapeHtml(CLINIC.nameKh)}</div>
    <div class="sl-rule"></div>
    <h1 class="moul sl-h1">ស្តង់ដារពិធីការព្យាបាល<br>SOP វេជ្ជសាស្ត្រ</h1>
    <div class="sl-sub">${escapeHtml(CLINIC.nameEn)}</div>
    <div class="sl-chips"><span>ជំងឺ ${pickedD().length} ប្រភេទ</span>
      <span>សសរស្តម្ភ ${pickedP().length}</span><span>WHO · CDC · IMCI</span></div>`;
  if(s.t==='divider') return `
    <div class="sl-no tnum">${String(s.n).padStart(2,'0')}</div>
    <h2 class="moul sl-h2">${escapeHtml(diseaseLabel(s.key))}</h2>
    <div class="sl-rule"></div>
    <div class="sl-sub">${escapeHtml((currentProtocols[s.key]||EMPTY_PROTO).subtitle||'')}</div>`;
  if(s.t==='list') return `
    <div class="sl-eyebrow">${escapeHtml(diseaseLabel(s.key))}</div>
    <h3 class="moul sl-h3">${s.pl.icon} ${escapeHtml(s.pl.title)}</h3>
    <div class="sl-rule"></div>
    <ul class="sl-body">${s.items.map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul>`;
  if(s.t==='item') return `
    <div class="sl-eyebrow">${escapeHtml(diseaseLabel(s.key))} · ${s.pl.icon} ${escapeHtml(s.pl.short)}</div>
    <div class="sl-sub tnum" style="opacity:.6">${s.j} / ${s.of}</div>
    <div class="sl-rule"></div>
    <h3 class="moul sl-h3" style="max-width:26ch">${escapeHtml(s.txt)}</h3>`;
  return `<div class="sl-rule"></div>
    <h2 class="moul sl-h1">សុវត្ថិភាពអ្នកជំងឺ<br>ចាប់ផ្តើមពីស្តង់ដារដែលយើងគោរព</h2>
    <div class="sl-sub">${escapeHtml(CLINIC.nameKh)} · ${escapeHtml(CLINIC.nameEn)}</div>
    <div class="sl-rule"></div>`;
}

function slGo(i){
  if(!slides.length) return;
  if(i>=slides.length){ stopAuto(); return; }
  slIdx=Math.max(0,Math.min(slides.length-1,i));
  slides.forEach((s,n)=>s.classList.toggle('on',n===slIdx));
  $('#shnum').textContent=(slIdx+1)+' / '+slides.length;
  $('#showbar').firstElementChild.style.width=((slIdx+1)/slides.length*100)+'%';
}
function toggleAuto(){
  if(slTimer) return stopAuto();
  slTimer=setInterval(()=>slGo(slIdx+1),15000);
  $('#shplay').textContent='❚❚'; $('#shplay').classList.add('on');
}
function stopAuto(){
  clearInterval(slTimer); slTimer=null;
  const b=$('#shplay'); if(b){ b.textContent='▶'; b.classList.remove('on'); }
}
function closeShow(){
  stopAuto();
  $('#show').style.display='none';
  $('#showslides').innerHTML=''; slides=[];
  document.body.style.overflow='';
  if(document.fullscreenElement&&document.exitFullscreen) document.exitFullscreen().catch(()=>{});
}
