/* ============================================================
   ៨. គ្រោងទំព័រ និងមាតិកា
   ============================================================ */
const SECTIONS = [
  {id:'sop',    t:'សេចក្ដីព្រាង SOP ផ្លូវការ',        icon:'📖'},
  {id:'submit', t:'បញ្ចូលមតិ និងសំណើកែលម្អ',        icon:'✍️'},
  {id:'review', t:'ក្តារពិនិត្យសំណើ',                icon:'🗳'},
  {id:'print',  t:'មជ្ឈមណ្ឌលបោះពុម្ព A4',           icon:'🖨'},
  {id:'stats',  t:'ស្ថិតិ និងទិន្នន័យ',              icon:'📊'},
  {id:'admin',  t:'ការកំណត់ និងកែសម្រួល',            icon:'⚙️', adminOnly:true}
];

const openAcc = new Set(['d-DENGUE']);
function toggleAcc(el,key){
  el.classList.toggle('open');
  if(el.classList.contains('open')) openAcc.add(key); else openAcc.delete(key);
}

function sectionShell(s,inner){
  return `<section id="${s.id}" class="scroll-mt-24${s.adminOnly?' adminonly':''}">
    <h2 class="moul t20 pri mb-5 flex items-center gap-3">
      <span class="inline-block w-8" style="height:3px;background:var(--accent)"></span>
      <span>${s.icon} ${s.t}</span></h2>
    ${inner}</section>`;
}

let shellBuilt=false;
function renderAll(){
  if(!shellBuilt){ buildShell(); shellBuilt=true; }
  renderSOP(); renderReview(); renderStats(); renderAdmin();
  populatePrintScope(); renderPrintPreview(); updateBaseline();
}

function buildShell(){
  $('#main').innerHTML = [
    sectionShell(SECTIONS[0],`<div id="sopBox"></div>`),
    sectionShell(SECTIONS[1],submitFormHTML()),
    sectionShell(SECTIONS[2],`<div id="reviewBox"></div>`),
    sectionShell(SECTIONS[3],printCentreHTML()),
    sectionShell(SECTIONS[4],`<div id="statsBox"></div>`),
    sectionShell(SECTIONS[5],`<div id="adminBox"></div>`)
  ].join('');
  $('#tocList').innerHTML = SECTIONS.map((s,i)=>
    `<a class="tocl${s.adminOnly?' adminonly':''}" href="#${s.id}">${String(i+1).padStart(2,'0')} · ${s.t}</a>`).join('');
  $('#sopFeedbackForm').addEventListener('submit',handleFormSubmit);
  $('#targetDisease').addEventListener('change',updateBaseline);
}

/* ============================================================
   ៩. ផ្នែក SOP
   ============================================================ */
function diseaseLabel(key){
  const p=(currentProtocols&&currentProtocols[key])||EMPTY_PROTO;
  return String(p.title||key).split('(')[0].trim();
}
function mergedFor(key){ return feedbacks.filter(f=>f.targetDisease===key&&f.status==='MERGED'); }

