// Składa jeden plik Kod.gs do wklejenia w Google Apps Script:
// menu.js (te same ceny co na stronie) + zaplecze.js.
// Uruchom: node apps-script/zbuduj.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const menu = readFileSync(join(here, '../public/menu.js'), 'utf8').replace(/^export\s+/gm, '');
const zaplecze = readFileSync(join(here, 'zaplecze.js'), 'utf8');
const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
writeFileSync(join(here, 'Kod.gs'),
  `// Obiad do biura — Talerzyki i Słoiki. Plik wygenerowany ${stamp} (node apps-script/zbuduj.mjs).\n` +
  `// Wklej CAŁOŚĆ do edytora Apps Script (Rozszerzenia → Apps Script) w miejsce kodu.\n\n` +
  menu + '\n\n' + zaplecze);
console.log('Zapisano apps-script/Kod.gs');
