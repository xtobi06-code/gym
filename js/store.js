'use strict';
/* Daten: alles liegt im Browser-Speicher und wird über sync.js mit GitHub abgeglichen.
   Jeder Eintrag trägt eine id und u (Zeitpunkt der letzten Änderung), gelöschte ids stehen in D.weg.
   Damit lassen sich zwei Stände (Handy und Mac) eintragsweise zusammenführen. */

const LS_DATEN = 'gym-daten';
const LS_AKTIV = 'gym-aktiv';
const LISTEN = ['geraete', 'uebungen', 'plaene', 'trainings', 'maxe', 'pausen', 'einst'];

// Muskeln, nach Körperregion gegliedert
const REGIONEN = [
  ['Brust', ['Brust']],
  ['Rücken', ['Lat', 'Oberer Rücken', 'Unterer Rücken', 'Nacken']],
  ['Schultern', ['Vordere Schulter', 'Seitliche Schulter', 'Hintere Schulter']],
  ['Arme', ['Bizeps', 'Trizeps', 'Unterarme']],
  ['Rumpf', ['Bauch']],
  ['Beine', ['Quadrizeps', 'Beinbeuger', 'Gesäß', 'Adduktoren', 'Abduktoren', 'Waden']],
];
const MUSKELN = REGIONEN.flatMap(([, l]) => l);
const regionVon = (m) => (REGIONEN.find(([, l]) => l.includes(m)) || ['Sonstiges'])[0];
// Womit die Übung gemacht wird. typ ist die passende Gewichtseingabe, geraet: ob ein Studiogerät dazugehört
const EQUIP = {
  kurzhantel: { name: 'Kurzhantel', kat: 'Freihantel', typ: 'kurzhantel' },
  langhantel: { name: 'Langhantel', kat: 'Freihantel', typ: 'scheiben', stange: 20 },
  sz: { name: 'SZ-Stange', kat: 'Freihantel', typ: 'scheiben', stange: 10 },
  kettlebell: { name: 'Kettlebell', kat: 'Freihantel', typ: 'kurzhantel', stufen: '8 12 16 20 24 28 32' },
  kabel: { name: 'Kabel', kat: 'Kabel', typ: 'stack', geraet: true },
  maschine: { name: 'Maschine', kat: 'Maschinen', typ: 'stack', geraet: true },
  plate: { name: 'Plate-Loaded', kat: 'Plate-Loaded', typ: 'scheiben', stange: 0, geraet: true },
  multipresse: { name: 'Multipresse', kat: 'Maschinen', typ: 'scheiben', stange: 0, geraet: true },
  koerper: { name: 'Körpergewicht', kat: 'Körpergewicht', typ: 'koerper' },
  sonst: { name: 'Sonstiges', kat: 'Sonstiges', typ: 'frei' },
};
const TYPEN = { kurzhantel: 'Kurzhanteln', scheiben: 'Scheiben', stack: 'Steckgewicht', koerper: 'Körpergewicht', frei: 'Sonstiges' };
// Standardwerte für alles, was ein Gewicht hat: Gerät oder Freihantel-Übung
const GEWICHT_STD = { typ: 'kurzhantel', start: 5, schritt: 5, anzahl: 20, zusatz: 2.5, stufen: '', stange: 20, beidseitig: true, kmin: 2, kmax: 40, kschritt: 2 };
// Farben der Trainingstage: geprüfte Reihenfolge, auch bei Farbsehschwäche unterscheidbar
const FARBEN = ['#3987e5', '#d95926', '#199e70', '#9085e9', '#d55181', '#008300'];
const SCHEIBEN = [25, 20, 15, 10, 5, 2.5, 1.25];
const MARKEN = {
  mehr: { kurz: 'Mehr Gewicht', lang: 'Diesmal mehr Gewicht', ic: 'hoch' },
  halten: { kurz: 'Gewicht halten', lang: 'Gewicht halten', ic: 'gleich' },
  technik: { kurz: 'Technik', lang: 'Auf saubere Technik achten', ic: 'ziel' },
};

