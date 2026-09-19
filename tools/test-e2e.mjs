/* តេស្តពីដើមដល់ចប់ — គេហទំព័រ (8080) ហៅ API ឆ្លង origin (8081) */
import { chromium } from '/home/claude/node_modules/playwright/index.mjs';

const SITE = 'http://127.0.0.1:8080/';
const PIN  = process.env.PIN;
if (!PIN) { console.error('set PIN='); process.exit(1); }

let pass = 0, fail = 0;
const ok  = (n, c, extra='') => { c ? (pass++, console.log('  ✓ ' + n)) : (fail++, console.log('  ✗ ' + n + (extra?'  → '+extra:''))); };
const eq  = (n, a, b) => ok(n, a === b, `got ${JSON.stringify(a)} want ${JSON.stringify(b)}`);

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
const p = await ctx.newPage();

/* CDN ខាងក្រៅត្រូវបានទប់ក្នុងបរិយាកាសតេស្ត — ដាក់ស្តាប់ជំនួស */
const CDN_NOISE = /ERR_TUNNEL|Failed to load resource|cdn\.|fonts\.google/i;
const errors = [];
p.on('console', m => { if (m.type() === 'error' && !CDN_NOISE.test(m.text())) errors.push(m.text()); });
p.on('pageerror', e => { if (!CDN_NOISE.test(String(e))) errors.push(String(e)); });
await p.addInitScript(() => {
  const C = function () { return { destroy() {}, update() {}, resize() {} }; };
  C.defaults = { font: { family: '', size: 12 }, color: '' };
  C.register = () => {};
  window.Chart = C;
});

await p.goto(SITE, { waitUntil: 'domcontentloaded' });
await p.waitForFunction(() => typeof currentProtocols !== 'undefined' && Object.keys(currentProtocols).length > 0, null, { timeout: 20000 });

console.log('\n— ១. ផ្ទុកទិន្នន័យឆ្លង origin —');
const boot = await p.evaluate(() => ({
  diseases: Object.keys(currentProtocols).length,
  items: diseaseKeys().reduce((n,k)=>n+PILLAR_KEYS.reduce((m,pk)=>m+currentProtocols[k][pk].length,0),0),
  order: diseaseOrder.join(','),
  settings: Object.keys(settings).length,
  printKeys: Object.keys(printText).length
}));
eq('ជំងឺ ៦', boot.diseases, 6);
eq('ចំណុច ២៧២', boot.items, 272);
eq('លំដាប់ត្រឹមត្រូវ', boot.order, 'DENGUE,FLU,HFMD,RSV,AGE,GENERAL');
ok('អានការកំណត់បាន', boot.settings >= 9);
ok('អានអត្ថបទព្រីនបាន', boot.printKeys >= 17);
ok('គ្មាន console error', errors.length === 0, errors.slice(0,2).join(' | '));

console.log('\n— ២. ផ្ទាំងអ្នកគ្រប់គ្រងត្រូវបានចាក់សោ —');
eq('មិនទាន់ជា admin', await p.evaluate(() => isAdmin()), false);
eq('ផ្នែក admin លាក់', await p.locator('#admin').isVisible(), false);
ok('មានប្រអប់ចូល', await p.locator('#adminBox .btn').count() > 0);

console.log('\n— ៣. លេខសម្ងាត់ —');
await p.evaluate(() => openPinModal());
await p.fill('#pinInput', '000000');
await p.click('#pinOkBtn');
await p.waitForTimeout(700);
eq('លេខខុស → បដិសេធ', await p.evaluate(() => isAdmin()), false);
ok('បង្ហាញសារកំហុស', await p.locator('#pinError').isVisible());

await p.fill('#pinInput', PIN);
await p.click('#pinOkBtn');
await p.waitForFunction(() => isAdmin(), null, { timeout: 8000 });
eq('លេខត្រូវ → ចូលបាន', await p.evaluate(() => isAdmin()), true);
eq('ផ្នែក admin បង្ហាញ', await p.locator('#admin').isVisible(), true);

console.log('\n— ៤. កែចំណុចពិធីការ —');
await p.evaluate(() => { admGo('items'); admSetDisease('DENGUE'); admSetPillar('redFlags'); });
const before = await p.evaluate(() => currentProtocols.DENGUE.redFlags.length);
await p.fill('#admNewItem', 'ចំណុចតេស្ត ក');
await p.evaluate(() => admAddItem());
await p.waitForFunction(n => currentProtocols.DENGUE.redFlags.length === n + 1, before, { timeout: 8000 });
eq('បន្ថែមចំណុច', await p.evaluate(() => currentProtocols.DENGUE.redFlags.length), before + 1);
eq('អត្ថបទត្រូវ', await p.evaluate(() => currentProtocols.DENGUE.redFlags.slice(-1)[0].text), 'ចំណុចតេស្ត ក');

