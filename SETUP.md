# ការដំឡើង — ជំហានម្តងមួយ

មាន ២ ផ្នែក៖ **(ក) backend** នៅ Google Apps Script និង **(ខ) គេហទំព័រ** នៅ GitHub Pages។

---

## ក. Backend (Google Apps Script)

> បើលោកមានប្រព័ន្ធចាស់ដំណើរការរួចហើយ សូមប្រើ Sheet និង project ដដែល — ទិន្នន័យនឹងនៅដដែល។

1. បើក Google Sheet របស់លោក ▸ **Extensions ▸ Apps Script**
2. បិទភ្ជាប់មាតិកា `apps-script/Code.gs` ទៅក្នុងឯកសារ `Code.gs`
3. បង្កើតឯកសារថ្មី **Files ▸ + ▸ Script** ដាក់ឈ្មោះ `Seed` រួចបិទភ្ជាប់ `apps-script/Seed.gs`
4. **Run ▸ setup** — អនុញ្ញាតសិទ្ធិ រួចកត់ទុក **Admin PIN**
   *(ការរត់ម្តងទៀតមិនលុបទិន្នន័យទេ — វាគ្រាន់តែបន្ថែមផ្ទាំង `Settings` និង `PrintText` ដែលនៅខ្វះ)*
5. **Deploy ▸ Manage deployments ▸ ✏️ ▸ Version: New version ▸ Deploy**
   - Execute as: **Me**
   - Who has access: **Anyone**
6. ចម្លងតំណដែលបញ្ចប់ដោយ `/exec`

---

## ខ. គេហទំព័រ (GitHub Pages)

1. បង្កើត repository ថ្មីនៅ <https://github.com/new>
   - Name: `sop-clinic`  ·  **Public**  ·  កុំបន្ថែម README
2. នៅទំព័រ repo ទទេ ▸ **uploading an existing file** ▸ អូសថត `docs/`, `apps-script/`, `tools/`
   និងឯកសារ `README.md`, `SETUP.md`, `.gitignore` ចូល ▸ **Commit changes**
3. **Settings ▸ Pages**
   - Source: **Deploy from a branch**
   - Branch: **main** · Folder: **/docs** ▸ **Save**
4. រង់ចាំ ១–២ នាទី។ តំណនឹងចេញជា
   `https://<username>.github.io/sop-clinic/`

---

## គ. ភ្ជាប់គេហទំព័រទៅ backend

កែឯកសារ **`docs/assets/config.js`** ត្រឹមបន្ទាត់តែមួយ៖

```js
apiUrl: 'https://script.google.com/macros/s/AKfyc…/exec',
```

នៅ GitHub៖ បើកឯកសារ ▸ ✏️ (Edit) ▸ ដាក់តំណ `/exec` ▸ **Commit changes**។
រង់ចាំ ១ នាទី រួច refresh គេហទំព័រ។

**បន្ថែម (ស្រេចចិត្ត)** — ដើម្បីឱ្យតំណ `/exec` បង្វែរទៅគេហទំព័រ៖
Apps Script ▸ កែ `setSiteUrl()` ដាក់តំណ GitHub Pages ▸ **Run**។

---

## ឃ. ការត្រួតពិនិត្យបន្ទាប់ពីដំឡើង

| ត្រួតពិនិត្យ | រំពឹងឃើញ |
|---|---|
| បើកតំណ GitHub Pages | បញ្ជីជំងឺ និងចំណុចលេចឡើងក្នុង ២–៥ វិនាទី |
| បាតឆ្វេង «អានរួច %» | ផ្លាស់ប្តូរពេលរំកិល |
| ចុច 🔒 អ្នកគ្រប់គ្រង ▸ ដាក់ PIN | ផ្នែក «០៦ · ការកំណត់ និងកែសម្រួល» លេចឡើង |
| ផ្ទាំង «ចំណុចពិធីការ» ▸ បន្ថែម ១ ចំណុច | លេចឡើងភ្លាមក្នុងផ្នែក SOP |
| មជ្ឈមណ្ឌលព្រីន ▸ បណ្ណថែទាំ | ១ ទំព័រ A4 |

បើទំព័របង្ហាញ «មិនបានកំណត់ API» មានន័យថា `config.js` នៅមិនទាន់ដាក់តំណ `/exec`។
បើបង្ហាញ «ទាញមិនបាន» សូមពិនិត្យថា deployment កំណត់ **Who has access: Anyone**។

---

## ង. ការកែក្រោយៗ

| ចង់កែអ្វី | ធ្វើនៅឯណា | ត្រូវ deploy ទេ? |
|---|---|---|
| ខ្លឹមសារ SOP · ជំងឺ · ឈ្មោះ · ពណ៌ · អត្ថបទព្រីន | ផ្ទាំងអ្នកគ្រប់គ្រងក្នុងគេហទំព័រ | ទេ |
| រូបរាង HTML/CSS/JS | GitHub ▸ `docs/` | ទេ (Pages ធ្វើឱ្យស្វ័យប្រវត្តិ) |
| មុខងារ backend | Apps Script ▸ `Code.gs` | បាទ — **Manage deployments ▸ ✏️ ▸ New version** |

⚠️ កុំចុច **New deployment** — វាបង្កើតតំណ `/exec` ថ្មី ហើយ `config.js` នឹងឈប់ត្រូវ។
