/* ការត្រាប់តាមសេវា Apps Script សម្រាប់តេស្តក្នុងម៉ាស៊ីនមូលដ្ឋាន */
class Range {
  constructor(sheet, r, c, nr, nc) { Object.assign(this, { sheet, r, c, nr, nc }); }
  getValues() {
    const out = [];
    for (let i = 0; i < this.nr; i++) {
      const row = [];
      for (let j = 0; j < this.nc; j++) row.push(this.sheet._d[this.r - 1 + i]?.[this.c - 1 + j] ?? '');
      out.push(row);
    }
    return out;
  }
  setValues(v) {
    v.forEach((row, i) => row.forEach((val, j) => {
      const R = this.r - 1 + i, C = this.c - 1 + j;
      while (this.sheet._d.length <= R) this.sheet._d.push([]);
      this.sheet._d[R][C] = val;
    }));
    return this;
  }
  getValue() { return this.getValues()[0][0]; }
  setValue(v) { return this.setValues([[v]]); }
  setFontWeight() { return this; }
  setBackground() { return this; }
}
class Sheet {
  constructor(name) { this.name = name; this._d = []; }
  getName() { return this.name; }
  getLastRow() {
    for (let i = this._d.length - 1; i >= 0; i--)
      if (this._d[i]?.some(x => x !== '' && x != null)) return i + 1;
    return 0;
  }
  getRange(r, c, nr = 1, nc = 1) { return new Range(this, r, c, nr, nc); }
  getDataRange() {
    const lr = this.getLastRow();
    const w = Math.max(1, ...this._d.map(r => (r ? r.length : 0)));
    return new Range(this, 1, 1, Math.max(lr, 1), w);
  }
  appendRow(v) { this._d[this.getLastRow()] = v.slice(); return this; }
  deleteRow(r) { this._d.splice(r - 1, 1); return this; }
  setFrozenRows() { return this; }
}
class Spreadsheet {
  constructor() { this.sheets = {}; }
  getId() { return 'mock-sheet-id'; }
  getSheetByName(n) { return this.sheets[n] || null; }
  insertSheet(n) { return (this.sheets[n] = new Sheet(n)); }
}

export function makeEnv() {
  const SS = new Spreadsheet();
  const props = {}, cache = {};
  let lockHeld = false;
  const driveFiles = {};
  const mkFile = b => {
    const id = 'file-' + (Object.keys(driveFiles).length + 1);
    driveFiles[id] = b;
    return { getId: () => id, setSharing: () => {}, setTrashed: () => {} };
  };
  const mkFolder = n => ({ getId: () => 'folder-' + n.length, createFile: b => mkFile(b) });

  const out = v => ({
    _v: v,
    setMimeType() { return this; },
    getContent() { return this._v; }
  });

  return {
    SS, props, cache, driveFiles,
    globals: {
      SpreadsheetApp: { getActiveSpreadsheet: () => SS, getUi: () => { throw new Error('no ui'); } },
      PropertiesService: {
        getScriptProperties: () => ({
          getProperty: k => (k in props ? props[k] : null),
          setProperty: (k, v) => { props[k] = v; }
        })
      },
      CacheService: {
        getScriptCache: () => ({
          get: k => (k in cache ? cache[k] : null),
          put: (k, v) => { cache[k] = v; },
          remove: k => { delete cache[k]; }
        })
      },
      LockService: {
        getScriptLock: () => ({
          tryLock: () => { if (lockHeld) return false; lockHeld = true; return true; },
          releaseLock: () => { lockHeld = false; }
        })
      },
      Utilities: {
        formatDate: d => {
          const x = new Date(d), p = n => String(n).padStart(2, '0');
          return `${p(x.getDate())}/${p(x.getMonth() + 1)}/${x.getFullYear()} ${p(x.getHours())}:${p(x.getMinutes())}`;
        },
        base64Decode: s => Buffer.from(s, 'base64'),
        newBlob: (bytes, mime, name) => ({ bytes, mime, name })
      },
      DriveApp: {
        Access: { ANYONE_WITH_LINK: 'anyone' }, Permission: { VIEW: 'view' },
        getFolderById: id => ({ getId: () => id, createFile: b => mkFile(b) }),
        getFileById: id => ({ getParents: () => ({ hasNext: () => false }), setTrashed: () => {}, getId: () => id }),
        getRootFolder: () => ({ getFoldersByName: () => ({ hasNext: () => false }), createFolder: mkFolder }),
        getFoldersByName: () => ({ hasNext: () => false }),
        createFolder: mkFolder
      },
      Logger: { log: () => {} },
      ContentService: {
        MimeType: { JSON: 'application/json', JAVASCRIPT: 'text/javascript' },
        createTextOutput: v => out(v)
      },
      HtmlService: {
        createHtmlOutput: v => ({ _v: v, setXFrameOptionsMode() { return this; }, getContent() { return this._v; } }),
        createTemplateFromFile: () => ({ evaluate: () => ({ setTitle() { return this; }, addMetaTag() { return this; }, setXFrameOptionsMode() { return this; } }) }),
        createHtmlOutputFromFile: () => ({ getContent: () => '' }),
        XFrameOptionsMode: { ALLOWALL: 'allowall' }
      }
    }
  };
}