const lager = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } },
  del(k) { try { localStorage.removeItem(k); } catch { /* egal */ } },
};

function leer() {
  return { v: 1, geraete: [], uebungen: [], plaene: [], trainings: [], maxe: [], pausen: [], einst: [], weg: {} };
}
let D = { ...leer(), ...lager.get(LS_DATEN, {}) };
// Alte, gröbere Muskelgruppen auf die feinere Aufteilung abbilden
function alterMuskel(m, name) {
  if (m === 'Rücken') return /row|rudern|shrug/i.test(name) ? 'Oberer Rücken' : 'Lat';
  if (m === 'Schultern') return /seit|lateral|side/i.test(name) ? 'Seitliche Schulter' : /rear|reverse|hinter|face/i.test(name) ? 'Hintere Schulter' : 'Vordere Schulter';
  return m;
}
function migriere() {
  let n = 0;
  for (const u of D.uebungen) {
    const neu = alterMuskel(u.muskel, u.name);
    if (neu !== u.muskel) { u.muskel = neu; u.u = Date.now(); n++; }
    if (!u.equip) { u.equip = equipVon(u); u.u = Date.now(); n++; }
  }
  return n;
}


function sichern(still = false) {
  if (!lager.set(LS_DATEN, D)) toast('Speichern fehlgeschlagen, der Browser-Speicher ist voll oder gesperrt');
  if (!still) Sync.merken();
}
const finde = (liste, id) => D[liste].find((x) => x.id === id);
function setze(liste, obj) {
  obj.u = Date.now();
  const i = D[liste].findIndex((x) => x.id === obj.id);
  if (i < 0) D[liste].push(obj); else D[liste][i] = obj;
  if (liste === 'trainings') D.trainings.sort((a, b) => a.start - b.start);
  sichern();
  return obj;
}
function entferne(liste, id) {
  D[liste] = D[liste].filter((x) => x.id !== id);
  D.weg[id] = Date.now();
  sichern();
}

// Zwei Stände zusammenführen: je Eintrag gewinnt die neuere Fassung, Gelöschtes bleibt gelöscht.
function mischen(a, b) {
  const out = leer();
  out.weg = { ...(a.weg || {}) };
  for (const [k, v] of Object.entries(b.weg || {})) out.weg[k] = Math.max(out.weg[k] || 0, v);
  for (const liste of LISTEN) {
    const m = new Map();
    for (const x of [...(a[liste] || []), ...(b[liste] || [])]) {
      const alt = m.get(x.id);
      if (!alt || (x.u || 0) > (alt.u || 0)) m.set(x.id, x);
    }
    out[liste] = [...m.values()].filter((x) => !((out.weg[x.id] || 0) >= (x.u || 0)));
  }
  out.trainings.sort((x, y) => x.start - y.start);
  return out;
}
// Vergleichbare Textform eines Standes, unabhängig von der Reihenfolge
function kern(d) {
  const o = {};
  for (const liste of LISTEN) o[liste] = [...(d[liste] || [])].sort((x, y) => (x.id < y.id ? -1 : 1));
  o.weg = Object.fromEntries(Object.entries(d.weg || {}).sort(([x], [y]) => (x < y ? -1 : 1)));
  return JSON.stringify(o);
}

/* Abgeleitetes */

