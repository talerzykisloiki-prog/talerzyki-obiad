// ═══════════════════════════════════════════════════════════════
// Menu „Obiad do biura” - Talerzyki i Słoiki
// Wspólny plik: używa go strona (przeglądarka) i funkcja zamówień
// (serwer liczy cenę jeszcze raz z tego pliku, więc ceny są tylko tutaj).
// Ceny w groszach: 3400 = 34,00 zł.
// Źródło: Canva „strona www obiad i specjały”, stan na 20.11.2026.
// ═══════════════════════════════════════════════════════════════

// Miejsca dostawy NIE są zapisane w kodzie (jest publiczny).
// Lista miejsc i tajne kody linków są w Google Tabeli, arkusz „Miejsca”.
// Typ „piętra” → piętro, pokój, telefon i wybór godziny; typ „imię” → tylko imię, dowóz jak najszybciej.
export const ASAP = 'jak najszybciej';

export const DODATKI = [
  'Młode ziemniaczki z koperkiem',
  'Ryż biały',
  'Kasza bulgur',
  'Kasza gryczana niepalona',
  'Kasza kus kus',
];

export const SUROWKI = [
  'Buraczki z cebulką',
  'Mizeria',
  'Marchewka z jabłkiem i selerem',
  'Kapusta kiszona',
  'Ogórki kiszone',
  'Sałatka ze świeżych warzyw z winegretem',
  'Biała kapusta z marchewką',
];

// Ile można wybrać w cenie dania
export const LIMIT_DODATKI = 1;
export const LIMIT_SUROWKI = 2;
// Pół porcji: −30% od ceny podstawowej
// Cenę pół porcji zaokrąglamy do pełnych złotych (23,50 → 24 zł, 23,40 → 23 zł).
// Na razie pół porcji można wziąć z KAŻDEGO dania (także specjałów).
export const POL_PORCJI_RABAT = 0.30;

// Kategorie stałego menu. Specjały dnia przychodzą osobno (panel kuchni).
// sides: true  → klient wybiera dodatek i surówki (w cenie)
// half:  true  → można zamówić pół porcji
// variants: wybór wariantu (pierwszy = domyślny), delta = dopłata w groszach
// extras:   dopłaty do zaznaczenia
export const CATEGORIES = [
  {
    id: 'obiady', name: 'Dania mięsne', note: 'Dodatek i surówki w cenie. Wybierasz, jakie lubisz',
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
      { id: 'ciasto-dnia', name: 'Ciasto dnia', price: 1600, desc: 'Domowe wypieki. Zapytamy, co dziś jest' },
      { id: 'sernik-keto', name: 'Sernik keto', price: 1800, desc: 'Bez cukru i pszenicy, z liofilizowanymi malinami' },
      { id: 'ciastko', name: 'Ciastko', price: 500, desc: 'Kruche maślane ciastko z dodatkami' },
    ],
  },
];

// Pół porcji - wszystkie dania
for (const c of CATEGORIES) for (const it of c.items) it.half = true;

// ═══ Menu dla siłowni (miejsca typu „siłownia”) ═══
// Tylko te 4 dania. Wartości odżywcze SZACUNKOWE (tabele składu żywności, gramatury od kuchni).
// kcal, b = białko, t = tłuszcz, w = węglowodany, fib = błonnik (g); g = waga porcji (g).
// Na siłowni dodatki mają też makaron. Ceny: TYMCZASOWE (do potwierdzenia przez właściciela).
export const DODATEK_MAKARON = 'Makaron';
export const DODATKI_ALL = [...DODATKI, DODATEK_MAKARON];

