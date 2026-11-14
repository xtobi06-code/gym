'use strict';
/* Bilder und Anleitungen aus RepDB (repdb.co, freie Version): einheitliche Illustrationen in Start- und Endposition,
   deutsche Beschreibung, Anleitung und Tipps. Bilder kommen bei Bedarf aus dem Netz und werden für offline gemerkt. */

const BIB_CDN = 'https://cdn.jsdelivr.net/gh/sergei-argutin/exercise-dataset@main/images/flat/';
const BIB_ID = new Map(BIBLIOTHEK.map((r) => [r[0], r]));
const BIB_NAME = new Map(BIBLIOTHEK.flatMap((r) => [[`${r[6].toLowerCase()}|${r[2]}`, r], [`${r[1].toLowerCase()}|${r[2]}`, r]]));
const vorlageInfo = (u) => (u && typeof VORLAGE_INFO !== 'undefined' ? VORLAGE_INFO[u.id] || null : null);

// Bibliothekseintrag einer Übung: Vorlage, gemerkte id (auch aus der früheren Bibliothek) oder Name und Equipment
function bibVon(u) {
  if (!u) return null;
  const v = vorlageInfo(u);
  if (v) return BIB_ID.get(v.bib) || null;
  if (u.bib) { const r = BIB_ID.get(u.bib) || BIB_ID.get(BIB_ALT[u.bib]); if (r) return r; }
  return BIB_NAME.get(`${u.name.toLowerCase()}|${equipVon(u)}`) || null;
}
const istAehnlich = (u) => !!(vorlageInfo(u) || {}).aehnlich;
const bildUrl = (r, pose) => `${BIB_CDN}${encodeURIComponent(r[0])}-${pose}.webp`;
const posen = (r) => (r[5] === 'sp' ? ['start', 'peak'] : ['main']);

// Kleines Vorschaubild für Listen, eigenes Foto geht vor
function vorschau(u, r = null) {
  const rr = r || bibVon(u);
  const src = u && u.foto ? u.foto : rr ? bildUrl(rr, posen(rr)[0]) : '';
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
    if (u && u.foto) bild = `<div class="ablauf eins"><img src="${esc(u.foto)}" alt="Eigenes Foto"></div>`;
    else if (r) {
      const p = posen(r);
      bild = `<div class="ablauf${p.length === 1 ? ' eins' : ''}">${p.map((x, i) => `<img${i ? ' class="zwei"' : ''} src="${bildUrl(r, x)}" alt="${i ? 'Endposition' : 'Startposition'}">`).join('')}</div>${istAehnlich(u) ? '<p class="hinweis oben">Bild und Anleitung einer ähnlichen Übung.</p>' : ''}`;
    }
    const g = u ? geraetVon(u) : null;
    return `${bild}
      <div class="info-zeile"><span class="chip klein">${esc(EQUIP[equip].name)}</span>${g ? `<span class="chip klein">${esc(g.name)}</span>` : ''}</div>
      <div class="gruppe-titel klein">Muskeln</div>
      <div class="muskelchips"><span class="chip klein an">${esc(muskel)}</span>${mit.map((m) => `<span class="chip klein">${esc(m)}</span>`).join('')}</div>
      ${u && u.notiz ? `<div class="gruppe-titel klein">Deine Notiz</div><p class="info-text">${esc(u.notiz)}</p>` : ''}
      <div id="anleitung"></div>
      ${u ? `<div class="knopfzeile">
        <label class="knopf zweit">${ic('kamera', 18)} ${u.foto ? 'Foto ersetzen' : 'Eigenes Foto'}<input type="file" accept="image/*" data-ein="fotoWahl" hidden></label>
        ${u.foto ? `<button class="knopf zweit" data-akt="fotoWeg">Foto entfernen</button>` : ''}</div>
        <p class="hinweis">Ein eigenes Foto, zum Beispiel vom Gerät oder der Einstellung, ersetzt das Bild aus der Bibliothek.</p>` : ''}`;
  },
  async anleitung() {
    const u = this.ueId ? finde('uebungen', this.ueId) : null, r = this.bibId ? BIB_ID.get(this.bibId) : bibVon(u);
    const el = $('#anleitung', this.b.el), eigen = (vorlageInfo(u) || {}).anleitung;
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

// Eigenes Foto: verkleinert gespeichert, damit Sync-Datei und Browser-Speicher klein bleiben
function fotoVerkleinern(datei, max = 640) {
  return new Promise((ok, fehler) => {
    const url = URL.createObjectURL(datei), img = new Image();
    img.onload = () => {
      const f = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * f); c.height = Math.round(img.height * f);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      ok(c.toDataURL('image/jpeg', 0.72));
    };
    img.onerror = () => { URL.revokeObjectURL(url); fehler(new Error('Bild nicht lesbar')); };
    img.src = url;
  });
}

Object.assign(Akt, {
  ueInfo(el, e) { if (e) e.stopPropagation(); UeInfo.auf({ ueId: el.dataset.id }); },
  bibInfo(el) { UeInfo.auf({ bibId: el.dataset.id }); },
  infoUebernehmen() { const id = UeInfo.bibId; UeInfo.b.zu(); Akt.bibWahl({ dataset: { id } }); },
  infoBearbeiten() { const id = UeInfo.ueId; UeInfo.b.zu(); UeEd.auf(id); },
  fotoWeg() {
    const u = finde('uebungen', UeInfo.ueId);
    if (!u) return;
    delete u.foto; setze('uebungen', u);
    UeInfo.b.setze(UeInfo.html()); UeInfo.anleitung(); zeichne(); if (Aktiv.t && !$('#live').hidden) Live.zeichne();
  },
});
Object.assign(Ein, {
  async fotoWahl(el) {
    const datei = el.files && el.files[0], u = finde('uebungen', UeInfo.ueId);
    if (!datei || !u) return;
    try {
      u.foto = await fotoVerkleinern(datei);
      setze('uebungen', u);
      UeInfo.b.setze(UeInfo.html()); UeInfo.anleitung(); zeichne(); if (Aktiv.t && !$('#live').hidden) Live.zeichne();
    } catch { toast('Das Foto ließ sich nicht lesen'); }
  },
});