// Das Gerät, an dem eine Übung gemacht wird (nur wenn eines verknüpft ist)
const geraetVon = (ue) => (ue && ue.geraet ? finde('geraete', ue.geraet) || null : null);
// Woher das Gewicht kommt: vom verknüpften Gerät, sonst von der Übung selbst (Freihantel)
// Freihanteln gelten fürs ganze Studio (Mehr, Studio), damit nicht jede Übung den Hantelbereich einzeln braucht
const HANTEL_STD = { kmin: 2, kmax: 40, kschritt: 2, stufen: '', stange: 20, sz: 10 };
const hantelEinst = () => ({ ...HANTEL_STD, ...((D.einst.find((x) => x.id === 'einst') || {}).hantel || {}) });
function gewichtVon(ue) {
  const g = geraetVon(ue);
  if (g) return g;
  if (!ue) return null;
  const e = equipVon(ue), h = hantelEinst();
  if (e === 'kurzhantel') return { typ: 'kurzhantel', kmin: h.kmin, kmax: h.kmax, kschritt: h.kschritt, stufen: h.stufen };
  if (e === 'langhantel') return { typ: 'scheiben', stange: h.stange, beidseitig: true };
  if (e === 'sz') return { typ: 'scheiben', stange: h.sz, beidseitig: true };
  return ue.typ ? ue : null;
}
// Bei Körpergewichtsübungen ist das eingetragene Gewicht ein Zusatz, deshalb mit Pluszeichen
const vz = (ueId) => { const g = gewichtVon(finde('uebungen', ueId)); return g && g.typ === 'koerper' ? '+' : ''; };
// Gliederung im Studio, abgeleitet aus Equipment und Gerät
const KATEGORIEN = ['Freihantel', 'Kabel', 'Maschinen', 'Plate-Loaded', 'eGym', 'Körpergewicht', 'Sonstiges'];
const katVonGeraet = (g) => (/egym/i.test(g.marke || '') ? 'eGym' : g.typ === 'scheiben' ? 'Plate-Loaded' : g.typ === 'koerper' ? 'Körpergewicht' : g.typ === 'kurzhantel' ? 'Freihantel' : /kabel|seil|cable/i.test(g.name) ? 'Kabel' : 'Maschinen');
function katVon(ue) {
  const g = geraetVon(ue);
  if (g && /egym/i.test(g.marke || '')) return 'eGym';
  return EQUIP[equipVon(ue)].kat;
}
// Equipment einer Übung, auch für ältere Einträge ohne das Feld
function equipVon(ue) {
  if (!ue) return 'sonst';
  if (ue.equip && EQUIP[ue.equip]) return ue.equip;
  const g = geraetVon(ue), typ = g ? g.typ : ue.typ;
  if (g) return typ === 'scheiben' ? 'plate' : typ === 'koerper' ? 'koerper' : typ === 'kurzhantel' ? 'kurzhantel' : /kabel|seil|cable/i.test(g.name) ? 'kabel' : 'maschine';
  return { kurzhantel: 'kurzhantel', scheiben: 'langhantel', koerper: 'koerper', stack: 'maschine' }[typ] || 'sonst';
}
// Kurzer Hinweis, wo oder womit die Übung gemacht wird
function ortVon(ue) {
  if (!ue) return '';
  const g = geraetVon(ue);
  const e = EQUIP[equipVon(ue)].name;
  const arm = ue.einarmig ? 'einarmig' : '';
  if (g) return [g.name === ue.name ? e : g.name, g.bereich, arm].filter(Boolean).join(', ');
  return [e, arm].filter(Boolean).join(', ');
}

// Wählbare Gewichte eines Geräts (Steckgewicht oder Kurzhanteln)
function stufenVon(g) {
  if (g.stufen) {
    const l = String(g.stufen).split(/[;\s]+|,(?=\s)/).map(zahl).filter((n) => n != null && n >= 0);
    if (l.length) return [...new Set(l)].sort((x, y) => x - y);
  }
  const out = [];
  if (g.typ === 'kurzhantel') {
    const von = g.kmin ?? 2, bis = g.kmax ?? 40, schritt = g.kschritt > 0 ? g.kschritt : 2;
    for (let w = von; w <= bis + 1e-9 && out.length < 80; w += schritt) out.push(Math.round(w * 100) / 100);
  } else {
    const start = g.start ?? 5, schritt = g.schritt > 0 ? g.schritt : 5, n = Math.min(60, Math.max(1, g.anzahl || 20));
    for (let i = 0; i < n; i++) out.push(Math.round((start + i * schritt) * 100) / 100);
  }
  return out;
}
function typText(g) {
  if (g.typ === 'stack' || g.typ === 'kurzhantel') {
    const s = stufenVon(g);
    return `${TYPEN[g.typ]} ${kg(s[0])} bis ${kg(s[s.length - 1])} kg`;
  }
  if (g.typ === 'scheiben') return `Scheiben, leer ${kg(g.stange ?? 20)} kg`;
  return TYPEN[g.typ] || '';
}

