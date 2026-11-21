// Obiad do biura — Talerzyki i Słoiki. Plik wygenerowany 2026-11-21 12:04 (node apps-script/zbuduj.mjs).
// Wklej CAŁOŚĆ do edytora Apps Script (Rozszerzenia → Apps Script) w miejsce kodu.

// ═══════════════════════════════════════════════════════════════
// Menu „Obiad do biura” — Talerzyki i Słoiki
// Wspólny plik: używa go strona (przeglądarka) i funkcja zamówień
// (serwer liczy cenę jeszcze raz z tego pliku, więc ceny są tylko tutaj).
// Ceny w groszach: 3400 = 34,00 zł.
// Źródło: Canva „strona www obiad i specjały”, stan na 20.11.2026.
// ═══════════════════════════════════════════════════════════════

// Miejsca dostawy NIE są zapisane w kodzie (jest publiczny).
// Lista miejsc i tajne kody linków są w Google Tabeli, arkusz „Miejsca”.
// Typ „piętra” → piętro, pokój, telefon i wybór godziny; typ „imię” → tylko imię, dowóz jak najszybciej.
const ASAP = 'jak najszybciej';

const DODATKI = [
  'Młode ziemniaczki z koperkiem',
  'Ryż biały',
  'Kasza bulgur',
  'Kasza gryczana niepalona',
  'Kasza kus kus',
];

const SUROWKI = [
  'Buraczki z cebulką',
  'Mizeria',
  'Marchewka z jabłkiem i selerem',
  'Kapusta kiszona',
  'Ogórki kiszone',
  'Sałatka ze świeżych warzyw z winegretem',
  'Biała kapusta z marchewką',
];

// Ile można wybrać w cenie dania
const LIMIT_DODATKI = 1;
const LIMIT_SUROWKI = 2;
// Pół porcji: −30% od ceny podstawowej
// Cenę pół porcji zaokrąglamy do pełnych złotych (23,50 → 24 zł, 23,40 → 23 zł).
// Na razie pół porcji można wziąć z KAŻDEGO dania (także specjałów).
const POL_PORCJI_RABAT = 0.30;