function renderSOP(){
  const box=$('#sopBox'); if(!box) return;
  const keys=diseaseKeys();
  if(!keys.length){
    box.innerHTML=`<div class="card p-10 text-center muted t13">
      <div class="t26 mb-2">☁️</div>មិនទាន់មានទិន្នន័យពិធីការទេ
      <div class="t11 mt-1">សូមពិនិត្យថាបានដំណើរការមុខងារ setup ក្នុង Apps Script រួចរាល់។</div></div>`;
    return;
  }
  box.innerHTML = keys.map(key=>{
    const proto=currentProtocols[key], merged=mergedFor(key);
    const total=PILLAR_KEYS.reduce((n,k)=>n+(proto[k]?proto[k].length:0),0);
    const accKey='d-'+key, open=openAcc.has(accKey);
    return `<div class="acc card overflow-hidden mb-4 ${open?'open':''}">
      <div class="acc-head flex items-start gap-4 p-5" onclick="toggleAcc(this.parentElement,'${accKey}')">
        <div class="w-11 h-11 rounded-xl grid place-items-center t17 flex-none"
             style="background:color-mix(in srgb,var(--primary) 12%,transparent)">🏥</div>
        <div class="flex-1 min-w-0">
          <div class="font-bold t15 pri leading-snug">${escapeHtml(proto.title||key)}</div>
          <div class="t11 muted mt-1 leading-relaxed">${escapeHtml(proto.subtitle||'')}</div>
          <div class="flex flex-wrap gap-1.5 mt-2">
            ${PILLAR_UI.map(P=>`<span class="t9 font-bold px-2 py-[2px] rounded-md tnum"
              style="color:var(${P.v});background:var(${P.t})">${P.icon} ${(proto[P.key]||[]).length}</span>`).join('')}
            <span class="t9 font-bold px-2 py-[2px] rounded-md tnum muted"
              style="background:color-mix(in srgb,var(--muted) 12%,transparent)">សរុប ${total}</span>
          </div>
        </div>
        <div class="caret muted t13 mt-1">▾</div>
      </div>
      <div class="acc-body"><div class="px-5 pb-5 space-y-4" style="border-top:1px dashed var(--line);padding-top:1rem">
        ${PILLAR_UI.map((P,n)=>pillarBlock(key,proto,merged,P,n)).join('')}
      </div></div>
    </div>`;
  }).join('');
}

function pillarBlock(key,proto,merged,P,n){
  const items=proto[P.key]||[];
  const mine=merged.filter(m=>m.targetSection===P.section);
  const accKey=`p-${key}-${P.key}`, open=openAcc.has(accKey);
  return `<div class="acc rounded-xl overflow-hidden ${open?'open':''}" style="border:1px solid var(--line)">
    <div class="acc-head flex items-center gap-3 px-4 py-3" onclick="toggleAcc(this.parentElement,'${accKey}')"
         style="background:var(${P.t})">
      <span class="t15 flex-none">${P.icon}</span>
      <div class="flex-1 min-w-0">
        <div class="font-bold t12.5 leading-snug" style="color:var(${P.v})">${n+1}. ${P.title}</div>
        <div class="t9 muted mt-[2px]">${P.tag}</div>
      </div>
      <span class="t9 font-bold tnum px-2 py-[2px] rounded-md flex-none"
            style="color:var(${P.v});background:color-mix(in srgb,var(${P.v}) 14%,transparent)">${items.length+mine.length}</span>
      <span class="caret muted t11">▾</span>
    </div>
    <div class="acc-body"><div class="p-3 space-y-2">
      ${items.map((it,i)=>protoRow(it,i,P)).join('')}
      ${mine.map(m=>mergedRow(m,P)).join('')}
      ${(!items.length&&!mine.length)?`<div class="t11 muted italic text-center py-4">
        មិនទាន់មានចំណុចក្នុងផ្នែកនេះទេ — សូមបុគ្គលិកស្នើបន្ថែមតាមផ្នែក «បញ្ចូលមតិ»</div>`:''}
      <div class="adminonly flex items-center gap-2 pt-1">
        <input type="text" id="new-input-${key}-${P.key}" placeholder="${P.ph}" class="fld t11">
        <button class="btn t11 flex-none" style="background:var(${P.v})"
                onclick="addDirectProtocolItem('${key}','${P.key}')">+ បន្ថែម</button>
      </div>
    </div></div>
  </div>`;
}

function protoRow(it,i,P){
  const id=itemId(it), txt=itemText(it);
  const med=(mediaMap[id]||[]);
  return `<div class="rounded-lg p-2.5" style="background:var(--bg);border:1px solid var(--line)">
    <div class="flex items-start justify-between gap-2">
      <div class="flex items-start gap-2 min-w-0">
        <span class="font-bold flex-none t12" style="color:var(${P.v})">${P.numbered?(i+1)+'.':'•'}</span>
        <span class="t12.5 leading-relaxed">${escapeHtml(txt)}</span>
      </div>
      <button class="adminonly chip flex-none t9" style="padding:.15rem .5rem"
        onclick="deleteProtocolItem('${id}','${escapeAttr(txt)}')" title="លុបចំណុចនេះ">🗑</button>
    </div>
    <div class="mediagrid" ${med.length?'':'data-empty="1"'}>
      ${med.map(m=>mediaThumb(m)).join('')}
      ${mediaAddButtons(id)}
    </div>
  </div>`;
}

