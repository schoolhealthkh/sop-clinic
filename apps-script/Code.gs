/**
 * ប្រព័ន្ធចងក្រង SOP វេជ្ជសាស្ត្រ — Backend API
 * Google Apps Script (Web App) + Google Sheet ជាមូលដ្ឋានទិន្នន័យ
 *
 * ទម្រង់ថ្មី៖ បម្រើជា JSON API សម្រាប់គេហទំព័រស្ថិតនៅ GitHub Pages
 *   អាន  →  GET  ?action=bootstrap
 *   សរសេរ →  POST  body = JSON (Content-Type: text/plain  ← ជៀសវាង CORS preflight)
 *
 * ដំឡើង៖ Extensions ▸ Apps Script ▸ បិទភ្ជាប់ ▸ Run ▸ setup
 *        Deploy ▸ New deployment ▸ Web app ▸ Execute as: Me ▸ Access: Anyone
 */

/* ============================================================
   ១. CONFIG
   ============================================================ */
const SHEETS = {
  DISEASES:  'Diseases',
  PROTOCOLS: 'Protocols',
  FEEDBACKS: 'Feedbacks',
  UPVOTES:   'Upvotes',
  MEDIA:     'Media',
  SETTINGS:  'Settings',
  PRINTTEXT: 'PrintText',
  LOG:       'Log'
};

const HEADERS = {
  DISEASES:  ['key', 'titleKh', 'subtitleKh', 'sortOrder'],
  PROTOCOLS: ['id', 'diseaseKey', 'pillar', 'text', 'sortOrder'],
  FEEDBACKS: ['id', 'createdAt', 'authorName', 'authorRole', 'authorDept',
              'targetDisease', 'targetAgeGroup', 'targetSection',
              'title', 'content', 'rationale', 'status', 'upvotes',
              'reviewedAt', 'reviewedBy'],
  UPVOTES:   ['feedbackId', 'voterToken', 'createdAt'],
  MEDIA:     ['id', 'itemId', 'kind', 'fileId', 'url', 'name', 'caption', 'createdAt'],
  SETTINGS:  ['key', 'value'],
  PRINTTEXT: ['key', 'value'],
  LOG:       ['timestamp', 'action', 'actor', 'detail']
};

const PILLARS  = ['questions', 'restrictions', 'redFlags', 'orders', 'monitoring', 'escalation'];
const SECTIONS = ['QUESTIONS', 'RESTRICTIONS', 'REDFLAGS', 'ORDERS', 'MONITORING', 'ESCALATION'];
const AGES     = ['ALL', 'PEDIATRIC', 'ADULT', 'ELDERLY'];
const ROLES    = ['DOCTOR', 'NURSE', 'PHARMACIST', 'ADMIN', 'OTHER'];
const DEPTS    = ['IPD', 'OPD', 'ER', 'ALL'];
const STATUSES = ['PENDING', 'MERGED'];

const LIMITS = {
  NAME: 80, TITLE: 200, CONTENT: 2000, RATIONALE: 1000,
  PROTOCOL_TEXT: 1000, CAPTION: 200, SETTING_VALUE: 600,
  DISEASE_KEY: 24, SUBMITS_PER_HOUR: 20,
  PIN_TRIES_PER_10MIN: 8,
  MEDIA_BYTES: 12 * 1024 * 1024,
  MEDIA_PER_ITEM: 6,
  MAX_DISEASES: 40,
  MAX_ITEMS_PER_PILLAR: 200
};

const MEDIA_KINDS = ['image', 'video', 'pdf', 'youtube'];
const MEDIA_FOLDER_PROP = 'MEDIA_FOLDER_ID';
const PIN_PROP = 'ADMIN_PIN';
const CLINIC_FOLDER_NAME = 'SAY RAS CLINIC — SOP Media';
const LOCK_MS  = 20000;

/** តម្លៃដើមនៃការកំណត់ — គ្រប់តម្លៃកែបានពីផ្ទាំងអ្នកគ្រប់គ្រង */
const DEFAULT_SETTINGS = {
  appNameKh:    'មន្ទីរសម្រាកព្យាបាល សាយ រះ',
  appNameEn:    'SAY RAS CLINIC',
  logoText:     'SR',
  docTitle:     'ប្រព័ន្ធចងក្រង SOP សាយ រះ',
  primary:      '#004792',
  primary2:     '#0b63c5',
  accent:       '#d4af37',
  codePrefix:   'SRC',
  footerNote:   'ឯកសារផ្ទៃក្នុង — សម្រាប់បុគ្គលិកគ្លីនិកតែប៉ុណ្ណោះ'
};

/** អត្ថបទក្នុងទម្រង់ព្រីន A4 — កែបានទាំងអស់ */
const DEFAULT_PRINTTEXT = {
  cgTitle:      'ប័ណ្ណតាមដាន និងសំណួរសួរនាំសុខភាពអ្នកជំងឺ',
  cgTitleEn:    'PATIENT & CAREGIVER MONITORING FLOWSHEET',
  cgObjTitle:   'គោលបំណងនៃការប្រើប្រាស់ប័ណ្ណនេះសម្រាប់អ្នកជំងឺ និងអាណាព្យាបាល (Caregiver Card Objectives):',
  cgObj1:       '១. ដឹងពីសំណួរត្រូវសួរ៖ សង្កេត និងសួរនាំអ្នកជំងឺរៀងរាល់ ២-៣ ម៉ោង មិនភ្លេចភ្លាំងចំណុចគន្លឹះ។',
  cgObj2:       '២. កត់ត្រាជូនគ្រូពេទ្យ៖ កត់ត្រាកម្តៅ ជាតិទឹកញ៉ាំ និងការនោមជាក់ស្តែងរាយការណ៍ពេលគ្រូពេទ្យចុះជុំ (Round)។',
  cgObj3:       '៣. សង្គ្រោះទាន់ពេល៖ យល់ច្បាស់ពីសញ្ញាគ្រោះថ្នាក់ (Red Flags) និងតំណម ដើម្បីចុចកណ្តឹងហៅគ្រូពេទ្យភ្លាមៗ។',
  stTitle:      'ពិធីការស្តង់ដារ និងតារាងតាមដានគ្លីនិក',
  stTitleEn:    'INPATIENT CLINICAL FLOWSHEET',
  qtTitle:      'តារាងកត់ត្រារហ័សប្រចាំថ្ងៃ (Quick Time Tracker)',
  signNurse:    'ហត្ថលេខាគិលានុបដ្ឋាយិកា',
  signDoctor:   'ហត្ថលេខាវេជ្ជបណ្ឌិត',
  fieldPatient: 'ឈ្មោះអ្នកជំងឺ',
  fieldAge:     'អាយុ',
  fieldWeight:  'ទម្ងន់អ្នកជំងឺ',
  fieldBed:     'បន្ទប់/គ្រែ',
  fieldDay:     'ថ្ងៃជំងឺទី',
  fieldGuard:   'អ្នកឆ្លើយតបការថែទាំ'
};