const newId = await p.evaluate(() => currentProtocols.DENGUE.redFlags.slice(-1)[0].id);
await p.fill('#it-' + newId, 'ចំណុចតេស្ត ក (កែរួច)');
await p.evaluate(id => admSaveItem(id), newId);
await p.waitForFunction(id => (currentProtocols.DENGUE.redFlags.find(x=>x.id===id)||{}).text.includes('កែរួច'), newId, { timeout: 8000 });
ok('កែអត្ថបទបាន', true);

await p.evaluate(id => admMoveItem(id, 'up'), newId);
await p.waitForFunction((args) => currentProtocols.DENGUE.redFlags.findIndex(x=>x.id===args.id) === args.i, { id:newId, i: before - 1 }, { timeout: 8000 });
ok('ផ្លាស់ទីឡើងលើបាន', true);

await p.evaluate(() => { window.askConfirm = async () => true; });
await p.evaluate(id => admDeleteItem(id), newId);
await p.waitForFunction(n => currentProtocols.DENGUE.redFlags.length === n, before, { timeout: 8000 });
eq('លុបចំណុច', await p.evaluate(() => currentProtocols.DENGUE.redFlags.length), before);

console.log('\n— ៥. គ្រប់គ្រងជំងឺ —');
await p.evaluate(() => admGo('diseases'));
await p.fill('#admNewKey', 'TESTDIS');
await p.fill('#admNewTitle', '៩. ជំងឺតេស្ត (Test)');
await p.fill('#admNewSub', 'សម្រាប់តេស្តតែប៉ុណ្ណោះ');
await p.evaluate(() => admAddDisease());
await p.waitForFunction(() => !!currentProtocols.TESTDIS, null, { timeout: 8000 });
ok('បន្ថែមជំងឺថ្មី', true);
ok('លេចឡើងក្នុងបញ្ជី SOP', (await p.evaluate(() => diseaseKeys())).includes('TESTDIS'));
await p.evaluate(() => admMoveDisease('TESTDIS','up'));
await p.waitForTimeout(900);
ok('ផ្លាស់លំដាប់ជំងឺ', (await p.evaluate(() => diseaseKeys()))[5] === 'TESTDIS');
await p.evaluate(() => admDeleteDisease('TESTDIS'));
await p.waitForFunction(() => !currentProtocols.TESTDIS, null, { timeout: 8000 });
ok('លុបជំងឺ', true);

console.log('\n— ៦. អត្តសញ្ញាណ និងរូបរាង —');
await p.evaluate(() => admGo('identity'));
await p.fill('#set-appNameKh', 'គ្លីនិកសាកល្បង');
await p.fill('#set-logoText', 'TS');
await p.evaluate(() => { document.querySelector('#set-primary').value = '#7a1fa2'; });
await p.evaluate(() => admSaveSettings());
await p.waitForFunction(() => settings.appNameKh === 'គ្លីនិកសាកល្បង', null, { timeout: 8000 });
eq('ឈ្មោះក្នុងក្បាលទំព័រប្តូរ', (await p.locator('[data-clinic-kh]').first().textContent()).trim(), 'គ្លីនិកសាកល្បង');
eq('អក្សរកាត់រូបសញ្ញាប្តូរ', (await p.locator('[data-logo-text]').first().textContent()).trim(), 'TS');
eq('ពណ៌ចម្បងប្តូរ',
   await p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--primary').trim()),
   '#7a1fa2');

console.log('\n— ៧. ទម្រង់ព្រីនកែបាន —');
await p.evaluate(() => admGo('print'));
await p.fill('#pt-cgTitle', 'ចំណងជើងបណ្ណថ្មី');
await p.evaluate(() => admSavePrintText());
await p.waitForFunction(() => printText.cgTitle === 'ចំណងជើងបណ្ណថ្មី', null, { timeout: 8000 });
const printHtml = await p.evaluate(() => getCaregiverCardHTML(false, diseaseKeys()[0]));
ok('ចំណងជើងថ្មីលេចក្នុងសន្លឹកព្រីន', printHtml.includes('ចំណងជើងបណ្ណថ្មី'));
ok('កូដឯកសារប្រើបុព្វបទ', printHtml.includes('SRC-CG-'));

console.log('\n— ៨. ផ្ទាំងងងឹត និងចាកចេញ —');
await p.evaluate(() => setTheme('dark'));
await p.waitForTimeout(400);
eq('ប្តូរទៅផ្ទាំងងងឹត', await p.evaluate(() => document.documentElement.getAttribute('data-theme')), 'dark');
await p.evaluate(() => adminLogout());
eq('ចាកចេញបាន', await p.evaluate(() => isAdmin()), false);
eq('ផ្នែក admin លាក់វិញ', await p.locator('#admin').isVisible(), false);

ok('គ្មាន console error ពេញការតេស្ត', errors.length === 0, errors.slice(0,3).join(' | '));

console.log(`\n══ លទ្ធផល៖ ${pass} ជាប់ · ${fail} ធ្លាក់ ══`);
await b.close();
process.exit(fail ? 1 : 0);
