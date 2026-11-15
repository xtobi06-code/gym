'use strict';
/* Bilder und Anleitungen aus RepDB (repdb.co, freie Version): einheitliche Illustrationen in Start- und Endposition,
   deutsche Beschreibung, Anleitung und Tipps. Bilder kommen bei Bedarf aus dem Netz und werden für offline gemerkt. */

const BIB_CDN = 'https://cdn.jsdelivr.net/gh/sergei-argutin/exercise-dataset@main/images/flat/';
const BIB_ID = new Map(BIBLIOTHEK.map((r) => [r[0], r]));
const BIB_NAME = new Map(BIBLIOTHEK.flatMap((r) => [[`${r[6].toLowerCase()}|${r[2]}`, r], [`${r[1].toLowerCase()}|${r[2]}`, r]]));
const vorlageInfo = (u) => (u && typeof VORLAGE_INFO !== 'undefined' ? VORLAGE_INFO[u.id] || null : null);

// Selbst gewählter Bibliothekseintrag (auch ids aus der früheren Bibliothek)
function bibEigen(u) {
  if (!u || !u.bib) return null;
  return BIB_ID.get(u.bib) || BIB_ID.get(BIB_ALT[u.bib]) || null;
}
// Bibliothekseintrag einer Übung: zuerst das selbst gewählte Bild, dann die Vorlage, sonst Name und Equipment
function bibVon(u) {
  if (!u) return null;
  const e = bibEigen(u);
  if (e) return e;
  const v = vorlageInfo(u);
  if (v) return BIB_ID.get(v.bib) || null;
  return BIB_NAME.get(`${u.name.toLowerCase()}|${equipVon(u)}`) || null;
}
// Gilt für die Übung noch das Bild der Vorlage (nichts Eigenes gewählt)?
function vorlageGilt(u) {
  const v = vorlageInfo(u), e = bibEigen(u);
  return !!v && (!e || e[0] === v.bib);
}
const istAehnlich = (u) => vorlageGilt(u) && !!vorlageInfo(u).aehnlich;
const bildUrl = (r, pose) => `${BIB_CDN}${encodeURIComponent(r[0])}-${pose}.webp`;
const posen = (r) => (r[5] === 'sp' ? ['start', 'peak'] : ['main']);

// Kleines Vorschaubild für Listen
function vorschau(u, r = null) {
  const rr = r || bibVon(u);
  const src = rr ? bildUrl(rr, posen(rr)[0]) : '';
  return src ? `<img class="vorschau" src="${esc(src)}" alt="" loading="lazy" decoding="async" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'vorschau leer'}))">` : '<span class="vorschau leer"></span>';
}

// Beschreibung, Anleitung und Tipps liegen in einer Datei, die erst beim ersten Öffnen geladen wird
let bibDetails = null;
async function detailsLaden(id) {
  if (!bibDetails) {
    const r = await fetch('daten/uebungen.json');
    if (!r.ok) throw new Error(r.status);
    bibDetails = await r.json();
  }
  return bibDetails[id] || null;
}

/* Ansicht einer Übung: Bild im Wechsel wie ein kurzes Video, Muskeln, Anleitung.
   Entweder eine eigene Übung (ueId) oder ein Bibliothekseintrag zum Übernehmen (bibId). */
const UeInfo = {
  b: null, ueId: null, bibId: null,
  auf({ ueId = null, bibId = null } = {}) {
    this.ueId = ueId; this.bibId = bibId;
    const u = ueId ? finde('uebungen', ueId) : null, r = bibId ? BIB_ID.get(bibId) : bibVon(u);
    const titel = u ? u.name : r ? r[1] : 'Übung';
    this.b = Blatt.auf({ titel, voll: true, html: this.html(), neu: () => this.html(),
      aktion: bibId && !u ? { text: 'Übernehmen', akt: 'infoUebernehmen' } : u ? { text: 'Bearbeiten', akt: 'infoBearbeiten' } : null });
    this.anleitung();
  },
  html() {
    const u = this.ueId ? finde('uebungen', this.ueId) : null, r = this.bibId ? BIB_ID.get(this.bibId) : bibVon(u);
    const equip = u ? equipVon(u) : r ? r[2] : 'sonst';
    const muskel = u ? u.muskel : r ? r[3] : '', mit = u ? u.muskeln2 || [] : r ? r[4] : [];
    let bild = '';
    if (r) {
      const p = posen(r);
      bild = `<div class="ablauf${p.length === 1 ? ' eins' : ''}">${p.map((x, i) => `<img${i ? ' class="zwei"' : ''} src="${bildUrl(r, x)}" alt="${i ? 'Endposition' : 'Startposition'}">`).join('')}</div>${istAehnlich(u) ? '<p class="hinweis oben">Bild und Anleitung einer ähnlichen Übung.</p>' : ''}`;
    }
    const g = u ? geraetVon(u) : null;
    return `${bild}
      <div class="info-zeile"><span class="chip klein">${esc(EQUIP[equip].name)}</span>${g ? `<span class="chip klein">${esc(g.name)}</span>` : ''}</div>
      <div class="gruppe-titel klein">Muskeln</div>
      <div class="muskelchips"><span class="chip klein an">${esc(muskel)}</span>${mit.map((m) => `<span class="chip klein">${esc(m)}</span>`).join('')}</div>
      ${u && u.notiz ? `<div class="gruppe-titel klein">Deine Notiz</div><p class="info-text">${esc(u.notiz)}</p>` : ''}
      <div id="anleitung"></div>`;
  },
  async anleitung() {
    const u = this.ueId ? finde('uebungen', this.ueId) : null, r = this.bibId ? BIB_ID.get(this.bibId) : bibVon(u);
    const el = $('#anleitung', this.b.el), eigen = vorlageGilt(u) ? vorlageInfo(u).anleitung : null;
    if (!el) return;
    const liste = (titel, l, tag = 'ol') => (l && l.length ? `<div class="gruppe-titel klein">${titel}</div><${tag} class="anleitung">${l.map((x) => `<li>${esc(x)}</li>`).join('')}</${tag}>` : '');
    if (eigen) { el.innerHTML = liste('Anleitung', eigen); return; }
    if (!r) return;
    el.innerHTML = '<p class="hinweis oben">Anleitung lädt …</p>';
    try {
      const d = await detailsLaden(r[0]);
      el.innerHTML = d ? `${d.b ? `<p class="info-text">${esc(d.b)}</p>` : ''}${liste('Anleitung', d.a)}${liste('Tipps', d.t, 'ul')}` : '';
    } catch { el.innerHTML = '<p class="hinweis oben">Die Anleitung lädt nur mit Internet.</p>'; }
  },

};

Object.assign(Akt, {
  ueInfo(el, e) { if (e) e.stopPropagation(); UeInfo.auf({ ueId: el.dataset.id }); },
  bibInfo(el) { UeInfo.auf({ bibId: el.dataset.id }); },
  infoUebernehmen() { const id = UeInfo.bibId; UeInfo.b.zu(); Akt.bibWahl({ dataset: { id } }); },
  infoBearbeiten() { const id = UeInfo.ueId; UeInfo.b.zu(); UeEd.auf(id); },
});