/* ============================================================
   ២. WEB APP ROUTER  (CORS-safe)
   ------------------------------------------------------------
   Apps Script មិនអាចដាក់ CORS header ដោយខ្លួនឯងបានទេ ហើយក៏មិន
   ឆ្លើយតប OPTIONS ដែរ។ ដូច្នេះត្រូវប្រើតែ "simple request"៖
     · GET  ធម្មតា (គ្មាន header ពិសេស)
     · POST ជាមួយ Content-Type: text/plain
   ការឆ្លើយតបចុងក្រោយពី googleusercontent មាន
   Access-Control-Allow-Origin: * ស្រាប់។
   ============================================================ */
function doGet(e) {
  const p = (e && e.parameter) || {};
  const action = String(p.action || '');
  if (!action) return page_();                       // បើកផ្ទាល់ → បង្ហាញទំព័របង្វែរ
  try {
    return json_(routeRead_(action, p), p.callback);
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message || err) }, p.callback);
  }
}

function doPost(e) {
  let body = {};
  try {
    const raw = (e && e.postData && e.postData.contents) || '{}';
    body = JSON.parse(raw);
  } catch (err) {
    return json_({ ok: false, error: 'BAD_JSON' });
  }
  try {
    return json_(routeWrite_(String(body.action || ''), body));
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message || err) });
  }
}

function routeRead_(action, p) {
  switch (action) {
    case 'bootstrap': return apiBootstrap();
    case 'ping':      return { ok: true, serverTime: Date.now(), version: API_VERSION };
    default:          return { ok: false, error: 'UNKNOWN_ACTION' };
  }
}

function routeWrite_(action, b) {
  switch (action) {
    /* ចំហសម្រាប់បុគ្គលិកគ្រប់រូប */
    case 'submitFeedback':     return apiSubmitFeedback(b.payload);
    case 'upvote':             return apiUpvote(b.feedbackId, b.voterToken);
    case 'checkPin':           return apiCheckPin(b.pin);

    /* ត្រូវការលេខសម្ងាត់ */
    case 'setStatus':          return apiSetStatus(b.pin, b.feedbackId, b.status);
    case 'deleteFeedback':     return apiDeleteFeedback(b.pin, b.feedbackId);

    case 'addProtocolItem':    return apiAddProtocolItem(b.pin, b.diseaseKey, b.pillar, b.text);
    case 'updateProtocolItem': return apiUpdateProtocolItem(b.pin, b.itemId, b.text);
    case 'deleteProtocolItem': return apiDeleteProtocolItem(b.pin, b.itemId);
    case 'moveProtocolItem':   return apiMoveProtocolItem(b.pin, b.itemId, b.direction);
    case 'resetDisease':       return apiResetDisease(b.pin, b.diseaseKey);

    case 'addDisease':         return apiAddDisease(b.pin, b.key, b.title, b.subtitle);
    case 'updateDisease':      return apiUpdateDisease(b.pin, b.key, b.title, b.subtitle);
    case 'deleteDisease':      return apiDeleteDisease(b.pin, b.key);
    case 'moveDisease':        return apiMoveDisease(b.pin, b.key, b.direction);

    case 'saveSettings':       return apiSaveSettings(b.pin, b.settings);
    case 'savePrintText':      return apiSavePrintText(b.pin, b.printText);

    case 'addMediaFile':       return apiAddMediaFile(b.pin, b.itemId, b.dataUrl, b.name, b.caption);
    case 'addMediaUrl':        return apiAddMediaUrl(b.pin, b.itemId, b.url, b.caption);
    case 'deleteMedia':        return apiDeleteMedia(b.pin, b.mediaId);

    default:                   return { ok: false, error: 'UNKNOWN_ACTION' };
  }
}

const API_VERSION = '2.0.0';

