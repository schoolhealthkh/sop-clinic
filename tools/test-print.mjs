/* រាប់ចំនួនទំព័រ A4 ដែលចេញពីទម្រង់ព្រីន */
import { chromium } from '/home/claude/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import { execSync } from 'node:child_process';

const SITE = 'http://127.0.0.1:8080/';
const TW   = '/tmp/tw.css';

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const p = await b.newPage();
await p.addInitScript(() => {
  const C = function () { return { destroy() {}, update() {}, resize() {} }; };
  C.defaults = { font: { family: '', size: 12 }, color: '' };
  C.register = () => {};
  window.Chart = C;
});
await p.goto(SITE, { waitUntil: 'domcontentloaded' });
await p.waitForFunction(() => typeof currentProtocols !== 'undefined' && Object.keys(currentProtocols).length > 0, null, { timeout: 20000 });
await p.addStyleTag({ content: fs.readFileSync(TW, 'utf8') });
await p.waitForTimeout(400);

let pass = 0, fail = 0;
const ok = (n, c, x='') => { c ? (pass++, console.log('  ✓ ' + n)) : (fail++, console.log('  ✗ ' + n + (x ? '  → ' + x : ''))); };

async function pages(kind, scope, file) {
  await p.evaluate(a => {
    const sel = document.querySelector('#printScope');
    sel.value = a.scope;
    onPrintScopeChange();
    document.querySelector('#printContentBody').innerHTML = buildPrintDocuments(a.kind).html;
  }, { kind, scope });
  await p.waitForTimeout(400);
  await p.pdf({ path: file, format: 'A4', printBackground: true,
                margin: { top: '8mm', right: '8mm', bottom: '8mm', left: '8mm' } });
  return Number(execSync(`python3 -c "import pypdf;print(len(pypdf.PdfReader('${file}').pages))"`).toString().trim());
}

console.log('\n— \u1785\u17c6\u1793\u17bb\u1793\u1791\u17c6\u1796\u17d0\u179a\u1796\u17d2\u179a\u17b8\u1793 —');
const cg  = await pages('caregiver', 'DENGUE',  '/tmp/t_cg.pdf');
const st  = await pages('staff',     'DENGUE',  '/tmp/t_st.pdf');
const all = await pages('both',      '__ALL__', '/tmp/t_all.pdf');
console.log(`  \u1794\u178e\u17d2\u178e\u1790\u17c2\u1791\u17b6\u17c6 (DENGUE) : ${cg} \u1791\u17c6\u1796\u17d0\u179a`);
console.log(`  SOP \u1794\u17bb\u1782\u17d2\u1782\u179b\u17b7\u1780 (DENGUE) : ${st} \u1791\u17c6\u1796\u17d0\u179a`);
console.log(`  \u1791\u17b6\u17c6\u1784\u17a2\u179f\u17cb (6 \u1787\u17c6\u1784\u17ba \u00d7 2)    : ${all} \u1791\u17c6\u1796\u17d0\u179a`);
ok('\u1794\u178e\u17d2\u178e\u1790\u17c2\u1791\u17b6\u17c6 = 1 \u1791\u17c6\u1796\u17d0\u179a', cg === 1, String(cg));
ok('SOP \u1794\u17bb\u1782\u17d2\u1782\u179b\u17b7\u1780 \u2264 3 \u1791\u17c6\u1796\u17d0\u179a', st <= 3, String(st));
ok('\u1791\u17b6\u17c6\u1784\u17a2\u179f\u17cb \u2264 24 \u1791\u17c6\u1796\u17d0\u179a', all <= 24, String(all));

const html = await p.evaluate(() => getStaffFlowsheetHTML(true, 'DENGUE'));
const flags = await p.evaluate(() => currentProtocols.DENGUE.redFlags.map(x => x.text));
ok('\u179f\u1789\u17d2\u1789\u17b6\u1782\u17d2\u179a\u17c4\u17c7\u1790\u17d2\u1793\u17b6\u1780\u17cb\u1785\u17c1\u1789\u1782\u17d2\u179a\u1794\u17cb ' + flags.length,
   flags.every(t => html.includes(t.slice(0, 30).replace(/&/g,'&amp;').replace(/</g,'&lt;'))));

await b.close();
console.log(`\n══ ${pass} ជាប់ · ${fail} ធ្លាក់ ══`);
