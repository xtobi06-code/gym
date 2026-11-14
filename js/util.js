'use strict';
/* Kleine Helfer, Symbole und Formatierung */

// Aktionen (data-akt) und Eingaben (data-ein): jede Datei hängt ihre Funktionen hier ein
const Akt = {}, Ein = {};

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const neuId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

// Zahl aus einer Eingabe lesen (Komma oder Punkt). Gibt null zurück, wenn nichts Brauchbares dasteht.
const zahl = (s) => {
  const n = parseFloat(String(s ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};
const kg = (n) => (n == null ? '–' : (Math.round(n * 100) / 100).toLocaleString('de-DE', { maximumFractionDigits: 2 }));
const rund1 = (n) => (Math.round(n * 10) / 10).toLocaleString('de-DE', { maximumFractionDigits: 1 });

const TAG = 86400000;
const tagStart = (ts) => { const d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime(); };
const tagKey = (ts) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const fmtLang = new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
const fmtKurz = new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'short' });
const fmtMitJahr = new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'short', year: 'numeric' });
const fmtWochentag = new Intl.DateTimeFormat('de-DE', { weekday: 'short', day: 'numeric', month: 'short' });
const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

function vorWieLang(ts) {
  const tage = Math.round((tagStart(Date.now()) - tagStart(ts)) / TAG);
  if (tage <= 0) return 'heute';
  if (tage === 1) return 'gestern';
  if (tage < 14) return `vor ${tage} Tagen`;
  if (tage < 60) return `vor ${Math.round(tage / 7)} Wochen`;
  return `vor ${Math.round(tage / 30)} Monaten`;
}
function dauer(ms) {
  const min = Math.max(0, Math.round(ms / 60000));
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')} min`;
}
function uhr(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  return (h ? `${h}:${String(m).padStart(2, '0')}` : `${m}`) + `:${String(r).padStart(2, '0')}`;
}

/* Symbole: einfache Linien, 24er Raster */
const SYMBOLE = {
  hantel: 'M6.5 7v10M3.5 9.5v5M17.5 7v10M20.5 9.5v5M6.5 12h11',
  studio: 'M4 5h7v6H4zM13 5h7v6h-7zM4 13h7v6H4zM13 13h7v6h-7z',
  verlauf: 'M4 5v14h16M8 15l3.5-4.5 3 2.5L19 7',
  mehr: 'M4 7h9M17 7h3M4 17h3M11 17h9M15 5.2a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6zM9 15.2a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6z',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  chevR: 'M9 5l7 7-7 7',
  chevL: 'M15 5l-7 7 7 7',
  chevD: 'M5 9l7 7 7-7',
  chevU: 'M5 15l7-7 7 7',
  x: 'M6 6l12 12M18 6L6 18',
  hoch: 'M12 19V5M6 11l6-6 6 6',
  gleich: 'M6 9h12M6 15h12',
  ziel: 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  notiz: 'M5 4h14v11l-5 5H5zM14 20v-5h5',
  muell: 'M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13',
  wolke: 'M7.5 18a4 4 0 0 1-.6-7.9A6 6 0 0 1 18.4 9.6 4.3 4.3 0 0 1 17.5 18z',
  play: 'M8 5.5v13l11-6.5z',
  suche: 'M11 4.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM20 20l-4.2-4.2',
  flamme: 'M12 3c.6 3.2 4.5 5.2 4.5 9.8a4.5 4.5 0 0 1-9 0c0-2 .9-3.4 2-4.3.1 1.6.8 2.4 1.6 2.6C11.7 8.9 10.9 6 12 3z',
  punkte: 'M5.5 12h.01M12 12h.01M18.5 12h.01',
  tausch: 'M7 4L3.5 7.5 7 11M3.5 7.5H17M17 13l3.5 3.5L17 20M20.5 16.5H7',
  kamera: 'M4 8h3l2-2.5h6L17 8h3v11H4zM12 10.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z',
  info: 'M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17zM12 11v5.5M12 7.8v.01',
  stern: 'M12 4l2.4 5 5.6.7-4.1 3.8 1 5.5L12 16.3 7.1 19l1-5.5L4 9.7 9.6 9z',
};
const GEFUELLT = new Set(['play']);
function ic(name, groesse = 22) {
  const voll = GEFUELLT.has(name);
  return `<svg class="ic" width="${groesse}" height="${groesse}" viewBox="0 0 24 24" fill="${voll ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="${voll ? 1.5 : name === 'punkte' ? 3.2 : 2}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${SYMBOLE[name] || ''}"/></svg>`;
}

/* Textfelder wachsen mit ihrem Inhalt */
function wachse(ta) {
  ta.style.height = 'auto';
  ta.style.height = ta.scrollHeight + 'px';
}

let toastTimer = null;
let toastRueck = null;
function toast(text, rueck = null) {
  const t = $('#toast');
  toastRueck = rueck;
  t.innerHTML = rueck ? `${esc(text)}<button class="toast-knopf" data-akt="toastRueck">Rückgängig</button>` : '';
  if (!rueck) t.textContent = text;
  t.classList.add('an');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.classList.remove('an'); toastRueck = null; }, rueck ? 6000 : 2600);
}