function json_(obj, callback) {
  const text = JSON.stringify(obj);
  if (callback && /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(callback)) {
    return ContentService.createTextOutput(callback + '(' + text + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(text)
    .setMimeType(ContentService.MimeType.JSON);
}

/** បើកតំណ API ដោយផ្ទាល់ → បង្វែរទៅគេហទំព័រ (បើកំណត់ SITE_URL រួច) */
function page_() {
  const site = String(PropertiesService.getScriptProperties().getProperty('SITE_URL') || '').trim();
  const safe = /^https:\/\/[A-Za-z0-9._~:\/?#\[\]@!$&'()*+,;=%-]*$/.test(site) ? site : '';
  const esc = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;')
                            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const body = safe
    ? '<meta http-equiv="refresh" content="0; url=' + esc(safe) + '">' +
      '<p>កំពុងបញ្ជូនបន្តទៅគេហទំព័រ SOP…</p>' +
      '<p><a href="' + esc(safe) + '">ចុចទីនេះ បើមិនបានបញ្ជូនបន្តដោយស្វ័យប្រវត្តិ</a></p>' +
      '<script>location.replace(' + JSON.stringify(safe) + ');<\/script>'
    : '<h2>SOP API — កំពុងដំណើរការ</h2>' +
      '<p>នេះជា API មិនមែនជាគេហទំព័រទេ។</p>' +
      '<p>សូម Run មុខងារ <code>setSiteUrl()</code> ដើម្បីបង្វែរទៅគេហទំព័រដោយស្វ័យប្រវត្តិ។</p>';
  return HtmlService.createHtmlOutput(
    '<!doctype html><meta charset="utf-8"><title>SOP</title>' +
    '<body style="font-family:system-ui;padding:2rem;line-height:1.8;text-align:center">' +
    body + '</body>'
  ).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/* ============================================================
   ៣. ដំឡើងម្តងគត់
   ============================================================ */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('សូម Run setup ពីក្នុង Google Sheet (Extensions ▸ Apps Script).');

  Object.keys(SHEETS).forEach(k => ensureSheet_(ss, SHEETS[k], HEADERS[k]));

  const dz = ss.getSheetByName(SHEETS.DISEASES);
  const pz = ss.getSheetByName(SHEETS.PROTOCOLS);

  if (dz.getLastRow() <= 1 && pz.getLastRow() <= 1) {
    const dRows = [], pRows = [];
    let order = 0;
    Object.keys(SEED_PROTOCOLS).forEach(key => {
      const d = SEED_PROTOCOLS[key];
      dRows.push([key, d.title, d.subtitle, ++order]);
      PILLARS.forEach(pillar => {
        (d[pillar] || []).forEach((text, i) => {
          pRows.push([newId_('P'), key, pillar, text, i + 1]);
        });
      });
    });
    if (dRows.length) dz.getRange(2, 1, dRows.length, HEADERS.DISEASES.length).setValues(dRows);
    if (pRows.length) pz.getRange(2, 1, pRows.length, HEADERS.PROTOCOLS.length).setValues(pRows);
    log_('SETUP', 'system', 'seeded ' + dRows.length + ' diseases / ' + pRows.length + ' items');
  }

  seedKeyValue_(ss, SHEETS.SETTINGS,  DEFAULT_SETTINGS);
  seedKeyValue_(ss, SHEETS.PRINTTEXT, DEFAULT_PRINTTEXT);

  const props = PropertiesService.getScriptProperties();
  let pin = props.getProperty(PIN_PROP);
  if (!pin) {
    pin = String(Math.floor(100000 + Math.random() * 900000));
    props.setProperty(PIN_PROP, pin);
  }

  const msg = 'រួចរាល់!\n\nលេខសម្ងាត់អ្នកគ្រប់គ្រង (Admin PIN): ' + pin +
              '\n\nសូមកត់ទុក។ ប្តូរបានដោយ Run មុខងារ setAdminPin។';
  Logger.log(msg);
  try { SpreadsheetApp.getUi().alert(msg); } catch (e) { /* headless */ }
  return pin;
}

/** បញ្ចូលតម្លៃដើមដែលនៅខ្វះ ដោយមិនលុបតម្លៃដែលកែរួច */
function seedKeyValue_(ss, sheetName, defaults) {
  const sh = ensureSheet_(ss, sheetName, HEADERS[sheetName === SHEETS.SETTINGS ? 'SETTINGS' : 'PRINTTEXT']);
  const have = {};
  if (sh.getLastRow() >= 2) {
    sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues()
      .forEach(r => { have[String(r[0])] = true; });
  }
  const add = Object.keys(defaults)
    .filter(k => !have[k])
    .map(k => [k, defaults[k]]);
  if (add.length) sh.getRange(sh.getLastRow() + 1, 1, add.length, 2).setValues(add);
  return add.length;
}

/** ប្តូរលេខសម្ងាត់ — កែតម្លៃខាងក្រោម រួច Run មុខងារនេះ */
function setAdminPin() {
  const NEW_PIN = '';                    // ← ដាក់លេខសម្ងាត់ថ្មីត្រង់នេះ
  if (!NEW_PIN || String(NEW_PIN).length < 4) {
    throw new Error('សូមកំណត់ NEW_PIN យ៉ាងតិច ៤ តួ នៅក្នុងមុខងារ setAdminPin មុននឹង Run.');
  }
  PropertiesService.getScriptProperties().setProperty(PIN_PROP, String(NEW_PIN));
  log_('PIN_CHANGED', 'admin', '');
  return 'បានប្តូរលេខសម្ងាត់រួចរាល់។';
}

/** កំណត់តំណគេហទំព័រ GitHub Pages — កែតម្លៃខាងក្រោម រួច Run */
function setSiteUrl() {
  const URL = '';                        // ← ឧ. https://username.github.io/sop-clinic/
  if (!URL) throw new Error('សូមដាក់តំណគេហទំព័រក្នុងអថេរ URL មុននឹង Run.');
  PropertiesService.getScriptProperties().setProperty('SITE_URL', String(URL));
  return 'បានកំណត់ SITE_URL រួចរាល់។';
}

function ensureSheet_(ss, name, headers) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, headers.length).setValues([headers])
      .setFontWeight('bold').setBackground('#e0f2fe');
    sh.setFrozenRows(1);
  }
  return sh;
}

/* ============================================================
   ៤. អាន
   ============================================================ */
function apiBootstrap() {
  const ss = ss_();
  const diseases     = rows_(ss, SHEETS.DISEASES,  HEADERS.DISEASES);
  const protocolRows = rows_(ss, SHEETS.PROTOCOLS, HEADERS.PROTOCOLS);
  const feedbackRows = rows_(ss, SHEETS.FEEDBACKS, HEADERS.FEEDBACKS);

  diseases.sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0));

  const protocols = {};
  const order = [];
  diseases.forEach(d => {
    order.push(String(d.key));
    protocols[d.key] = { title: d.titleKh, subtitle: d.subtitleKh,
                         questions: [], restrictions: [], redFlags: [],
                         orders: [], monitoring: [], escalation: [] };
  });

  protocolRows
    .sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0))
    .forEach(r => {
      const bucket = protocols[r.diseaseKey];
      if (bucket && PILLARS.indexOf(r.pillar) >= 0 && String(r.text).trim()) {
        bucket[r.pillar].push({ id: r.id, text: String(r.text) });
      }
    });

  const feedbacks = feedbackRows.map(r => ({
    id: r.id,
    date: r.createdAt ? formatDate_(r.createdAt) : '',
    createdAt: r.createdAt ? new Date(r.createdAt).getTime() : 0,
    authorName: r.authorName, authorRole: r.authorRole, authorDept: r.authorDept,
    targetDisease: r.targetDisease,
    targetAgeGroup: AGES.indexOf(r.targetAgeGroup) >= 0 ? r.targetAgeGroup : 'ALL',
    targetSection: r.targetSection,
    title: r.title, content: r.content, rationale: r.rationale,
    status: r.status === 'MERGED' ? 'MERGED' : 'PENDING',
    upvotes: Number(r.upvotes) || 0
  })).sort((a, b) => b.createdAt - a.createdAt);

  const media = {};
  rows_(ss, SHEETS.MEDIA, HEADERS.MEDIA).forEach(r => {
    const key = String(r.itemId || '');
    if (!key) return;
    (media[key] = media[key] || []).push({
      id: r.id, kind: r.kind, fileId: r.fileId, url: r.url,
      name: r.name, caption: r.caption
    });
  });

  return {
    ok: true,
    version: API_VERSION,
    order: order,
    protocols: protocols,
    feedbacks: feedbacks,
    media: media,
    settings:  readKeyValue_(ss, SHEETS.SETTINGS,  DEFAULT_SETTINGS),
    printText: readKeyValue_(ss, SHEETS.PRINTTEXT, DEFAULT_PRINTTEXT),
    serverTime: Date.now()
  };
}