// Kategorie stałego menu. Specjały dnia przychodzą osobno (panel kuchni).
// sides: true  → klient wybiera dodatek i surówki (w cenie)
// half:  true  → można zamówić pół porcji
// variants: wybór wariantu (pierwszy = domyślny), delta = dopłata w groszach
// extras:   dopłaty do zaznaczenia
const CATEGORIES = [
  {
    id: 'obiady', name: 'Dania mięsne', note: 'Dodatek i surówki w cenie — wybierasz, jakie lubisz',
    items: [
      { id: 'kotlety-mielone', name: 'Kotlety mielone', price: 3400, sides: true, half: true, img: 'kotlety-mielone-z-karkowki.webp',
        desc: 'Soczyste kotlety mielone (2 szt.)',
        variants: { label: 'Mięso', options: [{ name: 'Z karkówki' }, { name: 'Z kurczaka' }] } },
      { id: 'bitka', name: 'Bitka w sosie', price: 3400, sides: true, half: true, img: 'bitka-z-karkowki-w-sosie.webp',
        desc: 'Bitki wieprzowe w sosie pieczeniowym' },
      { id: 'golabki', name: 'Gołąbki z sosem pomidorowym', price: 3600, sides: true, half: true,
        desc: 'Farsz z karkówki z ryżem (2 szt.) w liściach młodej kapusty' },
      { id: 'filet-grill', name: 'Filet drobiowy grill', price: 3600, sides: true, half: true,
        desc: 'Filet drobiowy grillowany',
        variants: { label: 'Sos', options: [{ name: 'Sos grzybowy' }, { name: 'Ze szpinakiem' }] } },
      { id: 'panierowany', name: 'Filet panierowany', price: 3800, sides: true, half: true, img: 'filet-z-kurczaka-panierowany.webp',
        desc: 'Pierś z kurczaka panierowana w bułce tartej' },
      { id: 'schabowy', name: 'Schabowy', price: 3800, sides: true, half: true,
        desc: 'Schab wieprzowy panierowany, smażony na smalcu' },
      { id: 'klopsiki', name: 'Klopsiki drobiowo-cukiniowe', price: 3600, sides: true, half: true, img: 'klopsiki-z-ziemniakami.webp',
        desc: 'Ze świeżo zmielonego fileta z kurczaka z tartą cukinią, w delikatnym sosie koperkowym' },
    ],
  },
  {
    id: 'salatki', name: 'Sałatki', note: 'Do sałatek chrupiący paluch',
    items: [
      { id: 'kurczak-klasyk', name: 'Kurczak klasyk', price: 3200, img: 'salatka-kurczak.webp',
        desc: 'Grillowany kurczak na miksie sałat z warzywami, sos winegret i jogurtowo-ziołowy' },
      { id: 'fit-gyros', name: 'Fit Gyros', price: 3400,
        desc: 'Grillowany kurczak, mix sałat, warzywa, gorący ryż, lekki sos gyros i winegret' },
      { id: 'halloumi', name: 'Hallo halloumi', price: 3400,
        desc: 'Ser halloumi z sezonowymi owocami i warzywami, dressing żurawinowy' },
      { id: 'grecka', name: 'Grecka klasyczna', price: 3000,
        desc: 'Ogórek, pomidor, czerwona cebulka, oliwki i feta z oliwą i ziołami' },
    ],
  },
  {
    id: 'makarony', name: 'Makarony',
    items: [
      { id: 'zielony', name: 'Zielony', price: 3200,
        desc: 'Makaron w sosie szpinakowym',
        variants: { label: 'Z czym', options: [{ name: 'Z grillowanym kurczakiem' }, { name: 'Z fetą' }] } },
      { id: 'bezowy', name: 'Beżowy', price: 3000,
        desc: 'Makaron w sosie śmietanowo-grzybowym',
        variants: { label: 'Wersja', options: [{ name: 'Klasyczny' }, { name: 'Z grillowanym kurczakiem', delta: 400 }] } },
      { id: 'bolognese', name: 'Spaghetti bolognese', price: 3000,
        desc: 'Sos pomidorowy z mielonym mięsem z karkówki, parmezan' },
    ],
  },
  {
    id: 'pierogi', name: 'Pierogowo', note: '7 szt. pierogów naszego wyrobu',
    items: [
      { id: 'ruskie', name: 'Pierogi ruskie', price: 3200,
        desc: 'Farsz ziemniaczano-serowy, okrasa z cebulki i kwaśna śmietana',
        extras: [{ id: 'salatka', name: 'Sałatka ze świeżych warzyw z winegretem', price: 500 }] },
      { id: 'z-miesem', name: 'Pierogi z mięsem', price: 3200,
        desc: 'Farsz mięsny, okrasa z cebulki i kwaśna śmietana',
        extras: [{ id: 'salatka', name: 'Sałatka ze świeżych warzyw z winegretem', price: 500 }] },
    ],
  },
  {
    id: 'nalesniki', name: 'Naleśniki wytrawne', note: '2 szt. z sałatką z winegretem i sosem ziołowym',
    items: [
      { id: 'nal-zielone', name: 'Naleśniki zielone', price: 3200,
        desc: 'Zielone naleśniki ze smażonym szpinakiem',
        variants: { label: 'Z czym', options: [{ name: 'Z grillowanym kurczakiem' }, { name: 'Z fetą' }] } },
      { id: 'nal-kolorowe', name: 'Naleśniki kolorowe', price: 3200,
        desc: 'Zielone naleśniki z warzywami' },
    ],
  },
  {
    id: 'slodkie', name: 'Na słodko i ciasta',
    items: [
      { id: 'nal-owoce', name: 'Naleśniki na słodko', price: 2200, img: 'nalesniki-z-twarogiem.webp',
        desc: '2 szt. z owocami i polewą',
        variants: { label: 'Nadzienie', options: [{ name: 'Z twarogiem' }, { name: 'Z czekoladą' }, { name: 'Z prażonym jabłkiem' }, { name: 'Z dżemem truskawkowym' }] } },
      { id: 'nal-orzech', name: 'Naleśniki orzechowe', price: 2400,
        desc: '2 szt. z masłem orzechowym, prażonym jabłkiem i polewą czekoladową' },
      { id: 'ciasto-dnia', name: 'Ciasto dnia', price: 1600, desc: 'Domowe wypieki — zapytamy, co dziś jest' },
      { id: 'sernik-keto', name: 'Sernik keto', price: 1800, desc: 'Bez cukru i pszenicy, z liofilizowanymi malinami' },
      { id: 'ciastko', name: 'Ciastko', price: 500, desc: 'Kruche maślane ciastko z dodatkami' },
    ],
  },
];

// Pół porcji — wszystkie dania
for (const c of CATEGORIES) for (const it of c.items) it.half = true;

// Grupy specjałów dnia (w tej kolejności w menu i w panelu kuchni)
const SPECIAL_GROUPS = [
  { id: 'zupy-mieso', name: 'Zupy gotowane na mięsie', sides: false },
  { id: 'zupy-wege', name: 'Zupy wegetariańskie', sides: false },
  { id: 'zupa-sezon', name: 'Zupa sezonowa', sides: false },
  { id: 'mieso', name: 'Danie mięsne', sides: true },
  { id: 'wege', name: 'Danie wegetariańskie', sides: true },
  { id: 'ryba', name: 'Ryba', sides: true },
];

