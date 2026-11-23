import {
  CATEGORIES, PROFILES, profileCategories, SPECIAL_GROUPS, DODATKI, DODATKI_ALL, SUROWKI, LIMIT_DODATKI, LIMIT_SUROWKI,
  findItem, unitPrice, halfPrice, zl, OPEN_FROM, OPEN_TO, LEAD_MIN, SLOT_STEP, PIETRA,
  ASAP, setDiscount, disc,
} from './menu.js?v=14';
import { API_URL } from './config.js?v=11';

// Tajny kod miejsca z linku (?m=…). Bez niego nie da się zamówić.
const URLP = new URLSearchParams(location.search);


// Wywołania Google Apps Script (text/plain = bez zapytania CORS preflight)
async function apiGet(params) {
  const r = await fetch(API_URL + '?' + new URLSearchParams(params), { cache: 'no-store' });
  return r.json();
}
async function apiPost(body) {
  const r = await fetch(API_URL, { method: 'POST', headers: { 'content-type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) });
  return r.json();
}

// ─── Pomocnicze ───
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* tryb prywatny */ } },
  del(k) { try { localStorage.removeItem(k); } catch { /* */ } },
};
const K_PROFIL = 'tis_profil', K_KOSZYK = 'tis_koszyk', K_OSTATNIE = 'tis_ostatnie', K_KOD = 'tis_kod', K_SERWER = 'tis_serwer';
let KOD = (URLP.get('m') || '').trim();
if (KOD) store.set(K_KOD, KOD); else KOD = store.get(K_KOD, '');

const DNI = ['niedziela', 'poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota'];
const MIES = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'];
const BEZ_DODATKU = 'Bez dodatku';

function warsawNow() {
  const p = {};
  for (const x of new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Warsaw', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date())) p[x.type] = x.value;
  return { date: `${p.year}-${p.month}-${p.day}`, minutes: (p.hour === '24' ? 0 : +p.hour) * 60 + +p.minute };
}
const toMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const hhmm = m => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
const dateObj = d => new Date(d + 'T12:00:00Z');
const isSunday = d => dateObj(d).getUTCDay() === 0;
function nextWorkday(d) { const x = dateObj(d); do { x.setUTCDate(x.getUTCDate() + 1); } while (x.getUTCDay() === 0); return x.toISOString().slice(0, 10); }
function dayLabel(d, today) {
  const x = dateObj(d), name = DNI[x.getUTCDay()];
  const nice = `${x.getUTCDate()} ${MIES[x.getUTCMonth()]}`;
  if (d === today) return { short: 'Dziś', long: `dziś, ${nice}`, title: name[0].toUpperCase() + name.slice(1) + ', ' + nice };
  return { short: name[0].toUpperCase() + name.slice(1, 3) + '. ' + x.getUTCDate() + '.' + (x.getUTCMonth() + 1), long: `${name}, ${nice}`, title: '' };
}
function slotsFor(day) {
  const now = warsawNow();
  if (isSunday(day)) return [];
  const out = [];
  const ft = fixedTimes();
  if (!(server.loc || {}).office && ft.length) {
    for (const x of ft) if (!(day === now.date && toMin(x) < now.minutes + LEAD_MIN)) out.push(x);
    return out;
  }
  for (let t = toMin(OPEN_FROM); t <= toMin(OPEN_TO); t += SLOT_STEP) {
    if (day === now.date && t < now.minutes + LEAD_MIN) continue;
    out.push(hhmm(t));
  }
  return out;
}
const fmtPhone = s => { const d = String(s).replace(/\D/g, '').replace(/^48(?=\d{9}$)/, ''); return d.length === 9 ? d.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3') : s; };

let toastT;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2200); }
function vibrate() { try { navigator.vibrate && navigator.vibrate(15); } catch { /* */ } }

// ─── Stan ───
let profil = store.get(K_PROFIL, null);
let koszyk = store.get(K_KOSZYK, []);
let server = { today: warsawNow().date, specials: [], open: true, message: '' };
let serverFresh = false; // czy mamy już świeżą odpowiedź z Google
const allSpecials = () => server.specials;