function readKeyValue_(ss, sheetName, defaults) {
  const out = {};
  Object.keys(defaults).forEach(k => { out[k] = defaults[k]; });
  const sh = ss.getSheetByName(sheetName);
  if (sh && sh.getLastRow() >= 2) {
    sh.getRange(2, 1, sh.getLastRow() - 1, 2).getValues().forEach(r => {
      const k = String(r[0] || '').trim();
      if (k && Object.prototype.hasOwnProperty.call(defaults, k)) out[k] = String(r[1]);
    });
  }
  return out;
}

/* ============================================================
   ៥. សរសេរ — ចំហសម្រាប់បុគ្គលិកគ្រប់រូប
   ============================================================ */
function apiSubmitFeedback(payload) {
  const p = payload || {};
  const token = clean_(p.voterToken, 64);

  const cache = CacheService.getScriptCache();
  const rateKey = 'rate_' + (token || 'anon');
  const count = Number(cache.get(rateKey) || 0);
  if (count >= LIMITS.SUBMITS_PER_HOUR) {
    return { ok: false, error: 'លោកអ្នកបានដាក់សំណើច្រើនពេកក្នុងមួយម៉ោង។ សូមរង់ចាំបន្តិច។' };
  }

  const authorName = clean_(p.authorName, LIMITS.NAME);
  const title      = clean_(p.title, LIMITS.TITLE);
  const content    = clean_(p.content, LIMITS.CONTENT);

  if (!authorName) return { ok: false, error: 'សូមបំពេញឈ្មោះ។' };
  if (!title)      return { ok: false, error: 'សូមបំពេញចំណងជើងសំណើ។' };
  if (!content)    return { ok: false, error: 'សូមបំពេញខ្លឹមសារសំណើ។' };

  const disease = String(p.targetDisease || '');
  if (knownDiseaseKeys_().indexOf(disease) < 0) return { ok: false, error: 'ប្រភេទជំងឺមិនត្រឹមត្រូវ។' };

  const section = String(p.targetSection || '');
  if (SECTIONS.indexOf(section) < 0) return { ok: false, error: 'ផ្នែកគោលដៅមិនត្រឹមត្រូវ។' };

  const age  = AGES.indexOf(p.targetAgeGroup) >= 0 ? p.targetAgeGroup : 'ALL';
  const role = ROLES.indexOf(p.authorRole) >= 0 ? p.authorRole : 'OTHER';
  const dept = DEPTS.indexOf(p.authorDept) >= 0 ? p.authorDept : 'ALL';

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(LOCK_MS)) return { ok: false, error: 'ប្រព័ន្ធកំពុងរវល់។ សូមព្យាយាមម្តងទៀត។' };
  try {
    const sh = ss_().getSheetByName(SHEETS.FEEDBACKS);
    const id = newId_('fb');
    sh.appendRow([
      id, new Date(), authorName, role, dept,
      disease, age, section,
      title, content, clean_(p.rationale, LIMITS.RATIONALE),
      'PENDING', 1, '', ''
    ]);
    log_('SUBMIT', authorName, disease + '/' + section + ' — ' + title);
    cache.put(rateKey, String(count + 1), 3600);
    return { ok: true, id: id };
  } finally { lock.releaseLock(); }
}

function apiUpvote(feedbackId, voterToken) {
  const id = clean_(feedbackId, 40);
  const token = clean_(voterToken, 64);
  if (!id || !token) return { ok: false, error: 'ទិន្នន័យមិនគ្រប់គ្រាន់។' };

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(LOCK_MS)) return { ok: false, error: 'ប្រព័ន្ធកំពុងរវល់។ សូមព្យាយាមម្តងទៀត។' };
  try {
    const ss = ss_();
    const votes = rows_(ss, SHEETS.UPVOTES, HEADERS.UPVOTES);
    if (votes.some(v => v.feedbackId === id && v.voterToken === token)) {
      return { ok: false, error: 'លោកអ្នកបានឯកភាពសំណើនេះរួចហើយ។' };
    }
    const sh = ss.getSheetByName(SHEETS.FEEDBACKS);
    const rowIndex = findRow_(sh, HEADERS.FEEDBACKS, 'id', id);
    if (rowIndex < 0) return { ok: false, error: 'រកមិនឃើញសំណើនេះទេ។' };

    const col = HEADERS.FEEDBACKS.indexOf('upvotes') + 1;
    const cell = sh.getRange(rowIndex, col);
    const next = (Number(cell.getValue()) || 0) + 1;
    cell.setValue(next);
    ss.getSheetByName(SHEETS.UPVOTES).appendRow([id, token, new Date()]);
    return { ok: true, upvotes: next };
  } finally { lock.releaseLock(); }
}

/* ============================================================
   ៦. អ្នកគ្រប់គ្រង — ត្រូវការលេខសម្ងាត់
   ============================================================ */
function apiCheckPin(pin) {
  const cache = CacheService.getScriptCache();
  const key = 'pintry';
  const tries = Number(cache.get(key) || 0);
  if (tries >= LIMITS.PIN_TRIES_PER_10MIN) {
    return { ok: false, error: 'ព្យាយាមច្រើនដងពេក។ សូមរង់ចាំ ១០ នាទី។', locked: true };
  }
  const ok = verifyPin_(pin);
  if (!ok) cache.put(key, String(tries + 1), 600);
  else cache.remove(key);
  return { ok: ok };
}