function mergedRow(m,P){
  return `<div class="rounded-lg p-2.5" style="background:color-mix(in srgb,var(${P.v}) 10%,transparent);border:1px solid color-mix(in srgb,var(${P.v}) 35%,transparent)">
    <div class="flex items-start justify-between gap-2">
      <div class="flex items-start gap-2 min-w-0">
        <span class="t9 font-bold px-1.5 py-[2px] rounded flex-none text-white" style="background:var(${P.v})">Merged</span>
        <span class="t12.5 leading-relaxed">${escapeHtml(m.content)}${ageChip(m.targetAgeGroup)}
          <span class="t9 muted">(${escapeHtml(m.authorName)})</span></span>
      </div>
      <button class="adminonly chip flex-none t9" style="padding:.15rem .5rem"
        onclick="unmergeFeedback('${m.id}')" title="ដកចេញពី SOP">↩</button>
    </div>
  </div>`;
}

/* ============================================================
   ១០. ទម្រង់ដាក់សំណើ
   ============================================================ */
function submitFormHTML(){
  const opt=(v,l)=>`<option value="${v}">${l}</option>`;
  return `<div class="card p-6">
    <p class="t12 muted leading-relaxed mb-5">បុគ្គលិកគ្រប់រូបអាចដាក់សំណើកែលម្អបាន ដោយមិនចាំបាច់មានគណនី។ សំណើនឹងបង្ហាញជូនក្រុមការងារភ្លាម ហើយរង់ចាំការអនុម័តពីអ្នកគ្រប់គ្រង មុននឹងចូលទៅក្នុង SOP ផ្លូវការ។</p>
    <form id="sopFeedbackForm" class="space-y-4">
      <div class="grid md:grid-cols-3 gap-4">
        <div><label class="lab" for="authorName">ឈ្មោះអ្នកស្នើ *</label>
          <input type="text" id="authorName" required placeholder="ឧ. វេជ្ជ. សុខ ចិន្តា" class="fld"></div>
        <div><label class="lab" for="authorRole">តួនាទី *</label>
          <select id="authorRole" required class="fld">
            ${opt('DOCTOR','វេជ្ជបណ្ឌិត (Doctor)')}${opt('NURSE','គិលានុបដ្ឋាយិកា (Nurse)')}
            ${opt('PHARMACIST','ឱសថការី (Pharmacist)')}${opt('ADMIN','ប្រធានផ្នែក (Director)')}
          </select></div>
        <div><label class="lab" for="authorDept">ផ្នែក *</label>
          <select id="authorDept" required class="fld">
            ${opt('IPD','IPD (សម្រាកព្យាបាល)')}${opt('OPD','OPD (ពិគ្រោះជំងឺក្រៅ)')}
            ${opt('ER','ER (សង្គ្រោះបន្ទាន់)')}${opt('ALL','ទូទៅ (All Units)')}
          </select></div>
      </div>
      <div class="grid md:grid-cols-3 gap-4">
        <div><label class="lab" for="targetAgeGroup">ក្រុមអាយុគោលដៅ *</label>
          <select id="targetAgeGroup" required class="fld">
            ${Object.keys(AGE_GROUPS).map(k=>opt(k,AGE_GROUPS[k].full)).join('')}
          </select></div>
        <div><label class="lab" for="targetDisease">ប្រភេទជំងឺ *</label>
          <select id="targetDisease" required class="fld"></select></div>
        <div><label class="lab" for="targetSection">ផ្នែកគោលដៅ *</label>
          <select id="targetSection" required class="fld">
            ${PILLAR_UI.map(P=>opt(P.section,P.icon+' '+P.short)).join('')}
          </select></div>
      </div>
      <div class="rounded-xl p-3.5 t11 leading-relaxed" style="background:color-mix(in srgb,var(--primary) 7%,transparent);border:1px solid var(--line)">
        <div class="flex items-center gap-2 mb-1.5">
          <span class="t9 uppercase tracking-[.15em] muted font-bold">ខ្លឹមសារបច្ចុប្បន្ន</span>
          <span id="currentDiseaseBadge" class="t9 font-bold px-2 py-[2px] rounded-md"
                style="background:color-mix(in srgb,var(--primary) 16%,transparent);color:var(--primary)">—</span>
        </div>
        <div id="baselineSummary" class="muted"></div>
      </div>
      <div><label class="lab" for="feedbackTitle">ចំណងជើងសំណើ *</label>
        <input type="text" id="feedbackTitle" required class="fld"
          placeholder="ឧ. បន្ថែមការតាមដានសញ្ញាវង្វេងចំពោះមនុស្សចាស់"></div>
      <div><label class="lab" for="feedbackContent">ខ្លឹមសារលម្អិត *</label>
        <textarea id="feedbackContent" rows="3" required class="fld"
          placeholder="សូមសរសេរឱ្យច្បាស់លាស់ និងអាចអនុវត្តបាន…"></textarea></div>
      <div><label class="lab" for="feedbackRationale">មូលហេតុ (មិនចាំបាច់)</label>
        <input type="text" id="feedbackRationale" class="fld"
          placeholder="ឧ. មនុស្សចាស់កើតគ្រុនឈាមច្រើនតែមានសម្ពាធឈាមធ្លាក់លឿន"></div>
      <div class="flex justify-end pt-1">
        <button type="submit" id="submitFeedbackBtn" class="btn">📨 បញ្ជូនសំណើ</button>
      </div>
    </form>
  </div>`;
}