// ─── Profile miejsc: standard / gym (menu fit z makro) / galeria (menu główne −10%) ───
// Profil i zniżkę podaje serwer (z typu miejsca w arkuszu). Tu tylko teksty i styl.
const profileId = () => { const l = server.loc || {}; return l.profile || (l.gym ? 'gym' : 'standard'); };
const isGym = () => profileId() === 'gym';
const isGaleria = () => profileId() === 'galeria';
const isJoga = () => profileId() === 'joga';
const dodatkiList = it => (it && it.gym) ? DODATKI_ALL : DODATKI;
const fixedTimes = () => (server.loc || {}).times || [];
const timed = () => !!(server.loc || {}).office || fixedTimes().length > 0;
const THEMES = {
  gym: {
    eyebrow: 'Fit obiady z dowozem · Gorzów Wlkp.',
    title: 'Zjedz <em>jak mistrz</em>, trenuj jak bestia',
    perks: ['Makro policzone', 'Dużo białka', 'Płacisz przy odbiorze'],
    formH: 'Dla kogo posiłek po treningu?',
    formP: 'Zapamiętamy imię na tym telefonie. Następnym razem od razu menu.',
    note: 'Fit menu',
    foot: 'Wartości odżywcze są szacunkowe (waga porcji po przygotowaniu).',
    doneH: 'Mocne zamówienie, <em>przyjęte!</em>',
  },
  galeria: {
    eyebrow: 'Dla zespołu galerii · Gorzów Wlkp.',
    title: 'Obiad <em>dla swoich</em>, w&nbsp;cenach tylko dla&nbsp;Was',
    perks: ['Ceny niższe o 10%', 'Dowóz prosto do galerii', 'Płacisz przy odbiorze', null],
    formH: 'Dla kogo ten obiad?',
    formP: 'Wpisz imię i sklep albo stanowisko w galerii, po tym Cię znajdziemy. Zapamiętamy to na tym telefonie.',
    note: 'Menu dla galerii',
    foot: 'Wszystkie ceny w menu są już o 10% niższe dla zespołu galerii (zaokrąglone do pełnych złotych).',
    doneH: 'Dziękujemy, <em>swoi!</em>',
  },
  joga: {
    eyebrow: 'Obiady po zajęciach · Gorzów Wlkp.',
    title: 'Po macie <em>coś dobrego</em> dla ciała',
    perks: ['Darmowy dowóz', 'Fit i domowe dania', 'Płacisz przy odbiorze', null],
    formH: 'Dla kogo ten obiad?',
    formP: 'Wpisz imię, po nim wydamy zamówienie. Zapamiętamy je na tym telefonie.',
    note: 'Dla Was po zajęciach',
    foot: 'Fit menu ma policzone makro (wartości szacunkowe). Masz alergię? Zapytaj nas przed zamówieniem.',
    doneH: 'Dziękujemy, <em>namaste!</em>',
  },
};
function applyTheme() {
  const id = profileId();
  setDiscount((server.loc || {}).discount | 0);
  for (const k of ['gym', 'galeria', 'joga']) document.body.classList.toggle(k, id === k);
  const logo = $('#studioLogo');
  if (logo) { logo.hidden = id !== 'joga'; if (id === 'joga' && !logo.getAttribute('src')) logo.src = logo.dataset.src; }
  const T = THEMES[id];
  if (!T) return;
  $('.start-hero .eyebrow').textContent = T.eyebrow;
  $('.hero-title').innerHTML = T.title;
  document.querySelectorAll('.perks li').forEach((li, i) => { const p = T.perks[i]; if (p) li.lastChild.textContent = p; else if (p === undefined) li.hidden = true; });
  $('#startForm h2').textContent = T.formH;
  $('#startForm h2 + p').textContent = T.formP;
  $('#menu .day-head .note').textContent = T.note;
  $('.menu-foot').innerHTML = `${T.foot}<br>Masz pytanie lub alergię? <a href="tel:+48728343338">Zadzwoń: 728 343 338</a>`;
  $('#vDone h1').innerHTML = T.doneH;
}
const macroLine = m => `<span class="mc k"><b>${m.kcal}</b> kcal</span><span class="mc"><b>${m.b}</b> g białka</span><span class="mc"><b>${m.t}</b> g tł.</span><span class="mc"><b>${m.w}</b> g węgl.</span>`;
function macroTable(m) {
  const row = (n, v, u, sub) => `<div class="mt-row${sub ? ' sub' : ''}"><span>${n}</span><b>${v} ${u}</b></div>`;
  return `<div class="macro-card"><div class="mt-head"><b>Wartości odżywcze</b><span>porcja ${m.g} g</span></div>
    <div class="mt-big"><div><b>${m.kcal}</b><span>kcal</span></div><div><b>${m.b}</b><span>białko g</span></div><div><b>${m.t}</b><span>tłuszcz g</span></div><div><b>${m.w}</b><span>węgl. g</span></div></div>
    ${row('Błonnik', m.fib, 'g', true)}
    <p class="mt-note">Wartości szacunkowe, z gramatur kuchni.${m.noSide ? ' Dodatek wybrany osobno nie jest wliczony (zwykle +130-190 kcal).' : ''}</p></div>`;
}

// ─── Widoki ───
function show(view) {
  const b = document.getElementById('boot'); if (b) b.remove();
  for (const v of ['vLock', 'vStart', 'vMenu', 'vDone']) $('#' + v).hidden = v !== view;
  window.scrollTo(0, 0);
}