function apiSetStatus(pin, feedbackId, status) {
  const gate = guard_(pin); if (gate) return gate;
  if (STATUSES.indexOf(status) < 0) return { ok: false, error: 'ស្ថានភាពមិនត្រឹមត្រូវ។' };

  return withLock_(() => {
    const sh = ss_().getSheetByName(SHEETS.FEEDBACKS);
    const row = findRow_(sh, HEADERS.FEEDBACKS, 'id', clean_(feedbackId, 40));
    if (row < 0) return { ok: false, error: 'រកមិនឃើញសំណើនេះទេ។' };
    sh.getRange(row, HEADERS.FEEDBACKS.indexOf('status') + 1).setValue(status);
    sh.getRange(row, HEADERS.FEEDBACKS.indexOf('reviewedAt') + 1).setValue(new Date());
    sh.getRange(row, HEADERS.FEEDBACKS.indexOf('reviewedBy') + 1).setValue('admin');
    log_(status === 'MERGED' ? 'MERGE' : 'UNMERGE', 'admin', feedbackId);
    return { ok: true };
  });
}

function apiDeleteFeedback(pin, feedbackId) {
  const gate = guard_(pin); if (gate) return gate;
  return withLock_(() => {
    const sh = ss_().getSheetByName(SHEETS.FEEDBACKS);
    const row = findRow_(sh, HEADERS.FEEDBACKS, 'id', clean_(feedbackId, 40));
    if (row < 0) return { ok: false, error: 'រកមិនឃើញសំណើនេះទេ។' };
    sh.deleteRow(row);
    log_('DELETE_FEEDBACK', 'admin', feedbackId);
    return { ok: true };
  });
}

/* ---------- ចំណុចពិធីការ ---------- */
function apiAddProtocolItem(pin, diseaseKey, pillar, text) {
  const gate = guard_(pin); if (gate) return gate;
  if (PILLARS.indexOf(pillar) < 0) return { ok: false, error: 'ផ្នែកមិនត្រឹមត្រូវ។' };
  if (knownDiseaseKeys_().indexOf(diseaseKey) < 0) return { ok: false, error: 'ជំងឺមិនត្រឹមត្រូវ។' };

  const value = clean_(text, LIMITS.PROTOCOL_TEXT);
  if (!value) return { ok: false, error: 'សូមបំពេញអត្ថបទ។' };

  return withLock_(() => {
    const ss = ss_();
    const existing = rows_(ss, SHEETS.PROTOCOLS, HEADERS.PROTOCOLS)
      .filter(r => r.diseaseKey === diseaseKey && r.pillar === pillar);
    if (existing.length >= LIMITS.MAX_ITEMS_PER_PILLAR) {
      return { ok: false, error: 'ផ្នែកនេះមានចំណុចច្រើនពេកហើយ។' };
    }
    const orders = existing.map(r => Number(r.sortOrder) || 0);
    const next = orders.length ? Math.max.apply(null, orders) + 1 : 1;
    const id = newId_('P');
    ss.getSheetByName(SHEETS.PROTOCOLS).appendRow([id, diseaseKey, pillar, value, next]);
    log_('ADD_ITEM', 'admin', diseaseKey + '/' + pillar);
    return { ok: true, id: id };
  });
}

function apiUpdateProtocolItem(pin, itemId, text) {
  const gate = guard_(pin); if (gate) return gate;
  const value = clean_(text, LIMITS.PROTOCOL_TEXT);
  if (!value) return { ok: false, error: 'សូមបំពេញអត្ថបទ។' };

  return withLock_(() => {
    const sh = ss_().getSheetByName(SHEETS.PROTOCOLS);
    const row = findRow_(sh, HEADERS.PROTOCOLS, 'id', clean_(itemId, 40));
    if (row < 0) return { ok: false, error: 'រកមិនឃើញចំណុចនេះទេ។' };
    const col = HEADERS.PROTOCOLS.indexOf('text') + 1;
    const before = String(sh.getRange(row, col).getValue());
    sh.getRange(row, col).setValue(value);
    log_('EDIT_ITEM', 'admin', before.slice(0, 60) + ' → ' + value.slice(0, 60));
    return { ok: true };
  });
}

function apiDeleteProtocolItem(pin, itemId) {
  const gate = guard_(pin); if (gate) return gate;
  return withLock_(() => {
    const sh = ss_().getSheetByName(SHEETS.PROTOCOLS);
    const row = findRow_(sh, HEADERS.PROTOCOLS, 'id', clean_(itemId, 40));
    if (row < 0) return { ok: false, error: 'រកមិនឃើញចំណុចនេះទេ។' };
    log_('DELETE_ITEM', 'admin', String(sh.getRange(row, 4).getValue()).slice(0, 80));
    sh.deleteRow(row);
    return { ok: true };
  });
}

/** ផ្លាស់ទីឡើង/ចុះក្នុងសសរស្តម្ភតែមួយ — direction: 'up' | 'down' */
function apiMoveProtocolItem(pin, itemId, direction) {
  const gate = guard_(pin); if (gate) return gate;
  const dir = direction === 'up' ? -1 : direction === 'down' ? 1 : 0;
  if (!dir) return { ok: false, error: 'ទិសដៅមិនត្រឹមត្រូវ។' };
  const id = clean_(itemId, 40);

  return withLock_(() => {
    const ss = ss_();
    const sh = ss.getSheetByName(SHEETS.PROTOCOLS);
    const all = rows_(ss, SHEETS.PROTOCOLS, HEADERS.PROTOCOLS);
    const me  = all.filter(r => String(r.id) === id)[0];
    if (!me) return { ok: false, error: 'រកមិនឃើញចំណុចនេះទេ។' };

    const group = all
      .filter(r => r.diseaseKey === me.diseaseKey && r.pillar === me.pillar)
      .sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0));

    const idx = group.findIndex(r => String(r.id) === id);
    const to  = idx + dir;
    if (idx < 0 || to < 0 || to >= group.length) return { ok: false, error: 'ដល់ចុងបញ្ជីហើយ។' };

    const other = group[to];
    const col = HEADERS.PROTOCOLS.indexOf('sortOrder') + 1;
    const rowMe    = findRow_(sh, HEADERS.PROTOCOLS, 'id', me.id);
    const rowOther = findRow_(sh, HEADERS.PROTOCOLS, 'id', other.id);
    if (rowMe < 0 || rowOther < 0) return { ok: false, error: 'រកមិនឃើញជួរទេ។' };

    /* សរសេរលេខរៀបចំឡើងវិញទាំងក្រុម ដើម្បីកុំឱ្យលេខស្ទួន */
    const swapped = group.slice();
    swapped[idx] = other; swapped[to] = me;
    swapped.forEach((r, i) => {
      const rw = findRow_(sh, HEADERS.PROTOCOLS, 'id', r.id);
      if (rw > 0) sh.getRange(rw, col).setValue(i + 1);
    });
    log_('MOVE_ITEM', 'admin', me.diseaseKey + '/' + me.pillar + ' ' + direction);
    return { ok: true };
  });
}