// Domyślne specjały (piątek 20.11.2026) — kuchnia zmienia je w panelu.
// Linia: „nazwa | cena” ; dopisek „| bez dodatków” wyłącza wybór dodatków.
const DEFAULT_SPECIALS_TEXT = {
  'zupy-mieso': 'Barszcz ukraiński na kurczaku | 16\nZupa indyjska curry na kurczaku | 16',
  'zupy-wege': 'Krem pieczarkowy z grzankami | 16\nZupa warzywna curry | 16\nZupa indyjska z pieczonym kalafiorem, ciecierzycą i soczewicą | 16',
  'zupa-sezon': 'Krem dyniowy z mlekiem kokosowym i nutą imbiru | 16',
  'mieso': 'Pierogi z wołowiną | 38 | bez dodatków\nPierogi z kaczką | 38 | bez dodatków\nButter chicken | 37',
  'wege': 'Kotlety z soczewicy, ciecierzycy i suszonych pomidorów | 35\nButter chicken z wegetariańskim kurczakiem | 37\nKotlety ziemniaczano-serowe | 34',
  'ryba': 'Dorsz w sosie śmietanowo-cytrynowym | 40',
};

// Zamienia teksty z panelu na listę dań specjalnych
function parseSpecials(textByGroup) {
  const items = [];
  for (const g of SPECIAL_GROUPS) {
    const raw = (textByGroup && textByGroup[g.id]) || '';
    raw.split('\n').forEach((line, i) => {
      const parts = line.split('|').map(s => s.trim());
      const name = parts[0];
      if (!name) return;
      const zl = parseFloat((parts[1] || '').replace(',', '.').replace(/[^\d.]/g, ''));
      if (!isFinite(zl) || zl <= 0) return;
      const noSides = parts.slice(2).some(p => /bez\s+dodatk/i.test(p));
      items.push({
        id: 'sp-' + g.id + '-' + i,
        group: g.id,
        name,
        price: Math.round(zl * 100),
        sides: g.sides && !noSides,
        half: true,
        special: true,
      });
    });
  }
  return items;
}

function findItem(id, specials) {
  for (const c of CATEGORIES) for (const it of c.items) if (it.id === id) return it;
  return (specials || []).find(s => s.id === id) || null;
}

// Cena jednej sztuki pozycji z wybranymi opcjami (w groszach)
function unitPrice(item, opts = {}) {
  let p = item.price;
  if (item.variants) {
    const v = item.variants.options[opts.variant | 0] || item.variants.options[0];
    p += v.delta || 0;
  }
  if (item.half && opts.half) p = Math.round(p * (1 - POL_PORCJI_RABAT) / 100) * 100;
  if (item.extras && Array.isArray(opts.extras)) {
    for (const e of item.extras) if (opts.extras.includes(e.id)) p += e.price;
  }
  return p;
}

// Cena pół porcji samego dania (bez dopłat)
const halfPrice = item => unitPrice(item, { half: true });

function zl(grosze) {
  return (grosze / 100).toFixed(2).replace('.', ',') + ' zł';
}

// Godziny przyjmowania zamówień (Pon–Sob 11:00–19:00, czas Polski)
const OPEN_FROM = '11:30';   // pierwsza dostawa
const OPEN_TO = '18:30';     // ostatnia dostawa
const LEAD_MIN = 90;         // zamówienia do 90 min przed dowozem
const SLOT_STEP = 30;        // co ile minut sloty
const PIETRA = 12;           // M34: 12 pięter


// ═══════════════════════════════════════════════════════════════
// ZAPLECZE (Google Apps Script) — przyjmowanie zamówień do Google Tabeli
// Arkusze: „Zamówienia”, „Specjały”, „Ustawienia”. Strefa: Europe/Warsaw.
// Pierwsze uruchomienie: wybierz funkcję `przygotuj` i kliknij „Uruchom”.
// ═══════════════════════════════════════════════════════════════

const ARK_ZAM = 'Zamówienia', ARK_SPEC = 'Specjały', ARK_UST = 'Ustawienia', ARK_MIE = 'Miejsca';
const STRONA = 'https://talerzykisloiki-prog.github.io/talerzyki-obiad/';
const TZ = 'Europe/Warsaw';
const KOLUMNY = ['Dzień', 'Godz. dostawy', 'Nr', 'Miejsce', 'Status', 'Piętro', 'Pokój', 'Firma', 'Imię', 'Telefon', 'Zamówienie', 'Razem (zł)', 'Płatność', 'Uwagi', 'Złożone', 'ID', 'Dane (nie zmieniaj)'];
const C = { dzien: 1, godz: 2, nr: 3, miejsce: 4, status: 5, pietro: 6, pokoj: 7, firma: 8, imie: 9, tel: 10, opis: 11, razem: 12, plat: 13, uwagi: 14, zlozone: 15, id: 16, dane: 17 };
const kol = n => String.fromCharCode(64 + n); // numer kolumny → litera (do 26)
// klucz w aplikacji ↔ tekst w tabeli
const STATUS_TXT = { 'nowe': 'nowe', 'przyjete': 'przyjęte', 'w-drodze': 'w drodze', 'dostarczone': 'dostarczone', 'anulowane': 'anulowane' };
const STATUS_KEY = Object.fromEntries(Object.entries(STATUS_TXT).map(([k, v]) => [v, k]));
const PLATNOSCI = { gotowka: 'Gotówka przy odbiorze', karta: 'Karta / BLIK przy odbiorze' };

