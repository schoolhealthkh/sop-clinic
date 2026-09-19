/* ============================================================
   ១២. សកម្មភាពលើសំណើ
   ============================================================ */
async function handleFormSubmit(e){
  e.preventDefault();
  const btn=$('#submitFeedbackBtn');
  btn.disabled=true;
  const payload={
    voterToken:voterToken(),
    authorName:$('#authorName').value.trim(),
    authorRole:$('#authorRole').value,
    authorDept:$('#authorDept').value,
    targetDisease:$('#targetDisease').value,
    targetAgeGroup:$('#targetAgeGroup').value,
    targetSection:$('#targetSection').value,
    title:$('#feedbackTitle').value.trim(),
    content:$('#feedbackContent').value.trim(),
    rationale:$('#feedbackRationale').value.trim()
  };
  try{
    const res=await call('apiSubmitFeedback',payload);
    if(!res||!res.ok){ toast((res&&res.error)||'បញ្ជូនមិនបានសម្រេច','error'); return; }
    $('#feedbackTitle').value=''; $('#feedbackContent').value=''; $('#feedbackRationale').value='';
    await refreshAll(false);
    toast('បញ្ជូនសំណើជោគជ័យ! បុគ្គលិកទាំងអស់មើលឃើញភ្លាម។','success');
    const r=document.getElementById('review'); if(r) r.scrollIntoView({block:'start'});
  }catch(err){ toast('ភ្ជាប់ម៉ាស៊ីនបម្រើមិនបាន៖ '+err.message,'error'); }
  finally{ btn.disabled=false; }
}

async function upvoteFeedback(id){
  try{
    const res=await call('apiUpvote',id,voterToken());
    if(!res||!res.ok){ toast((res&&res.error)||'ឯកភាពមិនបានសម្រេច','info'); return; }
    await refreshAll(false);
  }catch(err){ toast('ភ្ជាប់ម៉ាស៊ីនបម្រើមិនបាន៖ '+err.message,'error'); }
}

async function mergeFeedback(id){
  if(!requireAdmin()) return;
  const it=feedbacks.filter(f=>f.id===id)[0];
  await serverAction('apiSetStatus',[adminPin,id,'MERGED'],`បានអនុម័ត «${it?it.title:''}» ចូល SOP ផ្លូវការ`);
}
async function unmergeFeedback(id){
  if(!requireAdmin()) return;
  await serverAction('apiSetStatus',[adminPin,id,'PENDING'],'បានដកចេញពី SOP ផ្លូវការ');
}
async function deleteFeedback(id){
  if(!requireAdmin()) return;
  const it=feedbacks.filter(f=>f.id===id)[0]; if(!it) return;
  const ok=await askConfirm({title:'លុបសំណើនេះចោល?',
    message:`«${it.title}» ដោយ ${it.authorName}\n\nសំណើនេះនឹងត្រូវលុបចោលជាអចិន្ត្រៃយ៍សម្រាប់បុគ្គលិកទាំងអស់។`,
    okLabel:'លុបចោល'});
  if(!ok) return;
  await serverAction('apiDeleteFeedback',[adminPin,id],'បានលុបសំណើនេះចោល');
}

/* ============================================================
   ១៣. សកម្មភាពលើពិធីការ
   ============================================================ */
async function addDirectProtocolItem(key,pillar){
  if(!requireAdmin()) return;
  const el=document.getElementById(`new-input-${key}-${pillar}`); if(!el) return;
  const text=el.value.trim();
  if(!text){ toast('សូមបំពេញអត្ថបទជាមុនសិន','warning'); return; }
  openAcc.add('d-'+key); openAcc.add(`p-${key}-${pillar}`);
  const done=await serverAction('apiAddProtocolItem',[adminPin,key,pillar,text],'បានបន្ថែមចំណុចថ្មីចូល SOP');
  if(done){ const el2=document.getElementById(`new-input-${key}-${pillar}`); if(el2) el2.value=''; }
}

async function deleteProtocolItem(id,preview){
  if(!requireAdmin()) return;
  const t=String(preview||'');
  const ok=await askConfirm({title:'លុបចំណុចនេះចេញពី SOP?',
    message:`«${t.length>160?t.slice(0,160)+'…':t}»\n\nចំណុចនេះនឹងត្រូវដកចេញសម្រាប់បុគ្គលិកទាំងអស់ និងចេញពីសន្លឹកបោះពុម្ព។`,
    okLabel:'លុបចេញ'});
  if(!ok) return;
  await serverAction('apiDeleteProtocolItem',[adminPin,id],'បានលុបចំណុចនេះចេញពី SOP');
}

/* ============================================================
   ១៤. មេឌា — រូបភាព វីដេអូ PDF និង YouTube
   ============================================================ */
let mediaTargetId=null;

function mediaThumbSrc(m){
  if(m.kind==='youtube') return 'https://img.youtube.com/vi/'+m.url+'/mqdefault.jpg';
  if(m.fileId) return 'https://drive.google.com/thumbnail?id='+m.fileId+'&sz=w400';
  return m.url;
}
function mediaFull(m){
  if(m.kind==='youtube') return {tag:'iframe',src:'https://www.youtube.com/embed/'+m.url+'?autoplay=1'};
  if(m.fileId) return (m.kind==='image')
    ? {tag:'img',src:'https://drive.google.com/thumbnail?id='+m.fileId+'&sz=w1600'}
    : {tag:'iframe',src:'https://drive.google.com/file/d/'+m.fileId+'/preview'};
  if(m.kind==='image') return {tag:'img',src:m.url};
  if(m.kind==='video') return {tag:'video',src:m.url};
  return {tag:'iframe',src:m.url};
}