function apiResetDisease(pin, diseaseKey) {
  const gate = guard_(pin); if (gate) return gate;
  const seed = SEED_PROTOCOLS[diseaseKey];
  if (!seed) return { ok: false, error: 'គ្មានទិន្នន័យស្រាវជ្រាវដើមសម្រាប់ជំងឺនេះទេ។' };

  return withLock_(() => {
    const sh = ss_().getSheetByName(SHEETS.PROTOCOLS);
    const values = sh.getDataRange().getValues();
    for (let i = values.length - 1; i >= 1; i--) {
      if (values[i][1] === diseaseKey) sh.deleteRow(i + 1);
    }
    const rows = [];
    PILLARS.forEach(pillar => {
      (seed[pillar] || []).forEach((text, i) => rows.push([newId_('P'), diseaseKey, pillar, text, i + 1]));
    });
    if (rows.length) {
      sh.getRange(sh.getLastRow() + 1, 1, rows.length, HEADERS.PROTOCOLS.length).setValues(rows);
    }
    log_('RESET_DISEASE', 'admin', diseaseKey);
    return { ok: true, restored: rows.length };
  });
}

/* ---------- ជំងឺ ---------- */
function apiAddDisease(pin, key, title, subtitle) {
  const gate = guard_(pin); if (gate) return gate;
  const k = String(key || '').toUpperCase().replace(/[^A-Z0-9_]/g, '').slice(0, LIMITS.DISEASE_KEY);
  if (!k) return { ok: false, error: 'កូដជំងឺត្រូវមានតែអក្សរឡាតាំង លេខ និង _ ។' };
  const t = clean_(title, LIMITS.TITLE);
  if (!t) return { ok: false, error: 'សូមបំពេញចំណងជើងជំងឺ។' };

  return withLock_(() => {
    const ss = ss_();
    const all = rows_(ss, SHEETS.DISEASES, HEADERS.DISEASES);
    if (all.length >= LIMITS.MAX_DISEASES) return { ok: false, error: 'ចំនួនជំងឺពេញកម្រិតហើយ។' };
    if (all.some(d => String(d.key) === k)) return { ok: false, error: 'កូដជំងឺនេះមានរួចហើយ។' };
    const orders = all.map(d => Number(d.sortOrder) || 0);
    const next = orders.length ? Math.max.apply(null, orders) + 1 : 1;
    ss.getSheetByName(SHEETS.DISEASES)
      .appendRow([k, t, clean_(subtitle, LIMITS.TITLE), next]);
    log_('ADD_DISEASE', 'admin', k + ' — ' + t);
    return { ok: true, key: k };
  });
}

function apiUpdateDisease(pin, key, title, subtitle) {
  const gate = guard_(pin); if (gate) return gate;
  const t = clean_(title, LIMITS.TITLE);
  if (!t) return { ok: false, error: 'សូមបំពេញចំណងជើងជំងឺ។' };

  return withLock_(() => {
    const sh = ss_().getSheetByName(SHEETS.DISEASES);
    const row = findRow_(sh, HEADERS.DISEASES, 'key', String(key || ''));
    if (row < 0) return { ok: false, error: 'រកមិនឃើញជំងឺនេះទេ។' };
    sh.getRange(row, HEADERS.DISEASES.indexOf('titleKh') + 1).setValue(t);
    sh.getRange(row, HEADERS.DISEASES.indexOf('subtitleKh') + 1)
      .setValue(clean_(subtitle, LIMITS.TITLE));
    log_('EDIT_DISEASE', 'admin', key + ' → ' + t);
    return { ok: true };
  });
}

function apiDeleteDisease(pin, key) {
  const gate = guard_(pin); if (gate) return gate;
  const k = String(key || '');

  return withLock_(() => {
    const ss = ss_();
    const dz = ss.getSheetByName(SHEETS.DISEASES);
    const all = rows_(ss, SHEETS.DISEASES, HEADERS.DISEASES);
    if (all.length <= 1) return { ok: false, error: 'ត្រូវរក្សាទុកជំងឺយ៉ាងតិចមួយ។' };

    const row = findRow_(dz, HEADERS.DISEASES, 'key', k);
    if (row < 0) return { ok: false, error: 'រកមិនឃើញជំងឺនេះទេ។' };

    /* លុបចំណុចពិធីការ និងឯកសារភ្ជាប់ដែលពាក់ព័ន្ធ */
    const pz = ss.getSheetByName(SHEETS.PROTOCOLS);
    const pv = pz.getDataRange().getValues();
    const goneIds = {};
    for (let i = pv.length - 1; i >= 1; i--) {
      if (pv[i][1] === k) { goneIds[String(pv[i][0])] = true; pz.deleteRow(i + 1); }
    }
    const mz = ss.getSheetByName(SHEETS.MEDIA);
    if (mz) {
      const mv = mz.getDataRange().getValues();
      for (let i = mv.length - 1; i >= 1; i--) {
        if (goneIds[String(mv[i][1])]) mz.deleteRow(i + 1);
      }
    }
    dz.deleteRow(row);
    log_('DELETE_DISEASE', 'admin', k + ' (' + Object.keys(goneIds).length + ' items)');
    return { ok: true, removedItems: Object.keys(goneIds).length };
  });
}