function updateBaseline(){
  const sel=$('#targetDisease'); if(!sel) return;
  const keys=diseaseKeys();
  if(sel.options.length!==keys.length){
    const prev=sel.value;
    sel.innerHTML=keys.map(k=>`<option value="${k}">${escapeHtml(diseaseLabel(k))}</option>`).join('');
    sel.value = keys.indexOf(prev)>=0 ? prev : (keys[0]||'');
  }
  const proto=currentProtocols[sel.value]||EMPTY_PROTO;
  $('#currentDiseaseBadge').textContent=diseaseLabel(sel.value);
  $('#baselineSummary').innerHTML =
    `• <b>សំណួរគន្លឹះ៖</b> ${escapeHtml(textList(proto.questions).slice(0,2).join(' | ')||'គ្មាន')}…<br>
     • <b>តំណមដាច់ខាត៖</b> ${escapeHtml(textList(proto.restrictions)[0]||'គ្មាន')}…<br>
     • <b>សញ្ញាគ្រោះថ្នាក់៖</b> ${escapeHtml(textList(proto.redFlags)[0]||'គ្មាន')}…`;
}

/* ============================================================
   ១១. ក្តារពិនិត្យសំណើ
   ============================================================ */
let reviewFilters={disease:'ALL',age:'ALL_AGES',status:'ALL'};
function setFilter(k,v){ reviewFilters[k]=v; renderReview(); }

function renderReview(){
  const box=$('#reviewBox'); if(!box) return;
  const keys=diseaseKeys();
  const f=reviewFilters;
  const list=feedbacks.filter(x=>
    (f.disease==='ALL'||x.targetDisease===f.disease) &&
    (f.age==='ALL_AGES'||(x.targetAgeGroup||'ALL')===f.age) &&
    (f.status==='ALL'||x.status===f.status));

  const pending=feedbacks.filter(x=>x.status==='PENDING').length;
  box.innerHTML=`<div class="card p-6">
    <div class="flex flex-wrap items-center gap-2 mb-4 pb-4" style="border-bottom:1px solid var(--line)">
      <div class="flex-1 min-w-0">
        <div class="t13 font-bold pri">សំណើសរុប ${feedbacks.length} · រង់ចាំពិនិត្យ ${pending}</div>
        <div class="t10 muted mt-[2px]">${isAdmin()?'ចុច «អនុម័ត» ដើម្បីបញ្ចូលចំណុចទៅក្នុង SOP ផ្លូវការ':'ចូលជាអ្នកគ្រប់គ្រង ដើម្បីអនុម័ត ឬលុប'}</div>
      </div>
      <select class="fld t11" style="width:auto" onchange="setFilter('disease',this.value)">
        <option value="ALL">ជំងឺ៖ ទាំងអស់</option>
        ${keys.map(k=>`<option value="${k}" ${f.disease===k?'selected':''}>${escapeHtml(diseaseLabel(k))}</option>`).join('')}
      </select>
      <select class="fld t11" style="width:auto" onchange="setFilter('age',this.value)">
        <option value="ALL_AGES">អាយុ៖ ទាំងអស់</option>
        ${Object.keys(AGE_GROUPS).map(k=>`<option value="${k}" ${f.age===k?'selected':''}>${AGE_GROUPS[k].label}</option>`).join('')}
      </select>
      <select class="fld t11" style="width:auto" onchange="setFilter('status',this.value)">
        <option value="ALL">ស្ថានភាព៖ ទាំងអស់</option>
        <option value="PENDING" ${f.status==='PENDING'?'selected':''}>រង់ចាំពិនិត្យ</option>
        <option value="MERGED" ${f.status==='MERGED'?'selected':''}>អនុម័តរួច</option>
      </select>
    </div>
    <div class="space-y-3">${list.length?list.map(reviewCard).join(''):
      `<div class="text-center py-12 muted t12">មិនមានសំណើក្នុងលក្ខខណ្ឌនេះទេ</div>`}</div>
  </div>`;
}