// ═════════ START ═════════
let floorSel = null;
const isOffice = () => !!(server.loc || {}).office;
function renderLocs() {
  const btn = $('#goBtn');
  if (!server.loc) {
    // dane miejsca jeszcze jadą z Google - formularz można już wypełniać
    $('#locs').innerHTML = `<div class="loc static pending"><span class="loc-ico"><svg><use href="#i-pin"/></svg></span><span class="loc-txt"><b></b><span></span></span></div>`;
    btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Chwileczkę…';
    return;
  }
  btn.disabled = false; btn.innerHTML = 'Przejdź do menu <span aria-hidden="true">→</span>';
  const l = server.loc;
  $('#locs').innerHTML = `<div class="loc static">
    <span class="loc-ico"><svg><use href="#i-${l.office ? 'building' : 'pin'}"/></svg></span>
    <span class="loc-txt"><b>${esc(l.name)}</b>${l.place ? `<span>${esc(l.place)}</span>` : ''}${l.office ? `<small>${esc(l.hint)}</small>` : ''}</span></div>`;
}
function renderFloors() {
  const box = $('#floors');
  let h = `<button type="button" class="wide" data-f="0" aria-pressed="${floorSel === 0}">Parter</button>`;
  for (let i = 1; i <= PIETRA; i++) h += `<button type="button" data-f="${i}" aria-pressed="${floorSel === i}">${i}</button>`;
  box.innerHTML = h;
}
function applyLoc() {
  renderLocs();
  applyTheme();
  const office = isOffice();
  $('#officeFields').hidden = !office;
  $('#lName').innerHTML = office ? 'Imię <small>(opcj.)</small>' : isGaleria() ? 'Imię i sklep <small>(po tym Cię znajdziemy)</small>' : 'Imię <small>(po nim wydamy zamówienie)</small>';
  $('#lPhone').innerHTML = office ? 'Numer telefonu' : 'Numer telefonu <small>(opcj.)</small>';
  for (const id of ['#eName', '#ePhone', '#eFloor', '#eRoom']) $(id).hidden = true;
}
$('#floors').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  floorSel = +b.dataset.f; vibrate(); renderFloors(); $('#eFloor').hidden = true;
});
function openStart() {
  if (profil) {
    $('#fPhone').value = fmtPhone(profil.phone || '');
    $('#fRoom').value = profil.room || '';
    $('#fCompany').value = profil.company || '';
    $('#fName').value = profil.name || '';
    floorSel = Number.isInteger(profil.floor) ? profil.floor : null;
  }
  renderFloors();
  applyLoc();
  show('vStart');
}
$('#fPhone').addEventListener('blur', e => { e.target.value = fmtPhone(e.target.value); });
$('#startForm').addEventListener('submit', e => {
  e.preventDefault();
  const office = isOffice();
  const phone = $('#fPhone').value.replace(/\D/g, '').replace(/^48(?=\d{9}$)/, '');
  const room = $('#fRoom').value.trim();
  const name = $('#fName').value.trim();
  let ok = true;
  const bad = (el, err, cond) => { el && el.classList.toggle('bad', cond); $(err).hidden = !cond; if (cond) ok = false; };
  $('#ePhone').textContent = office ? 'Podaj numer, żebyśmy mogli zadzwonić przy dostawie.' : 'Sprawdź numer albo zostaw puste pole.';
  if (office) {
    bad($('#fPhone'), '#ePhone', phone.length !== 9);
    bad(null, '#eFloor', floorSel === null);
    bad($('#fRoom'), '#eRoom', !room);
    bad($('#fName'), '#eName', false);
  } else {
    bad($('#fName'), '#eName', !name);
    bad($('#fPhone'), '#ePhone', phone.length > 0 && phone.length !== 9);
  }
  if (!ok) { const f = document.querySelector('.err:not([hidden])'); f && f.parentElement.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
  profil = office
    ? { kod: KOD, phone, floor: floorSel, room, company: $('#fCompany').value.trim(), name }
    : { kod: KOD, phone, name, floor: null, room: '', company: '' };
  store.set(K_PROFIL, profil);
  openMenu();
});
function profilOk(p) {
  if (!p || !server.loc || p.kod !== KOD) return false;
  return server.loc.office ? !!(p.phone && p.room && Number.isInteger(p.floor)) : !!p.name;
}
function showLock() {
  store.del(K_KOD); store.del(K_SERWER);
  show('vLock');
}

// ═════════ MENU ═════════
const floorTxt = f => f === 0 ? 'Parter' : `Piętro ${f}`;
const profLoc = () => ({ ...server.loc, icon: server.loc.office ? 'building' : 'pin' });
const whereShort = () => profLoc().office ? `${floorTxt(profil.floor)} · pok. ${profil.room}` : `${profLoc().name} · ${profil.name}`;
// Dzień dostawy dla miejsc „jak najszybciej”: dziś, a po godzinach / w niedzielę - następny dzień roboczy
function asapDay() { const now = warsawNow(); return (isSunday(now.date) || now.minutes > toMin(OPEN_TO)) ? nextWorkday(now.date) : now.date; }
function openMenu() { openMenuRefresh(); show('vMenu'); }
function openMenuRefresh() {
  applyTheme();
  $('#whereTxt').textContent = whereShort();
  const today = server.today;
  $('#dayTitle').textContent = isSunday(today) ? 'Menu' : dayLabel(today, today).title;
  const cb = $('#closedBanner');
  if (!server.open) { cb.hidden = false; cb.textContent = server.message || 'W tej chwili nie przyjmujemy zamówień online. Zadzwoń: 728 343 338.'; }
  else if (timed() ? !slotsFor(today).length : asapDay() !== today) { cb.hidden = false; cb.textContent = `Na dziś już nie zdążymy. Możesz zamówić na ${dayLabel(nextWorkday(today), today).long}.`; }
  else cb.hidden = true;
  $('#leadInfo').textContent = (!profLoc().office && fixedTimes().length) ? `Darmowy dowóz do: ${profLoc().name}, o stałych godzinach (${fixedTimes().join(', ')}). Zamów najpóźniej 90 minut wcześniej.` : profLoc().office ? 'Zamów najpóźniej 90 minut przed dostawą. Dowozimy Pon.-Sob. 11:30-18:30.' : (isGym() ? `Dowozimy na siłownię: ${profLoc().name}. Zamów rano, dowozimy, jak tylko będzie gotowe.` : isGaleria() ? `Dowozimy do: ${profLoc().name}. Ceny w menu są już o 10% niższe dla Was.` : `Dowozimy do: ${profLoc().name}.`);
  renderHalfPromo();
  renderMenu();
  updateCartbar();
}
function renderHalfPromo() {
  if (isJoga()) {
    const ft = fixedTimes();
    $('#halfPromo').innerHTML = `<span class="hp-badge"><b>🌿</b></span><span class="hp-title">Darmowy dowóz <em>${ft.length ? 'o stałej godzinie' : 'prosto do studia'}</em></span><span class="hp-ex">${ft.length ? 'Wybierz godzinę z listy przy zamówieniu. ' : ''}Fit z policzonym makro albo domowy obiad. Zamów wygodnie w aplikacji.</span><span class="hp-go">Zobacz menu →</span>`;
    return;
  }
  if (isGym()) {
    $('#halfPromo').innerHTML = `<span class="hp-badge"><b>💪</b></span><span class="hp-title">Trening zrobiony? <em>Teraz paliwo</em></span><span class="hp-ex">Każde danie z policzonymi kaloriami i makro</span>`;
    return;
  }
  const ex = findItem('schabowy') || CATEGORIES[0].items[0];
  if (isGaleria()) {
    $('#halfPromo').innerHTML = `<span class="hp-badge"><b>−10%</b></span>
    <span class="hp-title">Jesteście z galerii? <em>To ceny dla swoich</em></span>
    <span class="hp-ex">Wszystko w menu jest już o 10% tańsze. Nic nie musisz liczyć ani podawać.</span>
    <span class="hp-go">A pół porcji jest jeszcze o 30% tańsze →</span>`;
    return;
  }
  $('#halfPromo').innerHTML = `<span class="hp-badge"><b>½</b><small>−30%</small></span>
    <span class="hp-title">Mniejszy głód? <em>Pół porcji</em> taniej</span>
    <span class="hp-ex">np. ${esc(ex.name)}: <s>${zl(ex.price)}</s> → <b>${zl(halfPrice(ex))}</b></span>
    <span class="hp-go">Każde danie: wybierz „Pół porcji” →</span>`;
}
$('#whereBtn').addEventListener('click', openStart);

function dishHTML(it) {
  const inCart = koszyk.filter(l => l.id === it.id).reduce((a, l) => a + l.qty, 0);
  const tags = [];
  if (it.sides) tags.push('dodatki w cenie');
  return `<button class="dish" type="button" data-id="${esc(it.id)}">
    <div class="dish-body">
      <div class="dish-name">${esc(it.name)}</div>
      ${it.desc ? `<div class="dish-desc">${esc(it.desc)}</div>` : ''}
      ${it.macro ? `<div class="dish-macro">${macroLine(it.macro)}</div>` : ''}
      <div class="dish-meta"><span class="dish-price price">${zl(disc(it.price))}</span>${it.half ? `<span class="dish-half price">½ porcji ${zl(halfPrice(it))}</span>` : ''}${tags.map(t => `<span class="dish-tag">${t}</span>`).join('')}${inCart ? `<span class="incart">${inCart} w koszyku</span>` : ''}</div>
    </div>
    ${it.img
      ? `<div class="dish-thumb"><img src="img/sm/${esc(it.img)}" alt="" loading="lazy" decoding="async" width="84" height="84"><span class="plus">+</span></div>`
      : `<div class="dish-thumb ph" aria-hidden="true"><span class="ph-mono">TS</span><span class="plus">+</span></div>`}
    <span class="dish-add" aria-hidden="true">+</span>
  </button>`;
}

function renderMenu() {
  const cats = [];
  const sp = (PROFILES[profileId()] || PROFILES.standard).specials ? allSpecials() : [];
  if (sp.length) {
    let h = '';
    for (const g of SPECIAL_GROUPS) {
      const items = sp.filter(s => s.group === g.id);
      if (!items.length) continue;
      h += `<div class="sub">${esc(g.name)}</div>` + items.map(dishHTML).join('');
    }
    cats.push({ id: 'specjaly', name: 'Specjały dnia', count: sp.length, html: `<section class="cat special" id="c-specjaly">
      <div class="cat-head"><h2>Specjały <em>dnia</em></h2><span class="badge">tylko dziś</span></div>
      <p class="cat-note">Dania główne z dodatkiem i surówkami w cenie.</p>${h}</section>` });
  }
  for (const c of profileCategories(profileId())) {
    cats.push({ id: c.id, name: c.name, count: c.items.length, html: `<section class="cat" id="c-${c.id}">
      <div class="cat-head"><h2>${esc(c.name)}</h2></div>
      ${c.note ? `<p class="cat-note">${esc(c.note)}</p>` : ''}
      ${c.items.map(dishHTML).join('')}</section>` });
  }
  $('#cats').innerHTML = cats.map(c => c.html).join('');
  const ile = n => n + ' ' + (n === 1 ? 'danie' : (n % 10 >= 2 && n % 10 <= 4 && (n < 10 || n > 20)) ? 'dania' : 'dań');
  $('#tiles').innerHTML = cats.map(c => `<a href="#c-${c.id}" data-c="${c.id}" class="${c.id === 'specjaly' ? 'hot' : ''}"><b>${esc(c.name)}</b><span>${c.id === 'specjaly' ? (c.count ? 'tylko dziś · ' + ile(c.count) : 'wczytujemy…') : c.id === 'napoje' ? c.count + ' ' + (c.count === 1 ? 'napój' : 'napojów') : ile(c.count)}</span></a>`).join('');
  $('#chips').innerHTML = cats.map((c, i) => `<a href="#c-${c.id}" class="${i ? '' : 'on'}" data-c="${c.id}">${esc(c.name)}</a>`).join('');
  watchChips();
}

$('#cats').addEventListener('click', e => {
  const d = e.target.closest('.dish'); if (!d) return;
  const it = findItem(d.dataset.id, allSpecials());
  if (it) openDish(it);
});
function jumpTo(e) {
  const a = e.target.closest('a[data-c]'); if (!a) return;
  e.preventDefault();
  const sec = document.getElementById('c-' + a.dataset.c);
  if (!sec) return;
  const top = sec.getBoundingClientRect().top + window.scrollY - $('.topbar').offsetHeight - 4;
  window.scrollTo({ top, behavior: 'smooth' });
}
$('#chips').addEventListener('click', jumpTo);
$('#tiles').addEventListener('click', jumpTo);
$('#halfPromo').addEventListener('click', jumpTo);
let chipObs;
function watchChips() {
  chipObs && chipObs.disconnect();
  chipObs = new IntersectionObserver(entries => {
    for (const en of entries) if (en.isIntersecting) {
      const id = en.target.id.slice(2);
      document.querySelectorAll('#chips a').forEach(a => {
        const on = a.dataset.c === id; a.classList.toggle('on', on);
        if (on) a.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
      });
    }
  }, { rootMargin: '-120px 0px -65% 0px' });
  document.querySelectorAll('.cat').forEach(s => chipObs.observe(s));
}

// ═════════ ARKUSZ ═════════
let sheetMode = null;
function openSheet(mode) {
  sheetMode = mode;
  $('#scrim').classList.add('show'); $('#sheet').classList.add('show');
  document.body.style.overflow = 'hidden';
  $('#sheetBody').scrollTop = 0;
}
function closeSheet() {
  $('#scrim').classList.remove('show'); $('#sheet').classList.remove('show');
  document.body.style.overflow = ''; sheetMode = null;
}
$('#scrim').addEventListener('click', closeSheet);
$('#sheetClose').addEventListener('click', closeSheet);
document.addEventListener('keydown', e => { if (e.key === 'Escape' && sheetMode) closeSheet(); });
// Zamknięcie przeciągnięciem w dół za uchwyt
(() => {
  let y0 = null; const sh = $('#sheet');
  sh.addEventListener('touchstart', e => { if (e.target.closest('.sheet-grab') || ($('#sheetBody').scrollTop <= 0 && e.target.closest('.sheet-scroll'))) y0 = e.touches[0].clientY; }, { passive: true });
  sh.addEventListener('touchmove', e => { if (y0 === null) return; const dy = e.touches[0].clientY - y0; if (dy > 0) sh.style.transform = `translateY(${dy}px)`; }, { passive: true });
  sh.addEventListener('touchend', e => { if (y0 === null) return; const dy = e.changedTouches[0].clientY - y0; sh.style.transform = ''; y0 = null; if (dy > 110) closeSheet(); });
})();

// ─── Danie ───
let cur = null;
function openDish(it, editIdx = null) {
  const src = editIdx !== null ? koszyk[editIdx] : null;
  cur = {
    it, editIdx,
    qty: src ? src.qty : 1,
    variant: src ? src.variant : 0,
    half: src ? !!src.half : false,
    dodatki: src ? [...(src.dodatki || [])] : [],
    surowki: src ? [...(src.surowki || [])] : [],
    extras: src ? [...(src.extras || [])] : [],
    note: src ? src.note || '' : '',
  };
  renderDish();
  openSheet('dish');
}
function renderDish() {
  const { it } = cur;
  let h = '';
  h += it.img
    ? `<div class="sheet-img"><img src="img/${esc(it.img)}" alt="${esc(it.name)}" decoding="async" style="background:url(img/sm/${esc(it.img)}) center/cover"></div>`
    : `<div class="sheet-img ph" aria-hidden="true"><span class="ph-mono">TS</span><small>Zdjęcie wkrótce</small></div>`;
  h += `<div class="sheet-title"><h3 id="sheetTitle">${esc(it.name)}</h3>${it.desc ? `<p>${esc(it.desc)}</p>` : ''}<span class="price">${zl(disc(it.price))}</span></div>`;
  if (it.macro) h += macroTable(it.macro);
  if (it.half) {
    const base = unitPrice(it, { variant: cur.variant }), half = unitPrice(it, { variant: cur.variant, half: true });
    h += `<div class="size-seg" role="radiogroup" aria-label="Wielkość porcji">
      <button type="button" role="radio" data-k="size" data-v="0" aria-checked="${!cur.half}"><b>Cała porcja</b><span>${zl(base)}</span></button>
      <button type="button" role="radio" data-k="size" data-v="1" aria-checked="${cur.half}"><i class="save">−30%</i><b>Pół porcji</b><span>${zl(half)}</span></button>
    </div>`;
  }

  if (it.variants) {
    h += `<div class="opt"><div class="opt-head"><b>${esc(it.variants.label)}</b><span>wybierz 1</span></div><div class="opt-list" role="radiogroup">` +
      it.variants.options.map((o, i) => `<button type="button" class="pill" role="radio" data-k="variant" data-v="${i}" aria-checked="${cur.variant === i}">${esc(o.name)}${o.delta ? `<span class="plus-price">+${zl(o.delta)}</span>` : ''}</button>`).join('') + '</div></div>';
  }
  if (it.sides) {
    const dodSel = cur.dodatki.length ? cur.dodatki[0] : (cur.noDod ? BEZ_DODATKU : null);
    h += `<div class="opt"><div class="opt-head"><b>Dodatek</b><span class="free">w cenie · wybierz ${LIMIT_DODATKI}</span></div><div class="opt-list" role="radiogroup">` +
      [...dodatkiList(cur.it), BEZ_DODATKU].map(d => `<button type="button" class="pill" role="radio" data-k="dodatek" data-v="${esc(d)}" aria-checked="${dodSel === d}">${esc(d)}</button>`).join('') + '</div></div>';
    const full = cur.surowki.length >= LIMIT_SUROWKI;
    h += `<div class="opt"><div class="opt-head"><b>Surówki</b><span class="free">w cenie · do ${LIMIT_SUROWKI} (${cur.surowki.length}/${LIMIT_SUROWKI})</span></div><div class="opt-list">` +
      SUROWKI.map(s => { const on = cur.surowki.includes(s); return `<button type="button" class="pill" role="checkbox" data-k="surowka" data-v="${esc(s)}" aria-checked="${on}" ${full && !on ? 'disabled' : ''}>${esc(s)}</button>`; }).join('') + '</div></div>';
  }
  if (it.extras) {
    h += `<div class="opt"><div class="opt-head"><b>Dodaj do zamówienia</b><span>za dopłatą</span></div><div class="opt-list">` +
      it.extras.map(x => `<button type="button" class="pill" role="checkbox" data-k="extra" data-v="${esc(x.id)}" aria-checked="${cur.extras.includes(x.id)}">${esc(x.name)}<span class="plus-price">+${zl(disc(x.price))}</span></button>`).join('') + '</div></div>';
  }
  h += `<div class="opt"><label class="field"><span>Uwagi do dania <small>(opcj.)</small></span><input class="input" id="dishNote" maxlength="120" placeholder="np. bez cebuli, sos osobno" value="${esc(cur.note)}"></label></div>`;
  $('#sheetBody').innerHTML = h;
  renderDishFoot();
}
function curOpts() { return { variant: cur.variant, half: cur.half, extras: cur.extras }; }
function renderDishFoot() {
  const needDod = cur.it.sides && !cur.dodatki.length && !cur.noDod;
  const price = unitPrice(cur.it, curOpts()) * cur.qty;
  $('#sheetFoot').innerHTML = `
    <div class="stepper"><button type="button" data-q="-1" aria-label="Mniej" ${cur.qty <= 1 ? 'disabled' : ''}>−</button><output>${cur.qty}</output><button type="button" data-q="1" aria-label="Więcej">+</button></div>
    <button class="btn btn-brass btn-split" id="addBtn" type="button" ${needDod ? 'disabled' : ''}>
      <span>${needDod ? 'Wybierz dodatek' : (cur.editIdx !== null ? 'Zapisz' : 'Dodaj')}</span><span class="price">${zl(price)}</span>
    </button>`;
}
$('#sheetBody').addEventListener('click', e => {
  if (sheetMode !== 'dish') return;
  const b = e.target.closest('[data-k]'); if (!b) return;
  const k = b.dataset.k, v = b.dataset.v;
  cur.note = ($('#dishNote') || {}).value || cur.note;
  if (k === 'variant') cur.variant = +v;
  if (k === 'dodatek') { if (v === BEZ_DODATKU) { cur.dodatki = []; cur.noDod = true; } else { cur.dodatki = [v]; cur.noDod = false; } }
  if (k === 'surowka') { const i = cur.surowki.indexOf(v); if (i >= 0) cur.surowki.splice(i, 1); else if (cur.surowki.length < LIMIT_SUROWKI) cur.surowki.push(v); }
  if (k === 'extra') { const i = cur.extras.indexOf(v); if (i >= 0) cur.extras.splice(i, 1); else cur.extras.push(v); }
  if (k === 'size') cur.half = v === '1';
  vibrate();
  const st = $('#sheetBody').scrollTop;
  renderDish();
  $('#sheetBody').scrollTop = st;
});
$('#sheetBody').addEventListener('input', e => { if (e.target.id === 'dishNote' && cur) cur.note = e.target.value; });

$('#sheetFoot').addEventListener('click', e => {
  if (sheetMode === 'dish') {
    const q = e.target.closest('[data-q]');
    if (q) { cur.qty = Math.max(1, Math.min(20, cur.qty + +q.dataset.q)); renderDishFoot(); return; }
    if (e.target.closest('#addBtn')) addCurrent();
  } else if (sheetMode === 'cart') {
    if (e.target.closest('#orderBtn')) placeOrder();
  }
});

function lineKey(l) { return JSON.stringify([l.id, l.variant, l.half, l.dodatki, [...l.surowki].sort(), [...l.extras].sort(), l.note]); }
function addCurrent() {
  const l = { id: cur.it.id, qty: cur.qty, variant: cur.variant, half: cur.half, dodatki: cur.dodatki, surowki: cur.surowki, extras: cur.extras, note: (cur.note || '').trim() };
  if (cur.editIdx !== null) {
    koszyk[cur.editIdx] = l;
    saveCart(); renderCart(); sheetMode = 'cart'; return;
  }
  const same = koszyk.find(x => lineKey(x) === lineKey(l));
  if (same) same.qty = Math.min(20, same.qty + l.qty); else koszyk.push(l);
  saveCart(); closeSheet(); renderMenu(); toast('Dodano do koszyka'); vibrate();
}

// ═════════ KOSZYK ═════════
function saveCart() { store.set(K_KOSZYK, koszyk); updateCartbar(); }
function cleanCart() {
  // usuń pozycje, których już nie ma (np. wczorajsze specjały)
  const before = koszyk.length;
  koszyk = koszyk.filter(l => findItem(l.id, allSpecials()));
  if (koszyk.length !== before) store.set(K_KOSZYK, koszyk);
}
const known = () => koszyk.filter(l => findItem(l.id, allSpecials()));
const lineUnit = l => { const it = findItem(l.id, allSpecials()); return it ? unitPrice(it, l) : 0; };
const cartTotal = () => known().reduce((a, l) => a + lineUnit(l) * l.qty, 0);
const cartCount = () => known().reduce((a, l) => a + l.qty, 0);
function updateCartbar() {
  const n = cartCount();
  $('#cartbar').classList.toggle('show', n > 0);
  $('#cartCount').textContent = n;
  $('#cartSum').textContent = zl(cartTotal());
}
$('#cartBtn').addEventListener('click', () => { renderCart(); openSheet('cart'); });

function lineOpts(l, it) {
  const o = [];
  if (it.variants) o.push(it.variants.options[l.variant | 0].name);
  if (l.half) o.push('pół porcji');
  if (it.sides) o.push(...(l.dodatki.length ? l.dodatki : [BEZ_DODATKU.toLowerCase()]), ...l.surowki);
  if (it.extras) for (const x of it.extras) if (l.extras.includes(x.id)) o.push('+ ' + x.name);
  if (l.note) o.push('„' + l.note + '”');
  return o.join(' · ');
}

let co = { day: null, time: null, payment: store.get('tis_platnosc', 'gotowka'), cash: null, cashOther: '', note: '', err: '' };
const NOMINALY = [50, 100, 200];
// Kwota, z której klient płaci gotówką (w groszach) albo 'exact' / null
function cashAmount() {
  if (co.cash === 'exact') return 'exact';
  if (co.cash === 'other') { const v = parseFloat(String(co.cashOther).replace(',', '.')); return isFinite(v) && v > 0 ? Math.round(v * 100) : null; }
  return co.cash ? co.cash * 100 : null;
}
function cashOk() { if (co.payment !== 'gotowka') return true; const a = cashAmount(); return a === 'exact' || (a !== null && a >= cartTotal()); }
function hasSpecials() { return koszyk.some(l => findItem(l.id, allSpecials())?.special); }
function availableDays() {
  const today = server.today, next = nextWorkday(today);
  const days = [];
  if (!isSunday(today)) days.push({ d: today, slots: slotsFor(today) });
  days.push({ d: next, slots: slotsFor(next), blocked: hasSpecials() });
  return days;
}
function ensureSlot() {
  if (!timed()) { co.day = asapDay(); co.time = ASAP; if (co.day !== server.today && hasSpecials()) co.day = null; return; }
  if (co.time === ASAP) co.time = null;
  const days = availableDays();
  let d = days.find(x => x.d === co.day && x.slots.length && !x.blocked) || days.find(x => x.slots.length && !x.blocked);
  co.day = d ? d.d : null;
  if (d && !d.slots.includes(co.time)) co.time = d.slots[0];
  if (!d) co.time = null;
}

function renderCart() {
  co.note = ($('#coNote') || {}).value ?? co.note;
  let h = `<div class="co-title"><h3 id="sheetTitle">Twoje zamówienie</h3></div>`;
  if (!known().length) {
    $('#sheetBody').innerHTML = h + `<p class="empty">Koszyk jest pusty.<br>Wybierz coś pysznego z menu.</p>`;
    $('#sheetFoot').innerHTML = `<button class="btn btn-line btn-wide" type="button" onclick="document.getElementById('sheetClose').click()">Wróć do menu</button>`;
    return;
  }
  h += koszyk.map((l, i) => {
    const it = findItem(l.id, allSpecials());
    if (!it) return '';
    return `<div class="line">
      <div class="line-body" data-edit="${i}" role="button" tabindex="0"><div class="line-name">${esc(it.name)}</div><div class="line-opts">${esc(lineOpts(l, it))}</div><span class="link">Zmień</span></div>
      <div class="line-side"><span class="line-sum price">${zl(lineUnit(l) * l.qty)}</span>
        <div class="stepper sm"><button type="button" data-line="${i}" data-d="-1" aria-label="${l.qty === 1 ? 'Usuń' : 'Mniej'}">${l.qty === 1 ? '×' : '−'}</button><output>${l.qty}</output><button type="button" data-line="${i}" data-d="1" aria-label="Więcej">+</button></div>
      </div></div>`;
  }).join('');

  // Dostawa
  const L = profLoc();
  h += `<div class="sec"><div class="sec-head"><b>Dostawa</b><button class="link" type="button" data-act="edit-profile">Zmień</button></div>` + (L.office
    ? `<div class="addr"><svg><use href="#i-building"/></svg><div><b>M34 · ${floorTxt(profil.floor)} · pokój ${esc(profil.room)}</b>${esc([profil.company, profil.name].filter(Boolean).join(' · '))}${profil.company || profil.name ? '<br>' : ''}tel. ${esc(fmtPhone(profil.phone))}</div></div></div>`
    : `<div class="addr"><svg><use href="#i-${L.icon}"/></svg><div><b>${esc(L.name)}</b>Dla: ${esc(profil.name)}${profil.phone ? ' · tel. ' + esc(fmtPhone(profil.phone)) : ''}</div></div></div>`);

  // Termin
  ensureSlot();
  const days = availableDays();
  h += `<div class="sec"><div class="sec-head"><b>${timed() ? 'Na kiedy?' : 'Kiedy dowieziemy?'}</b></div>`;
  if (!server.open) {
    h += `<div class="form-err">${esc(server.message || 'W tej chwili nie przyjmujemy zamówień online. Zadzwoń: 728 343 338.')}</div>`;
  } else if (!timed()) {
    const d = asapDay();
    h += co.day
      ? `<div class="asap"><svg><use href="#i-clock"/></svg><div><b>${d === server.today ? 'Dziś' : dayLabel(d, server.today).long[0].toUpperCase() + dayLabel(d, server.today).long.slice(1)}, jak najszybciej</b><br>Przywieziemy, jak tylko obiad będzie gotowy. Godziny nie trzeba wybierać.</div></div>`
      : `<div class="form-err">Na dziś już nie zdążymy, a specjałów nie przygotujemy na jutro. Usuń specjały lub zadzwoń: 728 343 338.</div>`;
  } else {
    h += `<div class="seg" role="radiogroup">` + days.map(x => `<button type="button" role="radio" data-day="${x.d}" aria-checked="${co.day === x.d}" ${!x.slots.length || x.blocked ? 'disabled' : ''}>${dayLabel(x.d, server.today).short}</button>`).join('') + `</div>`;
    if (days[1] && days[1].blocked) h += `<p class="cat-note" style="margin:-2px 0 10px">Specjały dnia zamówisz tylko na dziś.</p>`;
    const sel = days.find(x => x.d === co.day);
    if (sel) h += `<div class="slots" role="radiogroup">` + sel.slots.map(t => `<button type="button" role="radio" data-time="${t}" aria-checked="${co.time === t}">${t}</button>`).join('') + `</div>`;
    else h += `<div class="form-err">Na dziś już nie zdążymy, a specjałów nie przygotujemy na jutro. Usuń specjały lub zadzwoń: 728 343 338.</div>`;
  }
  h += `</div>`;

  // Płatność
  h += `<div class="sec"><div class="sec-head"><b>Płatność przy odbiorze</b></div><div class="pay" role="radiogroup">
    <button type="button" role="radio" data-pay="gotowka" aria-checked="${co.payment === 'gotowka'}"><svg><use href="#i-cash"/></svg>Gotówka<span class="radio"></span></button>
    <button type="button" role="radio" data-pay="karta" aria-checked="${co.payment === 'karta'}"><svg><use href="#i-card"/></svg>Karta lub BLIK<span class="radio"></span></button>
  </div>`;
  if (co.payment === 'gotowka') {
    const tot = cartTotal();
    if (typeof co.cash === 'number' && co.cash * 100 < tot) co.cash = null;
    const noms = NOMINALY.filter(n => n * 100 > tot);
    const a = cashAmount();
    h += `<div class="cash"><b>Czy potrzebujesz reszty?</b><div class="opt-list" role="radiogroup">
      <button type="button" class="pill" role="radio" data-cash="exact" aria-checked="${co.cash === 'exact'}">Nie, mam odliczone</button>
      ${noms.map(n => `<button type="button" class="pill" role="radio" data-cash="${n}" aria-checked="${co.cash === n}">Płacę ${n} zł</button>`).join('')}
      <button type="button" class="pill" role="radio" data-cash="other" aria-checked="${co.cash === 'other'}">Inna kwota</button>
    </div>`;
    if (co.cash === 'other') h += `<div class="other"><input class="input" id="cashOther" inputmode="decimal" placeholder="np. 70" value="${esc(co.cashOther)}" aria-label="Kwota w zł"><span class="muted">zł</span></div>`;
    if (typeof a === 'number' && a >= tot) h += `<div class="change">Przygotujemy resztę: ${zl(a - tot)}</div>`;
    else if (co.cash === 'other' && co.cashOther && typeof a === 'number' && a < tot) h += `<span class="err">Kwota jest mniejsza niż ${zl(tot)}.</span>`;
    h += `</div>`;
  }
  h += `</div>`;

  h += `<div class="sec"><label class="field"><span>Uwagi do zamówienia <small>(opcj.)</small></span><textarea class="input" id="coNote" maxlength="300" rows="2" placeholder="np. proszę dzwonić z recepcji">${esc(co.note)}</textarea></label></div>`;

  h += `<div class="totals"><div><span>Dostawa</span><span>gratis</span></div><div class="grand"><span>Razem</span><span class="price">${zl(cartTotal())}</span></div></div>`;
  if (co.err) h += `<div class="form-err" id="coErr">${esc(co.err)}</div>`;
  h += `<p class="legal">Wysyłając zamówienie, zgadzasz się na kontakt telefoniczny w sprawie dostawy.</p>`;

  $('#sheetBody').innerHTML = h;
  const can = server.open && co.day && co.time && cashOk();
  $('#sheetFoot').innerHTML = `<button class="btn btn-brass btn-wide btn-split" id="orderBtn" type="button" ${can ? '' : 'disabled'}><span>${co.payment === 'gotowka' && !cashOk() ? 'Wybierz, czy potrzebujesz reszty' : 'Zamawiam'}</span><span class="price">${zl(cartTotal())}</span></button>`;
}

$('#sheetBody').addEventListener('click', e => {
  if (sheetMode !== 'cart') return;
  const t = e.target;
  const st = $('#sheetBody').scrollTop;
  const rerender = () => { renderCart(); $('#sheetBody').scrollTop = st; };
  const step = t.closest('[data-line]');
  if (step) {
    const i = +step.dataset.line; koszyk[i].qty += +step.dataset.d;
    if (koszyk[i].qty <= 0) koszyk.splice(i, 1);
    saveCart(); renderMenu(); vibrate(); rerender(); return;
  }
  const ed = t.closest('[data-edit]');
  if (ed) { const i = +ed.dataset.edit; openDish(findItem(koszyk[i].id, allSpecials()), i); return; }
  const day = t.closest('[data-day]'); if (day) { co.day = day.dataset.day; co.time = null; co.err = ''; rerender(); return; }
  const tm = t.closest('[data-time]'); if (tm) { co.time = tm.dataset.time; co.err = ''; vibrate(); rerender(); return; }
  const pay = t.closest('[data-pay]'); if (pay) { co.payment = pay.dataset.pay; store.set('tis_platnosc', co.payment); rerender(); return; }
  const cs = t.closest('[data-cash]'); if (cs) { const v = cs.dataset.cash; co.cash = (v === 'exact' || v === 'other') ? v : +v; vibrate(); rerender(); if (v === 'other') setTimeout(() => $('#cashOther') && $('#cashOther').focus(), 30); return; }
  if (t.closest('[data-act="edit-profile"]')) { closeSheet(); openStart(); }
});
$('#sheetBody').addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches('[data-edit]')) e.target.click(); });
$('#sheetBody').addEventListener('input', e => {
  if (e.target.id === 'coNote') co.note = e.target.value;
  if (e.target.id === 'cashOther') {
    co.cashOther = e.target.value;
    // odśwież tylko informację o reszcie i przycisk, bez gubienia kursora
    const box = e.target.closest('.cash'); box.querySelectorAll('.change, .err').forEach(x => x.remove());
    const a = cashAmount(), tot = cartTotal();
    if (typeof a === 'number') box.insertAdjacentHTML('beforeend', a >= tot ? `<div class="change">Przygotujemy resztę: ${zl(a - tot)}</div>` : `<span class="err">Kwota jest mniejsza niż ${zl(tot)}.</span>`);
    const can = server.open && co.day && co.time && cashOk(), b = $('#orderBtn');
    b.disabled = !can; b.firstElementChild.textContent = cashOk() ? 'Zamawiam' : 'Wybierz, czy potrzebujesz reszty';
  }
});