function apiMoveDisease(pin, key, direction) {
  const gate = guard_(pin); if (gate) return gate;
  const dir = direction === 'up' ? -1 : direction === 'down' ? 1 : 0;
  if (!dir) return { ok: false, error: 'ទិសដៅមិនត្រឹមត្រូវ។' };

  return withLock_(() => {
    const ss = ss_();
    const sh = ss.getSheetByName(SHEETS.DISEASES);
    const list = rows_(ss, SHEETS.DISEASES, HEADERS.DISEASES)
      .sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0));
    const idx = list.findIndex(d => String(d.key) === String(key));
    const to = idx + dir;
    if (idx < 0 || to < 0 || to >= list.length) return { ok: false, error: 'ដល់ចុងបញ្ជីហើយ។' };

    const swapped = list.slice();
    const tmp = swapped[idx]; swapped[idx] = swapped[to]; swapped[to] = tmp;
    const col = HEADERS.DISEASES.indexOf('sortOrder') + 1;
    swapped.forEach((d, i) => {
      const rw = findRow_(sh, HEADERS.DISEASES, 'key', d.key);
      if (rw > 0) sh.getRange(rw, col).setValue(i + 1);
    });
    log_('MOVE_DISEASE', 'admin', key + ' ' + direction);
    return { ok: true };
  });
}

/* ---------- ការកំណត់ និងអត្ថបទព្រីន ---------- */
function apiSaveSettings(pin, settings)   { return saveKeyValue_(pin, settings,  SHEETS.SETTINGS,  DEFAULT_SETTINGS,  'SETTINGS'); }
function apiSavePrintText(pin, printText) { return saveKeyValue_(pin, printText, SHEETS.PRINTTEXT, DEFAULT_PRINTTEXT, 'PRINTTEXT'); }

function saveKeyValue_(pin, incoming, sheetName, defaults, headerKey) {
  const gate = guard_(pin); if (gate) return gate;
  const data = incoming || {};
  const keys = Object.keys(data).filter(k => Object.prototype.hasOwnProperty.call(defaults, k));
  if (!keys.length) return { ok: false, error: 'គ្មានតម្លៃត្រឹមត្រូវដើម្បីរក្សាទុក។' };

  return withLock_(() => {
    const ss = ss_();
    const sh = ensureSheet_(ss, sheetName, HEADERS[headerKey]);
    keys.forEach(k => {
      let v = String(data[k] == null ? '' : data[k]).trim().slice(0, LIMITS.SETTING_VALUE);
      if (/^(primary|primary2|accent)$/.test(k) && !/^#[0-9a-fA-F]{6}$/.test(v)) v = defaults[k];
      if (!v) v = defaults[k];
      const row = findRow_(sh, HEADERS[headerKey], 'key', k);
      if (row > 0) sh.getRange(row, 2).setValue(v);
      else sh.appendRow([k, v]);
    });
    log_('SAVE_' + headerKey, 'admin', keys.join(','));
    return { ok: true, saved: keys.length };
  });
}

/* ============================================================
   ៧. ឯកសារភ្ជាប់ (រូបភាព / វីដេអូ / PDF / YouTube)
   ============================================================ */
function mediaFolder_() {
  const props = PropertiesService.getScriptProperties();
  const saved = props.getProperty(MEDIA_FOLDER_PROP);
  if (saved) {
    try { return DriveApp.getFolderById(saved); } catch (e) { /* recreate below */ }
  }
  const name = CLINIC_FOLDER_NAME;
  let folder = null;
  try {
    const file = DriveApp.getFileById(ss_().getId());
    const parents = file.getParents();
    const parent = parents.hasNext() ? parents.next() : DriveApp.getRootFolder();
    const existing = parent.getFoldersByName(name);
    folder = existing.hasNext() ? existing.next() : parent.createFolder(name);
  } catch (e) {
    const existing = DriveApp.getFoldersByName(name);
    folder = existing.hasNext() ? existing.next() : DriveApp.createFolder(name);
  }
  props.setProperty(MEDIA_FOLDER_PROP, folder.getId());
  return folder;
}

function knownItemIds_() {
  return rows_(ss_(), SHEETS.PROTOCOLS, HEADERS.PROTOCOLS).map(r => String(r.id));
}

function mediaCount_(itemId) {
  return rows_(ss_(), SHEETS.MEDIA, HEADERS.MEDIA)
    .filter(r => String(r.itemId) === String(itemId)).length;
}

/** Upload a file (data URL) and attach it to one SOP item. */
function apiAddMediaFile(pin, itemId, dataUrl, name, caption) {
  const gate = guard_(pin); if (gate) return gate;

  const id = clean_(itemId, 40);
  if (knownItemIds_().indexOf(id) < 0) return { ok: false, error: 'រកមិនឃើញចំណុច SOP នេះទេ។' };
  if (mediaCount_(id) >= LIMITS.MEDIA_PER_ITEM) {
    return { ok: false, error: 'ចំណុចនេះមានឯកសារភ្ជាប់គ្រប់ចំនួនហើយ (' + LIMITS.MEDIA_PER_ITEM + ')។' };
  }

  const m = /^data:([^;,]+);base64,(.+)$/.exec(String(dataUrl || ''));
  if (!m) return { ok: false, error: 'ទម្រង់ឯកសារមិនត្រឹមត្រូវ។' };

  const mime = m[1];
  const kind = mime.indexOf('image/') === 0 ? 'image'
             : mime.indexOf('video/') === 0 ? 'video'
             : mime === 'application/pdf' ? 'pdf' : null;
  if (!kind) return { ok: false, error: 'គាំទ្រតែរូបភាព វីដេអូ និង PDF ប៉ុណ្ណោះ។' };

  let bytes;
  try { bytes = Utilities.base64Decode(m[2]); }
  catch (e) { return { ok: false, error: 'អានឯកសារមិនបាន។' }; }
  if (bytes.length > LIMITS.MEDIA_BYTES) {
    return { ok: false, error: 'ឯកសារធំពេក (អតិបរមា ' + Math.round(LIMITS.MEDIA_BYTES / 1048576) + ' MB)។' };
  }

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(LOCK_MS)) return { ok: false, error: 'ប្រព័ន្ធកំពុងរវល់។' };
  try {
    const safeName = clean_(name, 120) || (kind + '-' + Date.now());
    const blob = Utilities.newBlob(bytes, mime, safeName);
    const file = mediaFolder_().createFile(blob);
    try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) {}

    const mediaId = newId_('M');
    ss_().getSheetByName(SHEETS.MEDIA).appendRow([
      mediaId, id, kind, file.getId(), '', safeName, clean_(caption, LIMITS.CAPTION), new Date()
    ]);
    log_('ADD_MEDIA', 'admin', kind + ' → ' + id);
    return { ok: true, media: { id: mediaId, kind: kind, fileId: file.getId(), url: '', name: safeName, caption: clean_(caption, LIMITS.CAPTION) } };
  } finally {
    lock.releaseLock();
  }
}