// Geschätztes Maximum für eine Wiederholung (Epley). Sätze über 12 Wiederholungen sind dafür zu ungenau.
function e1rm(g, w) {
  if (!(g > 0) || !(w > 0) || w > 12) return 0;
  return w === 1 ? g : g * (1 + w / 30);
}

// Letztes Training, in dem die Übung gemacht wurde (vor dem Zeitpunkt "vor")
function letztes(ueId, vor = Infinity) {
  for (let i = D.trainings.length - 1; i >= 0; i--) {
    const t = D.trainings[i];
    if (t.start >= vor) continue;
    const p = t.punkte.find((x) => x.ue === ueId && arbeitsSaetze(x).length);
    if (p) return { t, p: { ...p, saetze: arbeitsSaetze(p) } };   // Vorlage fürs nächste Mal: nur Arbeitssätze
  }
  return null;
}

// Je Training der beste Satz einer Übung, zeitlich aufsteigend
function verlauf(ueId) {
  const rows = [];
  for (const t of D.trainings) {
    const p = t.punkte.find((x) => x.ue === ueId && arbeitsSaetze(x).length);
    if (!p) continue;
    const arbeit = arbeitsSaetze(p);
    let best = null;
    for (const s of arbeit) {
      const e = e1rm(s.g, s.w);
      if (!best || e > best.e || (e === best.e && (s.g > best.g || (s.g === best.g && s.w > best.w)))) best = { e, g: s.g, w: s.w };
    }
    rows.push({ ts: t.start, tid: t.id, ...best, wmax: Math.max(...arbeit.map((s) => s.w || 0)) });
  }
  return rows;
}

// Aufwärmsätze werden gespeichert, zählen aber in keiner Statistik mit
const volumen = (t) => t.punkte.reduce((sum, p) => sum + arbeitsSaetze(p).reduce((s, x) => s + (x.g || 0) * (x.w || 0), 0), 0);
const satzZahl = (t) => t.punkte.reduce((sum, p) => sum + arbeitsSaetze(p).length, 0);

/* Splits: Trainingstage gehören zu einem Split, einer davon ist gerade aktiv */
// Split-Namen gibt es nur in Großbuchstaben, so lassen sich "ppl" und "PPL" nicht verwechseln
const splitKey = (s) => String(s || '').trim().toUpperCase();
const splitsVon = () => [...new Set(D.plaene.map((p) => splitKey(p.split)))];
const splitName = (s) => (s || 'Ohne Split').toUpperCase();
function aktiverSplit() {
  const liste = splitsVon(), e = D.einst.find((x) => x.id === 'einst');
  return e && liste.includes(splitKey(e.aktiv)) ? splitKey(e.aktiv) : (liste[0] ?? '');
}

/* Wochen: eine Woche zählt, wenn du mindestens einmal trainiert hast. Pausenwochen (krank, Urlaub) zählen nicht und brechen die Serie nicht. */
const wocheVon = (ts) => { const d = new Date(tagStart(ts)); const wt = (d.getDay() + 6) % 7; return Math.round((d.getTime() - wt * TAG) / TAG / 7); };
const istPause = (w) => D.pausen.some((p) => p.woche === w);
function serie() {
  const aktiv = new Set(D.trainings.map((t) => wocheVon(t.start)));
  let n = 0, w = wocheVon(Date.now());
  if (!aktiv.has(w)) w--;   // die laufende Woche darf noch offen sein
  for (let i = 0; i < 2000; i++, w--) {
    if (aktiv.has(w)) n++;
    else if (!istPause(w)) break;
  }
  return n;
}