// Po edycji pozycji z koszyka wracamy do koszyka
const _close = closeSheet;

async function placeOrder() {
  const btn = $('#orderBtn');
  co.note = ($('#coNote') || {}).value || '';
  btn.disabled = true; btn.innerHTML = '<span class="spinner"></span><span>Wysyłamy…</span>';
  const payload = {
    m: KOD, customer: profil, day: co.day, time: co.time, payment: co.payment, note: co.note,
    cash: co.payment === 'gotowka' ? (cashAmount() === 'exact' ? 'exact' : cashAmount() / 100) : null,
    items: known().map(l => ({ id: l.id, qty: l.qty, variant: l.variant, half: l.half, dodatki: l.dodatki, surowki: l.surowki, extras: l.extras, note: l.note })),
  };
  try {
    const data = await apiPost({ a: 'order', ...payload });
    if (!data || data.error || !data.id) throw new Error((data && data.error) || 'Nie udało się wysłać zamówienia.');
    const summary = known().map(l => { const it = findItem(l.id, allSpecials()); return { name: it.name, qty: l.qty, opts: lineOpts(l, it), sum: lineUnit(l) * l.qty }; });
    store.set(K_OSTATNIE, { ...data, payment: co.payment, payLabel: data.payLabel, summary, profil, loc: server.loc, ts: Date.now() });
    koszyk = []; saveCart(); co.err = ''; co.note = '';
    _close();
    location.hash = 'status';
    openDone();
  } catch (err) {
    co.err = (err && err.message && !/fetch|network/i.test(err.message)) ? err.message : 'Brak połączenia. Sprawdź internet i spróbuj ponownie.';
    if (/odśwież menu/i.test(co.err)) await loadServer().then(() => { cleanCart(); renderMenu(); });
    if (/link/i.test(co.err) && /nieaktywny/i.test(co.err)) { closeSheet(); showLock(); return; }
    renderCart();
    const ce = $('#coErr'); ce && ce.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

// ═════════ POTWIERDZENIE ═════════
let pollT;
const STATUS_ORDER = ['nowe', 'przyjete', 'w-drodze', 'dostarczone'];
function openDone() {
  const o = store.get(K_OSTATNIE, null);
  if (!o) return openMenu();
  const p = o.profil || profil;
  const pl = o.loc || server.loc || { office: true, name: '' };
  $('#doneWhen').textContent = pl.office
    ? `Przyniesiemy na ${floorTxt(p.floor).toLowerCase()}, pokój ${p.room}, ${dayLabel(o.day, warsawNow().date).long}, ok. ${o.time}.`
    : (o.time && o.time !== ASAP) ? `Przywieziemy do: ${pl.name}, dla: ${p.name}, ${dayLabel(o.day, warsawNow().date).long}, o ${o.time}.`
    : `Przywieziemy do: ${pl.name}, dla: ${p.name}, ${dayLabel(o.day, warsawNow().date).long}, jak tylko będzie gotowe.`;
  $('#doneCode').textContent = 'Zamówienie #' + o.code;
  $('#doneSum').innerHTML = o.summary.map(s => `<div class="line"><div class="line-body"><div class="line-name">${s.qty}× ${esc(s.name)}</div>${s.opts ? `<div class="line-opts">${esc(s.opts)}</div>` : ''}</div><div class="line-side"><span class="line-sum price">${zl(s.sum)}</span></div></div>`).join('') +
    `<div class="totals" style="margin-top:4px;border-top:none"><div class="grand"><span>Razem</span><span class="price">${zl(o.total)}</span></div><div><span class="muted">${esc(o.payLabel || ((o.payment === 'karta' ? 'Karta lub BLIK' : 'Gotówka') + ' przy odbiorze'))}</span></div></div>`;
  setTrack('nowe');
  show('vDone');
  poll(o.id);
}
function setTrack(status) {
  const idx = STATUS_ORDER.indexOf(status);
  document.querySelectorAll('#track li').forEach((li, i) => { li.classList.toggle('on', i <= idx); li.classList.toggle('now', i === idx); });
  if (status === 'anulowane') $('#doneCode').textContent += ' · anulowane, zadzwoń do nas';
}
async function poll(id) {
  clearTimeout(pollT);
  try {
    const d = await apiGet({ a: 'status', id });
    if (d && d.status) { setTrack(d.status); if (d.status === 'dostarczone' || d.status === 'anulowane') return; }
  } catch { /* spróbujemy ponownie */ }
  if (!$('#vDone').hidden) pollT = setTimeout(() => poll(id), 20000);
}
$('#againBtn').addEventListener('click', () => { clearTimeout(pollT); history.replaceState(null, '', location.pathname); openMenu(); });

// ═════════ START APLIKACJI ═════════
async function loadServer() {
  if (!API_URL) { server = { ...server, open: false, message: 'Zamówienia online uruchamiamy lada dzień. Do tego czasu zamów telefonicznie: 728 343 338.' }; return 'ok'; }
  try {
    let d = null;
    if (window.__menuP) { try { d = await window.__menuP; } catch { d = null; } window.__menuP = null; }
    if (!d || (!d.locked && !d.loc)) d = await apiGet({ a: 'menu', m: KOD });
    if (d && d.locked) return 'locked';
    if (d && d.today && d.loc) { server = d; serverFresh = true; store.set(K_SERWER, { ...d, kod: KOD }); return 'ok'; }
  } catch { /* brak sieci */ }
  return 'error';
}

function route() {
  if (location.hash === '#status' && store.get(K_OSTATNIE, null)) openDone();
  else if (profilOk(profil)) openMenu();
  else openStart();
}

// Start: bez tajnego linku - ekran „tylko przez link”.
// Z linkiem: jeśli telefon pamięta dzisiejsze menu, pokazujemy je od razu, a świeże dane dociągamy w tle.
(async () => {
  if (!KOD) return show('vLock');
  // Telefon pamięta miejsce (i dane klienta) z poprzedniej wizyty → od razu menu.
  // Wczorajsze specjały chowamy, dzisiejsze dociągamy w tle.
  const cached = store.get(K_SERWER, null);
  const known = cached && cached.kod === KOD && cached.loc;
  if (known) {
    server = { ...cached };
    if (cached.today !== warsawNow().date) { server.specials = []; server.today = warsawNow().date; }
    route();
  } else {
    // Pierwsza wizyta: formularz od razu, miejsce dojedzie z Google za chwilę.
    openStart();
  }
  const res = await loadServer();
  if (res === 'locked') return showLock();
  if (res !== 'ok' && !server.loc) {
    $('#locs').innerHTML = `<div class="form-err">Nie udało się połączyć. Sprawdź internet i odśwież stronę.</div>`;
    return;
  }
  serverFresh = true;
  cleanCart(); updateCartbar();
  if (!$('#vMenu').hidden) { const y = window.scrollY; openMenuRefresh(); window.scrollTo(0, y); }
  if (!$('#vStart').hidden) { applyLoc(); if (!known && profilOk(profil)) openMenu(); }
  if (sheetMode === 'cart') renderCart();
})();