function reviewCard(fb){
  const merged=fb.status==='MERGED', P=pillarOf(fb.targetSection);
  return `<div class="rounded-xl p-4 space-y-2.5" style="background:${merged?`color-mix(in srgb,var(--ok) 8%,transparent)`:'var(--bg)'};border:1px solid ${merged?'color-mix(in srgb,var(--ok) 35%,transparent)':'var(--line)'}">
    <div class="flex flex-wrap justify-between items-start gap-2">
      <div class="flex flex-wrap items-center gap-1.5">
        <span class="t9 font-bold px-2 py-[2px] rounded-md" style="background:color-mix(in srgb,var(--primary) 13%,transparent);color:var(--primary)">${escapeHtml(diseaseLabel(fb.targetDisease))}</span>
        ${ageBadge(fb.targetAgeGroup)}
        <span class="t9 font-bold px-2 py-[2px] rounded-md" style="color:var(${P.v});background:var(${P.t})">${P.icon} ${P.short}</span>
        <span class="t9 font-bold px-2 py-[2px] rounded-full" style="color:var(${merged?'--ok':'--warn'});background:color-mix(in srgb,var(${merged?'--ok':'--warn'}) 14%,transparent)">${merged?'✓ អនុម័តរួច':'⏳ រង់ចាំ'}</span>
      </div>
      <div class="t9 muted tnum">${escapeHtml(fb.date||'')}</div>
    </div>
    <div>
      <div class="t13 font-bold">${escapeHtml(fb.title)}</div>
      <div class="t12 muted mt-1 leading-relaxed">${escapeHtml(fb.content)}</div>
      ${fb.rationale?`<div class="t10 muted italic mt-1.5 p-2 rounded-lg" style="background:color-mix(in srgb,var(--primary) 6%,transparent)">មូលហេតុ៖ ${escapeHtml(fb.rationale)}</div>`:''}
    </div>
    <div class="flex flex-wrap justify-between items-center gap-2 pt-2" style="border-top:1px solid var(--line)">
      <div class="t10 muted">👤 <b style="color:var(--ink)">${escapeHtml(fb.authorName)}</b> (${escapeHtml(roleLabel(fb.authorRole))} • ${escapeHtml(deptLabel(fb.authorDept))})</div>
      <div class="flex items-center gap-2">
        <button class="chip t10" onclick="upvoteFeedback('${fb.id}')">👍 ឯកភាព (${fb.upvotes||1})</button>
        ${isAdmin()?(merged
          ? `<button class="chip t10" onclick="unmergeFeedback('${fb.id}')">ដកចេញពី SOP</button>`
          : `<button class="btn t10" style="padding:.3rem .8rem" onclick="mergeFeedback('${fb.id}')">✓ អនុម័តចូល SOP</button>`)
        +`<button class="chip t10" onclick="deleteFeedback('${fb.id}')" title="លុប">🗑</button>`:''}
      </div>
    </div>
  </div>`;
}