function mediaThumb(m){
  const label={image:'រូបភាព',video:'▶ វីដេអូ',pdf:'PDF',youtube:'▶ YouTube'}[m.kind]||'';
  const asImage = m.kind==='image' || m.kind==='youtube';
  const visual = asImage
    ? `<img src="${escapeAttr(mediaThumbSrc(m))}" alt="${escapeAttr(m.caption||m.name||'')}" loading="lazy">`
    : `<div class="mfile">${m.kind==='pdf'?'📄':'🎬'}<br>${escapeHtml((m.name||m.kind).slice(0,26))}</div>`;
  return `<div class="mthumb" onclick="openLightbox('${m.id}')" title="${escapeAttr(m.caption||m.name||'')}">
    ${visual}<span class="mbadge">${label}</span>
    <button class="mdel" onclick="event.stopPropagation();deleteMedia('${m.id}')" title="លុប">✕</button>
  </div>`;
}

/** ប៊ូតុងភ្ជាប់ឯកសារ — ពីរផ្លូវច្បាស់លាស់ មិនប្រើប្រអប់បញ្ជាក់ទេ */
function mediaAddButtons(itemId){
  return `<button class="madd adminonly" onclick="pickMediaFile('${itemId}')" title="ផ្ទុកឡើងពីឧបករណ៍">
      <span class="t17">📁</span><span class="t9 font-bold">ផ្ទុកឯកសារ</span></button>
    <button class="madd adminonly" onclick="pickMediaUrl('${itemId}')" title="ភ្ជាប់តំណ">
      <span class="t17">🔗</span><span class="t9 font-bold">តំណ / YouTube</span></button>`;
}

function pickMediaFile(itemId){
  if(!requireAdmin()) return;
  mediaTargetId=itemId;
  $('#mediaFile').click();
}
async function pickMediaUrl(itemId){
  if(!requireAdmin()) return;
  const url=prompt('បញ្ចូលតំណ https:// (YouTube · រូបភាព · វីដេអូ · PDF)៖');
  if(!url||!url.trim()) return;
  const cap=prompt('ចំណងជើងខ្លី (មិនចាំបាច់)៖')||'';
  await serverAction('apiAddMediaUrl',[adminPin,itemId,url.trim(),cap.trim()],'បានភ្ជាប់តំណរួចរាល់');
}

function initMediaInput(){
  const f=$('#mediaFile'); if(!f) return;
  f.addEventListener('change',async e=>{
    const file=e.target.files&&e.target.files[0];
    e.target.value='';
    if(!file||!mediaTargetId) return;
    if(file.size>12*1024*1024){ toast('ឯកសារធំពេក — អតិបរមា ១២ MB','error'); return; }
    toast('កំពុងផ្ទុកឡើង…','info');
    let dataUrl=null;
    try{
      dataUrl=await new Promise((res,rej)=>{
        const r=new FileReader();
        r.onload=()=>res(r.result);
        r.onerror=()=>rej(new Error('អានឯកសារមិនបាន'));
        r.readAsDataURL(file);
      });
    }catch(err){ toast(err.message,'error'); return; }
    await serverAction('apiAddMediaFile',[adminPin,mediaTargetId,dataUrl,file.name,''],'បានភ្ជាប់ឯកសាររួចរាល់');
  });
}

async function deleteMedia(id){
  if(!requireAdmin()) return;
  const ok=await askConfirm({title:'លុបឯកសារភ្ជាប់នេះ?',
    message:'ឯកសារនឹងត្រូវដកចេញពី SOP និងលុបចេញពី Google Drive។',okLabel:'លុប'});
  if(!ok) return;
  await serverAction('apiDeleteMedia',[adminPin,id],'បានលុបឯកសារភ្ជាប់');
}

/* ---- ប្រអប់មើលពេញអេក្រង់ ---- */
let lbList=[], lbIdx=0;
const allMedia = () => Object.keys(mediaMap).reduce((a,k)=>a.concat(mediaMap[k]||[]),[]);
function openLightbox(id){
  lbList=allMedia();
  const i=lbList.findIndex(m=>m.id===id);
  lbIdx=i<0?0:i;
  showLightbox();
}
function showLightbox(){
  const m=lbList[lbIdx]; if(!m) return;
  const f=mediaFull(m);
  $('#lbbody').innerHTML = f.tag==='img' ? `<img src="${escapeAttr(f.src)}" alt="">`
    : f.tag==='video' ? `<video src="${escapeAttr(f.src)}" controls autoplay playsinline></video>`
    : `<iframe src="${escapeAttr(f.src)}" allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe>`;
  $('#lbcap').textContent=m.caption||m.name||'';
  $('#lbn').textContent=(lbIdx+1)+' / '+lbList.length;
  $('#lb').style.display='flex';
  document.body.style.overflow='hidden';
}
function closeLightbox(){ $('#lb').style.display='none'; $('#lbbody').innerHTML=''; document.body.style.overflow=''; }
function initLightbox(){
  initMediaInput();
  const lb=$('#lb'); if(!lb) return;
  const step=d=>{ if(!lbList.length) return; lbIdx=(lbIdx+d+lbList.length)%lbList.length; showLightbox(); };
  $('#lbclose').onclick=e=>{e.stopPropagation();closeLightbox();};
  $('#lbprev').onclick=e=>{e.stopPropagation();step(-1);};
  $('#lbnext').onclick=e=>{e.stopPropagation();step(1);};
  lb.addEventListener('click',e=>{ if(e.target===lb) closeLightbox(); });
  window.addEventListener('keydown',e=>{
    if(lb.style.display!=='flex') return;
    if(e.key==='Escape') closeLightbox();
    else if(e.key==='ArrowLeft') step(-1);
    else if(e.key==='ArrowRight') step(1);
  });
}