export const GYM_CATEGORIES = [
  {
    id: 'fit', name: 'Fit menu', note: 'Policzone makro. Białko robi robotę',
    items: [
      { id: 'gym-makaron-szpinak', name: 'Makaron ze szpinakiem i grillowanym filetem', price: 3200, gym: true,
        desc: 'Makaron 270 g, grillowany filet z kurczaka 175 g (waga surowego), szpinak 80 g, śmietankowy sos 100 g',
        macro: { g: 625, kcal: 747, b: 57, t: 23, w: 77, fib: 7 } },
      { id: 'gym-fit-gyros', name: 'Fit Gyros', price: 3400, gym: true,
        desc: 'Grillowany kurczak, mix sałat, warzywa, gorący ryż, lekki sos gyros i winegret',
        macro: { g: 535, kcal: 706, b: 53, t: 37, w: 32, fib: 4 } },
      { id: 'gym-klopsiki', name: 'Klopsiki drobiowo-cukiniowe w sosie koperkowym', price: 3600, sides: true, gym: true,
        desc: 'Klopsiki z 160 g fileta z kurczaka i cukinii, sos koperkowy na śmietance 80 g, surówka 80 g. Dodatek wybierasz sam',
        macro: { g: 330, kcal: 353, b: 39, t: 16, w: 10, fib: 2, noSide: true } },
      { id: 'gym-filet-grzyb', name: 'Filet grillowany w sosie grzybowym', price: 3600, gym: true,
        desc: 'Grillowany filet z kurczaka 175 g (waga surowego), sos grzybowy 100 g, kasza gryczana 150 g, surówka z białej kapusty i marchewki 80 g',
        macro: { g: 505, kcal: 513, b: 48, t: 18, w: 39, fib: 6 } },
    ],
  },
];


// ═══ Napoje (wszędzie) i desery (tylko profil „joga”) ═══
export const DRINKS = {
  id: 'napoje', name: 'Napoje',
  items: [
    { id: 'nap-cola', name: 'Coca-Cola 330 ml', price: 800, drink: true },
    { id: 'nap-cola-zero', name: 'Coca-Cola Zero 330 ml', price: 800, drink: true },
    { id: 'nap-fanta', name: 'Fanta 330 ml', price: 800, drink: true },
    { id: 'nap-lemoniada', name: 'Lemoniada jabłkowo-cynamonowa', price: 800, drink: true, desc: 'Domowa, orzeźwiająca' },
    { id: 'nap-kompot', name: 'Kompot owocowy', price: 700, drink: true, desc: 'Z sezonowych owoców' },
    { id: 'nap-woda', name: 'Woda', price: 500, drink: true,
      variants: { label: 'Rodzaj', options: [{ name: 'Niegazowana' }, { name: 'Gazowana' }] } },
  ],
};
// price 0 = jeszcze bez ceny, danie niewidoczne i niezamawialne
export const DESSERTS_JOGA = {
  id: 'desery', name: 'Desery', note: 'Lekkie i na słodko, po zajęciach',
  items: [
    { id: 'des-owsianka', name: 'Owsianka z musem wiśniowym', price: 1500, only: ['joga'],
      desc: 'Kremowa owsianka z musem wiśniowym' },
    { id: 'des-chia', name: 'Deser chia', price: 1500, only: ['joga'],
      desc: 'Mus truskawkowo-wiśniowy, skyr naturalny, skyr waniliowy i nasiona chia' },
  ],
};

// Grupy specjałów dnia (w tej kolejności w menu i w panelu kuchni)
export const SPECIAL_GROUPS = [
  { id: 'zupy-mieso', name: 'Zupy gotowane na mięsie', sides: false },
  { id: 'zupy-wege', name: 'Zupy wegetariańskie', sides: false },
  { id: 'zupa-sezon', name: 'Zupa sezonowa', sides: false },
  { id: 'mieso', name: 'Danie mięsne', sides: true },
  { id: 'wege', name: 'Danie wegetariańskie', sides: true },
  { id: 'ryba', name: 'Ryba', sides: true },
];

// Domyślne specjały (piątek 20.11.2026) - kuchnia zmienia je w panelu.
// Linia: „nazwa | cena” ; dopisek „| bez dodatków” wyłącza wybór dodatków.
export const DEFAULT_SPECIALS_TEXT = {
  'zupy-mieso': 'Barszcz ukraiński na kurczaku | 16\nZupa indyjska curry na kurczaku | 16',
  'zupy-wege': 'Krem pieczarkowy z grzankami | 16\nZupa warzywna curry | 16\nZupa indyjska z pieczonym kalafiorem, ciecierzycą i soczewicą | 16',
  'zupa-sezon': 'Krem dyniowy z mlekiem kokosowym i nutą imbiru | 16',
  'mieso': 'Pierogi z wołowiną | 38 | bez dodatków\nPierogi z kaczką | 38 | bez dodatków\nButter chicken | 37',
  'wege': 'Kotlety z soczewicy, ciecierzycy i suszonych pomidorów | 35\nButter chicken z wegetariańskim kurczakiem | 37\nKotlety ziemniaczano-serowe | 34',
  'ryba': 'Dorsz w sosie śmietanowo-cytrynowym | 40',
};