// ─── Pomocnicze ───
const out = o => ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
const ss = () => SpreadsheetApp.getActive();
const sheet = n => ss().getSheetByName(n);
const clean = (v, max) => String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, max || 200);
function warsawNow() {
  const d = new Date();
  return { date: Utilities.formatDate(d, TZ, 'yyyy-MM-dd'), minutes: +Utilities.formatDate(d, TZ, 'H') * 60 + +Utilities.formatDate(d, TZ, 'm'), stamp: Utilities.formatDate(d, TZ, 'yyyy-MM-dd HH:mm') };
}
const toMin = t => { const p = t.split(':').map(Number); return p[0] * 60 + p[1]; };
const isSunday = d => new Date(d + 'T12:00:00Z').getUTCDay() === 0;
function nextWorkday(date) { const d = new Date(date + 'T12:00:00Z'); do { d.setUTCDate(d.getUTCDate() + 1); } while (d.getUTCDay() === 0); return d.toISOString().slice(0, 10); }
function slotOk(day, time) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !/^\d{2}:\d{2}$/.test(time) || isSunday(day)) return false;
  const t = toMin(time);
  if (t < toMin(OPEN_FROM) || t > toMin(OPEN_TO)) return false;
  const now = warsawNow();
  if (day < now.date || day > nextWorkday(now.date)) return false;
  if (day === now.date && t < now.minutes + LEAD_MIN - 10) return false;
  return true;
}
// Tabela potrafi zamienić tekst na datę/godzinę — zamieniamy z powrotem
function cellStr(v) {
  if (v instanceof Date) return Utilities.formatDate(v, TZ, v.getFullYear() < 1901 ? 'HH:mm' : 'yyyy-MM-dd');
  return String(v == null ? '' : v).trim().replace(/^'/, '');
}

// ─── Miejsca (arkusz: Kod | Nazwa | Typ | Opis | Aktywne | Link) ───
function miejsca() {
  const sh = sheet(ARK_MIE);
  if (!sh || sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, 5).getValues()
    .filter(r => String(r[0]).trim() && String(r[1]).trim())
    .map(r => ({
      code: String(r[0]).trim(), name: String(r[1]).trim(),
      office: /pi[eę]tr/i.test(String(r[2])),
      place: String(r[3] || '').trim(),
      active: !/^(nie|no|false|0)$/i.test(String(r[4] || 'TAK').trim()),
    }));
}
function miejscePoKodzie(code) {
  code = String(code || '').trim();
  if (code.length < 6) return null;
  return miejsca().find(m => m.active && m.code === code) || null;
}
// To, co widzi klient (bez kodów innych miejsc)
function publicLoc(m) {
  return { name: m.name, office: m.office, place: m.place,
    hint: m.office ? 'Dowóz na Twoje piętro o wybranej godzinie' : 'Zamawiasz rano — przywozimy, jak tylko będzie gotowe' };
}
const LOCKED = { error: 'Ten link jest nieaktywny. Zamówienia tylko przez link od nas — zadzwoń: 728 343 338.', locked: true };

// ─── Ustawienia (arkusz klucz → wartość) ───
function settings() {
  const rows = sheet(ARK_UST).getDataRange().getValues();
  const s = {};
  for (const r of rows) if (r[0]) s[String(r[0]).trim()] = r[1];
  return s;
}
function setSetting(key, val) {
  const sh = sheet(ARK_UST), rows = sh.getDataRange().getValues();
  for (let i = 0; i < rows.length; i++) if (String(rows[i][0]).trim() === key) { sh.getRange(i + 1, 2).setValue(val); dropCache(); return; }
  sh.appendRow([key, val]);
  dropCache();
}

// ─── Specjały (arkusz: Grupa | Danie | Cena | Bez dodatków; G1 = dzień) ───
function readSpecials() {
  const sh = sheet(ARK_SPEC);
  const date = cellStr(sh.getRange('G1').getValue());
  const rows = sh.getRange(2, 1, 200, 4).getValues();
  const text = {};
  for (const g of SPECIAL_GROUPS) text[g.id] = '';
  for (const r of rows) {
    const g = SPECIAL_GROUPS.find(x => x.name.toLowerCase() === String(r[0]).trim().toLowerCase());
    const name = String(r[1]).trim();
    if (!g || !name || r[2] === '') continue;
    let line = name + ' | ' + String(r[2]).replace('.', ',');
    if (/^(tak|x|1|true)$/i.test(String(r[3]).trim())) line += ' | bez dodatków';
    text[g.id] += (text[g.id] ? '\n' : '') + line;
  }
  return { text, date };
}
function writeSpecials(text) {
  const sh = sheet(ARK_SPEC);
  sh.getRange(2, 1, 200, 4).clearContent();
  const rows = [];
  for (const g of SPECIAL_GROUPS) {
    for (const line of String(text[g.id] || '').split('\n')) {
      const p = line.split('|').map(x => x.trim());
      if (!p[0]) continue;
      const price = parseFloat(String(p[1] || '').replace(',', '.'));
      if (!(price > 0)) continue;
      rows.push([g.name, p[0], price, p.slice(2).some(x => /bez\s+dodatk/i.test(x)) ? 'TAK' : '']);
    }
  }
  if (rows.length) sh.getRange(2, 1, rows.length, 4).setValues(rows);
  sh.getRange('G1').setValue(warsawNow().date);
  dropCache();
}
function state() {
  const cache = CacheService.getScriptCache();
  const hit = cache.get('stan');
  if (hit) { const o = JSON.parse(hit); if (o.today === warsawNow().date) return o; }
  const o = stateFresh();
  try { cache.put('stan', JSON.stringify(o), 120); } catch (e) { /* za duże — pomijamy */ }
  return o;
}
function dropCache() { try { CacheService.getScriptCache().remove('stan'); } catch (e) { /* */ } }
function stateFresh() {
  const s = settings(), sp = readSpecials(), today = warsawNow().date;
  const open = !/^(nie|no|false|0)$/i.test(String(s['Przyjmujemy zamówienia'] || 'TAK').trim());
  return { today, specialsText: sp.text, specialsDate: sp.date, specials: sp.date === today ? parseSpecials(sp.text) : [], open, message: String(s['Komunikat gdy wyłączone'] || '') };
}

// ─── Wejścia HTTP ───
function doGet(e) {
  try {
    const a = (e.parameter || {}).a;
    if (a === 'menu') {
      const m = miejscePoKodzie(e.parameter.m);
      if (!m) return out(LOCKED);
      const s = state();
      return out({ today: s.today, specials: s.specials, open: s.open, message: s.message, loc: publicLoc(m) });
    }
    if (a === 'status') return out(orderStatus(String(e.parameter.id || '')));
    return out({ ok: true, app: 'Obiad do biura' });
  } catch (err) { return out({ error: 'Błąd serwera: ' + err.message }); }
}
function doPost(e) {
  let body;
  try { body = JSON.parse(e.postData.contents); } catch (err) { return out({ error: 'Niepoprawne dane' }); }
  try {
    if (body.a === 'order') return out(placeOrder(body));
    if (body.a === 'panel') return out(panel(body));
    return out({ error: 'Nieznana akcja' });
  } catch (err) { return out({ error: 'Błąd serwera: ' + err.message }); }
}

// ─── Zamówienie ───
function placeOrder(body) {
  const st = state();
  if (!st.open) return { error: st.message || 'Teraz nie przyjmujemy zamówień online. Zadzwoń: 728 343 338.' };
  const c = body.customer || {};
  const phone = clean(c.phone, 20).replace(/[^\d+ ]/g, '');
  const loc = miejscePoKodzie(body.m);
  if (!loc) return LOCKED;
  const digits = phone.replace(/\D/g, '').length;
  let customer, day, time;
  if (loc.office) {
    if (digits < 9) return { error: 'Podaj poprawny numer telefonu.' };
    const floor = parseInt(c.floor, 10);
    if (!(floor >= 0 && floor <= PIETRA)) return { error: 'Wybierz piętro.' };
    const room = clean(c.room, 30);
    if (!room) return { error: 'Podaj numer pokoju.' };
    customer = { loc: loc.name, phone, floor, room, company: clean(c.company, 60), name: clean(c.name, 40) };
    day = clean(body.day, 10); time = clean(body.time, 5);
    if (!slotOk(day, time)) return { error: 'Ta godzina dostawy jest już niedostępna. Wybierz inną.' };
  } else {
    const name = clean(c.name, 40);
    if (!name) return { error: 'Wpisz imię — po nim wydamy zamówienie.' };
    if (digits > 0 && digits < 9) return { error: 'Sprawdź numer telefonu albo zostaw puste pole.' };
    customer = { loc: loc.name, phone, floor: null, room: '', company: '', name };
    const now0 = warsawNow();
    day = (isSunday(now0.date) || now0.minutes > toMin(OPEN_TO)) ? nextWorkday(now0.date) : now0.date;
    time = ASAP;
  }
  const payment = PLATNOSCI[body.payment] ? body.payment : 'gotowka';
  if (!Array.isArray(body.items) || !body.items.length) return { error: 'Koszyk jest pusty.' };
  if (body.items.length > 40) return { error: 'Za dużo pozycji — zadzwoń do nas.' };

  const items = []; let total = 0;
  for (const raw of body.items) {
    const it = findItem(raw.id, st.specials);
    if (!it) return { error: 'Któreś danie jest już niedostępne. Odśwież menu.' };
    if (it.special && day !== st.today) return { error: 'Specjały dnia można zamówić tylko na dziś.' };
    const qty = Math.min(Math.max(parseInt(raw.qty, 10) || 1, 1), 20);
    const opts = { variant: raw.variant | 0, half: !!raw.half, extras: Array.isArray(raw.extras) ? raw.extras : [] };
    const line = { name: it.name, qty };
    if (it.variants) line.variant = (it.variants.options[opts.variant] || it.variants.options[0]).name;
    if (it.half && opts.half) line.half = true;
    if (it.sides) {
      line.dodatki = (Array.isArray(raw.dodatki) ? raw.dodatki : []).filter(d => DODATKI.indexOf(d) >= 0).slice(0, LIMIT_DODATKI);
      line.surowki = (Array.isArray(raw.surowki) ? raw.surowki : []).filter(d => SUROWKI.indexOf(d) >= 0).slice(0, LIMIT_SUROWKI);
    }
    if (it.extras) line.extras = it.extras.filter(x => opts.extras.indexOf(x.id) >= 0).map(x => x.name);
    if (raw.note) line.note = clean(raw.note, 120);
    line.unit = unitPrice(it, opts); line.sum = line.unit * qty; total += line.sum;
    items.push(line);
  }

  let payLabel = PLATNOSCI[payment];
  if (payment === 'gotowka') {
    if (body.cash === 'exact') payLabel = 'Gotówka – odliczona kwota';
    else {
      const paid = Math.round(parseFloat(String(body.cash).replace(',', '.')) * 100);
      if (!(paid > 0)) return { error: 'Zaznacz, czy potrzebujesz reszty.' };
      if (paid < total) return { error: 'Kwota gotówki jest mniejsza niż suma zamówienia.' };
      payLabel = 'Gotówka – płaci ' + zl(paid) + ', reszta ' + zl(paid - total);
    }
  }

  const id = Utilities.getUuid().replace(/-/g, '').slice(0, 12);
  const A = 'ABCDEFGHJKLMNPRSTUWXYZ23456789';
  let code = ''; for (let i = 0; i < 3; i++) code += A[Math.floor(Math.random() * A.length)];
  const now = warsawNow();
  const opis = items.map(l => {
    let t = l.qty + '× ' + l.name;
    if (l.variant) t += ' (' + l.variant + ')';
    if (l.half) t += ' — ½ porcji';
    const s = [].concat(l.dodatki || [], l.surowki || []);
    if (s.length) t += ': ' + s.join(', ');
    if (l.extras && l.extras.length) t += ' + ' + l.extras.join(', ');
    if (l.note) t += ' [' + l.note + ']';
    return t;
  }).join('\n');
  const note = clean(body.note, 300);
  const dane = { customer, items, payment, payLabel, note, createdAt: new Date().toISOString() };

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const f = customer.floor;
    sheet(ARK_ZAM).appendRow(["'" + day, "'" + time, code, loc.name, STATUS_TXT.nowe, f === null ? '' : (f === 0 ? 'Parter' : f), customer.room, customer.company, customer.name, phone ? "'" + phone : '', opis, total / 100, payLabel, note, "'" + now.stamp, id, JSON.stringify(dane)]);
  } finally { lock.releaseLock(); }

  telegram('🍽 Nowe zamówienie #' + code + '\n' + loc.name + (loc.office ? ' · ' + (customer.floor === 0 ? 'parter' : 'piętro ' + customer.floor) + ' · pokój ' + customer.room : '') +
    '\n👤 ' + (customer.name || '—') + (phone ? ' · 📞 ' + phone : '') + '\n🕐 ' + (day === now.date ? 'dziś ' : day + ' ') + time +
    '\n\n' + opis + '\n\nRazem: ' + zl(total) + ' · ' + payLabel + (note ? '\nUwagi: ' + note : ''));

  return { id, code, total, day, time, payLabel };
}