/* Laufendes Training: liegt getrennt und wird nicht synchronisiert, bis es beendet ist */
const Aktiv = {
  t: lager.get(LS_AKTIV, null),
  sichern() { if (this.t) lager.set(LS_AKTIV, this.t); else lager.del(LS_AKTIV); },

  starte(planId) {
    const plan = planId ? finde('plaene', planId) : null;
    this.t = {
      id: neuId(), plan: plan ? plan.id : '', name: plan ? plan.name.toUpperCase() : 'FREIES TRAINING', farbe: plan ? plan.farbe : -1,
      start: Date.now(), pause: 0, punkte: [],
    };
    if (plan) for (const pp of plan.punkte) if (finde('uebungen', pp.ue)) this.t.punkte.push(this.punkt(pp.ue, pp.saetze, pp.wmin, pp.wmax, pp.warm ? (pp.warmN || aufwaermAnzahl()) : 0));
    this.sichern();
  },

  // Neue Übung im laufenden Training, vorbelegt mit den Werten vom letzten Mal
  punkt(ueId, saetze = 3, wmin = null, wmax = null, warm = false) {
    const alt = letztes(ueId, this.t.start);
    const liste = [];
    for (let i = 0; i < saetze; i++) {
      const a = alt ? alt.p.saetze[Math.min(i, alt.p.saetze.length - 1)] : null;
      liste.push(a ? { g: a.g, w: a.w, ok: false, ...(a.sch ? { sch: [...a.sch] } : {}), ...(a.zu ? { zu: 1 } : {}) } : { g: null, w: null, ok: false });
    }
    const p = { ue: ueId, wmin, wmax, saetze: liste };
    if (warm) p.saetze.unshift(...Array.from({ length: warm === true ? aufwaermAnzahl() : warm }, () => ({ ...aufwaermSatz(finde('uebungen', ueId), liste[0] && liste[0].g), w: 10, ok: false, auf: 1 })));
    return p;
  },
};

// Anzahl Aufwärmsätze pro Übung, einstellbar unter Mehr (Standard 1)
const aufwaermAnzahl = () => { const e = D.einst.find((x) => x.id === 'einst'); return e && e.aufwaerm === 2 ? 2 : 1; };

// Aufwärmsatz: etwa 45 bis 50 % vom ersten Arbeitsgewicht, gerundet auf das, was es am Gerät wirklich gibt
function aufwaermSatz(ue, arbeit) {
  const g = gewichtVon(ue), typ = g ? g.typ : 'frei';
  if (arbeit == null) return { g: null };
  if (!(arbeit > 0) || typ === 'koerper') return { g: 0 };
  const ziel = arbeit * 0.475;
  if (typ === 'stack' || typ === 'kurzhantel') {
    const st = stufenVon(g);
    return { g: st.reduce((b, w) => (Math.abs(w - ziel) < Math.abs(b - ziel) ? w : b), st[0]) };
  }
  if (typ === 'scheiben') {
    const stange = g.stange ?? 20, mult = g.beidseitig === false ? 1 : 2;
    let rest = Math.max(0, Math.round((ziel - stange) / mult / 1.25) * 1.25);
    const sch = [];
    for (const w of SCHEIBEN) while (rest >= w - 1e-9) { sch.push(w); rest -= w; }
    return { g: stange + mult * sch.reduce((a, b) => a + b, 0), sch };
  }
  return { g: Math.round(ziel / 2.5) * 2.5 };
}
// Anzeige der Satznummer: Aufwärmsätze heißen W, Arbeitssätze zählen ab 1
function satzLabel(p, si) {
  if (p.saetze[si].auf) return 'W';
  return String(p.saetze.slice(0, si + 1).filter((s) => !s.auf).length);
}
const arbeitsSaetze = (p) => p.saetze.filter((s) => !s.auf);
const pauseVon = (ueId) => { const u = finde('uebungen', ueId); return (u && u.pause) || 120; };

if (migriere()) lager.set(LS_DATEN, D);