// Zamienia teksty z panelu na listę dań specjalnych
export function parseSpecials(textByGroup) {
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

export function findItem(id, specials) {
  for (const c of CATEGORIES) for (const it of c.items) if (it.id === id) return it;
  for (const c of GYM_CATEGORIES) for (const it of c.items) if (it.id === id) return it;
  for (const c of [DRINKS, DESSERTS_JOGA]) for (const it of c.items) if (it.id === id) return it;
  return (specials || []).find(s => s.id === id) || null;
}

// Cena jednej sztuki pozycji z wybranymi opcjami (w groszach)
export function unitPrice(item, opts = {}) {
  let p = item.price;
  if (item.variants) {
    const v = item.variants.options[opts.variant | 0] || item.variants.options[0];
    p += v.delta || 0;
  }
  if (item.half && opts.half) p = Math.round(p * (1 - POL_PORCJI_RABAT) / 100) * 100;
  p = disc(p);
  if (item.extras && Array.isArray(opts.extras)) {
    for (const e of item.extras) if (opts.extras.includes(e.id)) p += disc(e.price);
  }
  return p;
}

// ─── Profile miejsc: ten sam kod, różne menu / zniżki / motyw ───
// Typ miejsca w arkuszu „Miejsca” → profil. Nazw miejsc tu NIE ma (publiczny kod).
//   standard: menu główne · gym: osobne menu fit z makro · galeria: menu główne ze zniżką
export const PROFILES = {
  standard: { discount: 0, specials: true },
  gym: { discount: 0, specials: false },
  galeria: { discount: 10, specials: true },
  joga: { discount: 0, specials: false },
};
// Które kategorie widzi dane miejsce (napoje wszędzie na końcu)
export function profileCategories(profile) {
  return profileCategoriesRaw(profile).map(c => ({ ...c, items: c.items.filter(i => i.price > 0) })).filter(c => c.items.length);
}
function profileCategoriesRaw(profile) {
  const gymNames = GYM_CATEGORIES.flatMap(c => c.items.map(i => i.name));
  if (profile === 'gym') return [...GYM_CATEGORIES, DRINKS];
  if (profile === 'joga') {
    const main = CATEGORIES.map(c => ({ ...c, items: c.items.filter(i => !gymNames.includes(i.name)) })).filter(c => c.items.length);
    return [...GYM_CATEGORIES, ...main, DESSERTS_JOGA, DRINKS];
  }
  return [...CATEGORIES, DRINKS];
}
// Czy dane danie można zamówić w miejscu o danym profilu (serwer odrzuca resztę)
export function allowedFor(it, profile) {
  if (it.special) return PROFILES[profile].specials;
  if (it.only) return it.only.indexOf(profile) >= 0;
  if (it.gym) return profile === 'gym' || profile === 'joga';
  if (it.drink) return true;
  return profile !== 'gym';
}
export function profileFromType(typ) {
  typ = String(typ || '');
  if (/si[łl]ow|gym/i.test(typ)) return 'gym';
  if (/galer/i.test(typ)) return 'galeria';
  if (/jog/i.test(typ)) return 'joga';
  return 'standard';
}

// Zniżka procentowa dla bieżącego miejsca (ustawia strona i skrypt po rozpoznaniu miejsca).
// Zaokrąglenie do pełnych złotych: od 50 gr w górę, do 49 gr w dół.
let DISCOUNT = 0;
export function setDiscount(percent) { DISCOUNT = Math.max(0, Math.min(90, percent | 0)); }
export function disc(grosze) {
  return DISCOUNT ? Math.floor((grosze * (100 - DISCOUNT) + 5000) / 10000) * 100 : grosze;
}

// Cena pół porcji samego dania (bez dopłat)
export const halfPrice = item => unitPrice(item, { half: true });

export function zl(grosze) {
  return (grosze / 100).toFixed(2).replace('.', ',') + ' zł';
}

// Godziny przyjmowania zamówień (Pon-Sob 11:00-19:00, czas Polski)
export const OPEN_FROM = '11:30';   // pierwsza dostawa
export const OPEN_TO = '18:30';     // ostatnia dostawa
export const LEAD_MIN = 90;         // zamówienia do 90 min przed dowozem
export const SLOT_STEP = 30;        // co ile minut sloty
export const PIETRA = 12;           // M34: 12 pięter