function findRowById(id) {
  if (!/^[a-z0-9]{12}$/.test(id)) return null;
  const sh = sheet(ARK_ZAM), n = sh.getLastRow();
  if (n < 2) return null;
  const ids = sh.getRange(2, C.id, n - 1, 1).getValues();
  for (let i = ids.length - 1; i >= 0; i--) if (String(ids[i][0]) === id) return i + 2;
  return null;
}
function orderStatus(id) {
  const row = findRowById(id);
  if (!row) return { error: 'Brak zamówienia' };
  const v = sheet(ARK_ZAM).getRange(row, 1, 1, KOLUMNY.length).getValues()[0];
  return { code: v[C.nr - 1], status: STATUS_KEY[String(v[C.status - 1]).trim()] || 'nowe', day: cellStr(v[C.dzien - 1]), time: cellStr(v[C.godz - 1]) };
}

// ─── Panel kuchni (PIN z arkusza Ustawienia) ───
function panel(body) {
  const s = settings();
  const pin = String(s['PIN panelu'] || '').trim();
  if (!pin || String(body.pin || '').trim() !== pin) return { error: 'Zły PIN', auth: false };
  const op = body.op;

  if (op === 'zamowienia') {
    const day = /^\d{4}-\d{2}-\d{2}$/.test(body.day || '') ? body.day : warsawNow().date;
    const sh = sheet(ARK_ZAM), n = sh.getLastRow();
    const rows = n > 1 ? sh.getRange(2, 1, n - 1, KOLUMNY.length).getValues() : [];
    const orders = [];
    for (const v of rows) {
      if (cellStr(v[C.dzien - 1]) !== day) continue;
      let d = {}; try { d = JSON.parse(v[C.dane - 1]); } catch (e) { /* ręcznie dodany wiersz */ }
      const f = v[C.pietro - 1];
      const locName = String(v[C.miejsce - 1] || '').trim() || 'Manhattan Business Center';
      orders.push({
        loc: locName, locName,
        id: String(v[C.id - 1]), code: String(v[C.nr - 1]), day, time: cellStr(v[C.godz - 1]),
        status: STATUS_KEY[String(v[C.status - 1]).trim()] || 'nowe',
        customer: { floor: f === 'Parter' ? 0 : (f === '' ? null : +f), room: String(v[C.pokoj - 1]), company: String(v[C.firma - 1]), name: String(v[C.imie - 1]), phone: String(v[C.tel - 1]) },
        items: d.items || [{ name: String(v[C.opis - 1]), qty: 1 }],
        total: Math.round(Number(v[C.razem - 1]) * 100) || 0,
        paymentLabel: String(v[C.plat - 1]), note: String(v[C.uwagi - 1]),
        createdAt: d.createdAt || cellStr(v[C.zlozone - 1]),
      });
    }
    orders.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
    return { day, orders };
  }
  if (op === 'ustawienia') {
    const st = state();
    return { today: st.today, specialsText: st.specialsText, specialsDate: st.specialsDate, open: st.open, message: st.message, groups: SPECIAL_GROUPS, locations: miejsca().map(m => m.name) };
  }
  if (op === 'status') {
    if (!STATUS_TXT[body.status]) return { error: 'Zły status' };
    const row = findRowById(String(body.id || ''));
    if (!row) return { error: 'Brak zamówienia' };
    sheet(ARK_ZAM).getRange(row, C.status).setValue(STATUS_TXT[body.status]);
    return { ok: true };
  }
  if (op === 'specjaly') { writeSpecials(body.text || {}); return { ok: true }; }
  if (op === 'stan') {
    setSetting('Przyjmujemy zamówienia', body.open ? 'TAK' : 'NIE');
    setSetting('Komunikat gdy wyłączone', String(body.message || '').slice(0, 200));
    return { ok: true };
  }
  return { error: 'Nieznana akcja' };
}