/** Attach a link (YouTube, or any image/video/PDF URL) to one SOP item. */
function apiAddMediaUrl(pin, itemId, url, caption) {
  const gate = guard_(pin); if (gate) return gate;

  const id = clean_(itemId, 40);
  if (knownItemIds_().indexOf(id) < 0) return { ok: false, error: 'រកមិនឃើញចំណុច SOP នេះទេ។' };
  if (mediaCount_(id) >= LIMITS.MEDIA_PER_ITEM) {
    return { ok: false, error: 'ចំណុចនេះមានឯកសារភ្ជាប់គ្រប់ចំនួនហើយ។' };
  }

  const raw = clean_(url, 600);
  if (!/^https:\/\//i.test(raw)) return { ok: false, error: 'សូមប្រើតំណ https:// ប៉ុណ្ណោះ។' };

  const yt = /(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/)([A-Za-z0-9_-]{11})/.exec(raw);
  let kind, stored;
  if (yt) { kind = 'youtube'; stored = yt[1]; }
  else if (/\.pdf($|\?)/i.test(raw)) { kind = 'pdf'; stored = raw; }
  else if (/\.(mp4|webm|ogg|mov|m4v)($|\?)/i.test(raw)) { kind = 'video'; stored = raw; }
  else { kind = 'image'; stored = raw; }

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(LOCK_MS)) return { ok: false, error: 'ប្រព័ន្ធកំពុងរវល់។' };
  try {
    const mediaId = newId_('M');
    ss_().getSheetByName(SHEETS.MEDIA).appendRow([
      mediaId, id, kind, '', stored, '', clean_(caption, LIMITS.CAPTION), new Date()
    ]);
    log_('ADD_MEDIA_URL', 'admin', kind + ' → ' + id);
    return { ok: true, media: { id: mediaId, kind: kind, fileId: '', url: stored, name: '', caption: clean_(caption, LIMITS.CAPTION) } };
  } finally {
    lock.releaseLock();
  }
}

function apiDeleteMedia(pin, mediaId) {
  const gate = guard_(pin); if (gate) return gate;
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(LOCK_MS)) return { ok: false, error: 'ប្រព័ន្ធកំពុងរវល់។' };
  try {
    const sh = ss_().getSheetByName(SHEETS.MEDIA);
    const row = findRow_(sh, HEADERS.MEDIA, 'id', clean_(mediaId, 40));
    if (row < 0) return { ok: false, error: 'រកមិនឃើញឯកសារនេះទេ។' };
    const fileId = String(sh.getRange(row, HEADERS.MEDIA.indexOf('fileId') + 1).getValue() || '');
    if (fileId) { try { DriveApp.getFileById(fileId).setTrashed(true); } catch (e) {} }
    sh.deleteRow(row);
    log_('DELETE_MEDIA', 'admin', mediaId);
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

/* ============================================================
   ៨. HELPERS
   ============================================================ */
/** ត្រួតពិនិត្យលេខសម្ងាត់ — ត្រឡប់ object កំហុស បើមិនត្រឹមត្រូវ */
function guard_(pin) {
  return verifyPin_(pin) ? null : { ok: false, error: 'លេខសម្ងាត់មិនត្រឹមត្រូវ។' };
}

/** រត់មុខងារក្នុងសោ ដើម្បីកុំឱ្យសរសេរជាន់គ្នា */
function withLock_(fn) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(LOCK_MS)) return { ok: false, error: 'ប្រព័ន្ធកំពុងរវល់។ សូមព្យាយាមម្តងទៀត។' };
  try { return fn(); } finally { lock.releaseLock(); }
}

function ss_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('រកមិនឃើញ Google Sheet ទេ។');
  return ss;
}

function rows_(ss, name, headers) {
  const sh = ss.getSheetByName(name);
  if (!sh || sh.getLastRow() < 2) return [];
  const values = sh.getRange(2, 1, sh.getLastRow() - 1, headers.length).getValues();
  return values
    .filter(r => String(r[0]).trim() !== '')
    .map(r => {
      const o = {};
      headers.forEach((h, i) => { o[h] = r[i]; });
      return o;
    });
}

function findRow_(sh, headers, column, value) {
  const col = headers.indexOf(column) + 1;
  if (col < 1 || sh.getLastRow() < 2) return -1;
  const values = sh.getRange(2, col, sh.getLastRow() - 1, 1).getValues();
  for (let i = 0; i < values.length; i++) {
    if (String(values[i][0]) === String(value)) return i + 2;
  }
  return -1;
}

function knownDiseaseKeys_() {
  return rows_(ss_(), SHEETS.DISEASES, HEADERS.DISEASES).map(d => String(d.key));
}

function verifyPin_(pin) {
  const stored = PropertiesService.getScriptProperties().getProperty(PIN_PROP);
  if (!stored) return false;
  const given = String(pin == null ? '' : pin);
  if (given.length !== stored.length) return false;
  let diff = 0;
  for (let i = 0; i < stored.length; i++) diff |= given.charCodeAt(i) ^ stored.charCodeAt(i);
  return diff === 0;
}

function clean_(value, max) {
  return String(value == null ? '' : value).replace(/\s+/g, ' ').trim().slice(0, max || 200);
}

function newId_(prefix) {
  return prefix + '-' + Date.now().toString(36) + '-' +
         Math.random().toString(36).slice(2, 8);
}

function formatDate_(d) {
  return Utilities.formatDate(new Date(d), 'Asia/Phnom_Penh', 'dd/MM/yyyy HH:mm');
}

function log_(action, actor, detail) {
  try {
    ss_().getSheetByName(SHEETS.LOG)
      .appendRow([new Date(), action, String(actor).slice(0, 80), String(detail).slice(0, 300)]);
  } catch (e) { /* logging must never break a write */ }
}
