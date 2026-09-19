/* ============================================================
   អតិថិជន API — និយាយជាមួយ Google Apps Script Web App
   ------------------------------------------------------------
   Apps Script មិនអាចដាក់ CORS header ដោយខ្លួនឯង ហើយក៏មិនឆ្លើយតប
   OPTIONS ដែរ។ ដូច្នេះត្រូវប្រើតែសំណើសាមញ្ញ (simple request)៖
     · អាន   → GET  ធម្មតា (គ្មាន header បន្ថែម)
     · សរសេរ → POST ដោយមិនកំណត់ header ឡើយ ដើម្បីឱ្យកម្មវិធីរុករក
               ដាក់ Content-Type: text/plain ដោយស្វ័យប្រវត្តិ
   បើ GET ជាប់ CORS ប្រព័ន្ធនឹងប្តូរទៅ JSONP ដោយស្វ័យប្រវត្តិ។
   ============================================================ */
(function (global) {
  'use strict';

  const cfg = () => global.SOP_CONFIG || {};
  const base = () => String(cfg().apiUrl || '').trim();

  function assertConfigured() {
    const u = base();
    if (!u || u.indexOf('PASTE_YOUR') === 0) {
      throw new Error('មិនទាន់កំណត់តំណ API ក្នុង assets/config.js ទេ។');
    }
    return u;
  }

  /* ---------- JSONP (ផ្លូវបម្រុងសម្រាប់ការអាន) ---------- */
  let jsonpSeq = 0;
  function jsonp(params, timeoutMs) {
    return new Promise((resolve, reject) => {
      const name = '__sopcb' + (++jsonpSeq) + '_' + Date.now().toString(36);
      const url = assertConfigured() + '?' + params + '&callback=' + name;
      const s = document.createElement('script');
      let done = false;
      const cleanup = () => {
        if (done) return; done = true;
        try { delete global[name]; } catch (e) { global[name] = undefined; }
        if (s.parentNode) s.parentNode.removeChild(s);
        clearTimeout(timer);
      };
      const timer = setTimeout(() => { cleanup(); reject(new Error('អស់ពេលរង់ចាំ')); },
                               timeoutMs || 20000);
      global[name] = data => { cleanup(); resolve(data); };
      s.onerror = () => { cleanup(); reject(new Error('ភ្ជាប់មិនបាន')); };
      s.src = url;
      document.head.appendChild(s);
    });
  }

  /* ---------- អាន ---------- */
  async function get(action, params) {
    const qs = new URLSearchParams(Object.assign({ action: action }, params || {})).toString();
    try {
      const res = await fetch(assertConfigured() + '?' + qs, {
        method: 'GET', redirect: 'follow', credentials: 'omit'
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.json();
    } catch (err) {
      /* CORS ឬបណ្តាញមានបញ្ហា → សាកល្បង JSONP */
      return jsonp(qs);
    }
  }

  /* ---------- សរសេរ ---------- */
  async function post(action, body) {
    const payload = Object.assign({ action: action }, body || {});
    /* កុំដាក់ header ឡើយ — បើដាក់ Content-Type: application/json
       កម្មវិធីរុករកនឹងផ្ញើ OPTIONS preflight ហើយ Apps Script នឹងបដិសេធ */
    const res = await fetch(assertConfigured(), {
      method: 'POST',
      redirect: 'follow',
      credentials: 'omit',
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  }

  /* ---------- ស្រទាប់ភ្ជាប់ជាមួយកូដចាស់ ----------
     រក្សាទម្រង់ call('apiXxx', arg1, arg2, …) ដដែល ដើម្បីកុំឱ្យ
     ត្រូវកែកូដ render/actions ទាំងអស់។                        */
  const LEGACY = {
    apiBootstrap:         { kind: 'get',  action: 'bootstrap',          args: [] },
    apiSubmitFeedback:    { kind: 'post', action: 'submitFeedback',     args: ['payload'] },
    apiUpvote:            { kind: 'post', action: 'upvote',             args: ['feedbackId', 'voterToken'] },
    apiCheckPin:          { kind: 'post', action: 'checkPin',           args: ['pin'] },
    apiSetStatus:         { kind: 'post', action: 'setStatus',          args: ['pin', 'feedbackId', 'status'] },
    apiDeleteFeedback:    { kind: 'post', action: 'deleteFeedback',     args: ['pin', 'feedbackId'] },
    apiAddProtocolItem:   { kind: 'post', action: 'addProtocolItem',    args: ['pin', 'diseaseKey', 'pillar', 'text'] },
    apiUpdateProtocolItem:{ kind: 'post', action: 'updateProtocolItem', args: ['pin', 'itemId', 'text'] },
    apiDeleteProtocolItem:{ kind: 'post', action: 'deleteProtocolItem', args: ['pin', 'itemId'] },
    apiMoveProtocolItem:  { kind: 'post', action: 'moveProtocolItem',   args: ['pin', 'itemId', 'direction'] },
    apiResetDisease:      { kind: 'post', action: 'resetDisease',       args: ['pin', 'diseaseKey'] },
    apiAddDisease:        { kind: 'post', action: 'addDisease',         args: ['pin', 'key', 'title', 'subtitle'] },
    apiUpdateDisease:     { kind: 'post', action: 'updateDisease',      args: ['pin', 'key', 'title', 'subtitle'] },
    apiDeleteDisease:     { kind: 'post', action: 'deleteDisease',      args: ['pin', 'key'] },
    apiMoveDisease:       { kind: 'post', action: 'moveDisease',        args: ['pin', 'key', 'direction'] },
    apiSaveSettings:      { kind: 'post', action: 'saveSettings',       args: ['pin', 'settings'] },
    apiSavePrintText:     { kind: 'post', action: 'savePrintText',      args: ['pin', 'printText'] },
    apiAddMediaFile:      { kind: 'post', action: 'addMediaFile',       args: ['pin', 'itemId', 'dataUrl', 'name', 'caption'] },
    apiAddMediaUrl:       { kind: 'post', action: 'addMediaUrl',        args: ['pin', 'itemId', 'url', 'caption'] },
    apiDeleteMedia:       { kind: 'post', action: 'deleteMedia',        args: ['pin', 'mediaId'] }
  };

  function call(fnName) {
    const spec = LEGACY[fnName];
    if (!spec) return Promise.reject(new Error('មុខងារមិនស្គាល់៖ ' + fnName));
    const given = Array.prototype.slice.call(arguments, 1);
    const body = {};
    spec.args.forEach((name, i) => { body[name] = given[i]; });
    return spec.kind === 'get' ? get(spec.action, body) : post(spec.action, body);
  }

  global.API = { get: get, post: post, jsonp: jsonp, isConfigured: () => {
    const u = base(); return !!u && u.indexOf('PASTE_YOUR') !== 0;
  } };
  global.call = call;
})(window);