function telegram(text) {
  const s = settings();
  const token = String(s['Telegram token'] || '').trim(), chat = String(s['Telegram chat id'] || '').trim();
  if (!token || !chat) return;
  try {
    UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/sendMessage', { method: 'post', contentType: 'application/json', payload: JSON.stringify({ chat_id: chat, text }), muteHttpExceptions: true });
  } catch (e) { console.error(e); }
}

// ═══════════ Jednorazowe przygotowanie tabeli ═══════════
function przygotuj() {
  const book = ss();
  book.setSpreadsheetTimeZone(TZ);
  book.setSpreadsheetLocale('pl_PL');

  // Zamówienia
  let z = book.getSheetByName(ARK_ZAM);
  if (!z) { z = book.getSheets()[0]; if (z.getLastRow() > 0 && z.getName() !== ARK_ZAM) z = book.insertSheet(ARK_ZAM, 0); else z.setName(ARK_ZAM); }
  // Migracja ze starej wersji (bez kolumny „Miejsce”): wstaw kolumnę po „Nr”
  if (String(z.getRange(1, 4).getValue()).trim() === 'Status') {
    z.showColumns(1, z.getMaxColumns());
    z.insertColumnAfter(3);
    const n = z.getLastRow();
    if (n > 1) z.getRange(2, 4, n - 1, 1).setValue('Manhattan Business Center');
  }
  z.getRange(1, 1, 1, KOLUMNY.length).setValues([KOLUMNY]).setFontWeight('bold').setBackground('#12211B').setFontColor('#EDE8DD').setVerticalAlignment('middle');
  z.setFrozenRows(1); z.setRowHeight(1, 34);
  z.getRange('A:C').setNumberFormat('@');
  z.getRange(kol(C.tel) + ':' + kol(C.tel)).setNumberFormat('@');
  z.getRange(kol(C.razem) + ':' + kol(C.razem)).setNumberFormat('0.00 "zł"');
  z.getRange(kol(C.opis) + ':' + kol(C.opis)).setWrap(true);
  z.getRange(kol(C.plat) + ':' + kol(C.plat)).setWrap(true);
  z.getRange(kol(C.uwagi) + ':' + kol(C.uwagi)).setWrap(true);
  z.getRange(kol(C.miejsce) + ':' + kol(C.miejsce)).setFontWeight('bold');
  [96, 110, 52, 170, 110, 64, 70, 120, 110, 110, 380, 90, 190, 200, 130, 110, 60].forEach((w, i) => z.setColumnWidth(i + 1, w));
  z.hideColumns(C.id, 2);
  const stRange = z.getRange(2, C.status, z.getMaxRows() - 1, 1);
  stRange.setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(Object.values(STATUS_TXT), true).setAllowInvalid(false).build());
  const all = z.getRange(2, 1, z.getMaxRows() - 1, KOLUMNY.length);
  const rule = (txt, bg, fg) => SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=$' + kol(C.status) + '2="' + txt + '"').setBackground(bg).setFontColor(fg || null).setRanges([all]).build();
  z.setConditionalFormatRules([
    rule('nowe', '#F6E7C8'), rule('przyjęte', '#DCE8F6'), rule('w drodze', '#E9DFF6'),
    rule('dostarczone', '#DFF0E3', '#5B6B60'), rule('anulowane', '#F3DADA', '#8A5A5A'),
  ]);

  // Specjały
  let sp = book.getSheetByName(ARK_SPEC) || book.insertSheet(ARK_SPEC);
  sp.getRange('A1:D1').setValues([['Grupa', 'Danie', 'Cena (zł)', 'Bez dodatków (TAK)']]).setFontWeight('bold').setBackground('#12211B').setFontColor('#EDE8DD');
  sp.getRange('F1').setValue('Ważne na dzień:').setFontWeight('bold');
  sp.getRange('G1').setNumberFormat('@');
  sp.getRange('F3').setValue('Specjały widzą klienci tylko w dniu z G1. Najprościej zmieniać je w panelu kuchni (zakładka „Specjały dnia”) — panel sam wpisze datę.').setWrap(true);
  sp.setColumnWidth(1, 190); sp.setColumnWidth(2, 380); sp.setColumnWidth(3, 80); sp.setColumnWidth(4, 130); sp.setColumnWidth(6, 120); sp.setColumnWidth(7, 110);
  sp.setFrozenRows(1);
  sp.getRange(2, 1, 200, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(SPECIAL_GROUPS.map(g => g.name), true).build());
  if (String(sp.getRange('B2').getValue()).trim() === '') { writeSpecials(DEFAULT_SPECIALS_TEXT); sp.getRange('G1').setValue('2026-11-20'); }

  // Miejsca (tajne linki). Nazw i kodów NIE ma w kodzie — wpisuje się je w tabeli.
  let mi = book.getSheetByName(ARK_MIE) || book.insertSheet(ARK_MIE, 1);
  mi.getRange('A1:F1').setValues([['Kod (tajny)', 'Nazwa', 'Typ', 'Opis (widzi klient)', 'Aktywne', 'Link dla klientów']]).setFontWeight('bold').setBackground('#12211B').setFontColor('#EDE8DD');
  mi.setFrozenRows(1);
  mi.getRange('A:A').setNumberFormat('@');
  mi.getRange(2, 3, 50, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['piętra', 'imię'], true).build());
  mi.getRange(2, 5, 50, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['TAK', 'NIE'], true).build());
  // separator argumentów zależy od ustawień regionalnych tabeli (pl_PL → „;”)
  const sep = /^(en|ja|ko|zh|th|he|ar)/.test(book.getSpreadsheetLocale()) ? ',' : ';';
  const links = []; for (let r = 2; r <= 51; r++) links.push(['=IF(A' + r + '=""' + sep + '""' + sep + '"' + STRONA + '?m="&A' + r + ')']);
  if (!mi.getRange(2, 6).getFormula()) mi.getRange(2, 6, 50, 1).setFormulas(links); // nie nadpisuj działających linków
  [150, 220, 90, 220, 80, 520].forEach((w, i) => mi.setColumnWidth(i + 1, w));
  mi.getRange('H1').setValue('Jak to działa').setFontWeight('bold');
  mi.getRange('H2').setValue('Każde miejsce ma swój tajny link (kolumna F). Bez linku nie da się zamówić. Typ „piętra” = piętro, pokój i wybór godziny; „imię” = tylko imię, dowóz jak najszybciej. Link wyciekł? Zmień kod w kolumnie A — stary link przestanie działać. Nowy kod: min. 10 losowych liter i cyfr.').setWrap(true);
  mi.setColumnWidth(8, 360);

  // Ustawienia
  let us = book.getSheetByName(ARK_UST) || book.insertSheet(ARK_UST);
  if (us.getLastRow() < 1) {
    const pin = String(100000 + Math.floor(Math.random() * 900000));
    us.getRange('B:B').setNumberFormat('@');
    us.getRange(1, 1, 6, 3).setValues([
      ['PIN panelu', pin, 'PIN do panelu kuchni (panel.html). Zmień na swój.'],
      ['Przyjmujemy zamówienia', 'TAK', 'TAK / NIE — można też przełączać w panelu'],
      ['Komunikat gdy wyłączone', '', 'np. Dziś zamówienia tylko telefonicznie: 728 343 338'],
      ['Telegram token', '', 'opcjonalnie: token bota Telegram — wtedy każde zamówienie przyjdzie wiadomością'],
      ['Telegram chat id', '', 'opcjonalnie: id czatu/grupy kuchni'],
      ['Uwaga', '', 'Kolumn „ID” i „Dane” w arkuszu Zamówienia nie zmieniaj — z nich korzysta panel.'],
    ]);
  }
  us.getRange('A:A').setFontWeight('bold'); us.setColumnWidth(1, 200); us.setColumnWidth(2, 220); us.setColumnWidth(3, 520);

  SpreadsheetApp.flush();
  return 'Gotowe';
}
