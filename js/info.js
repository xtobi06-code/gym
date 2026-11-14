'use strict';
/* Bilder und Anleitungen: Fotos (Start- und Endposition) und Anleitung aus free-exercise-db,
   bei Bedarf aus dem Netz geladen und vom Service Worker für offline gemerkt. Dazu eigene Fotos. */

const BIB_CDN = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/';
const BIB_ID = new Map(BIBLIOTHEK.map((r) => [r[0], r]));
const BIB_NAME = new Map(BIBLIOTHEK.flatMap((r) => [[`${r[6].toLowerCase()}|${r[2]}`, r], [`${r[1].toLowerCase()}|${r[2]}`, r]]));

// Bibliothekseintrag einer Übung: über die gemerkte id oder über Name und Equipment
const bibVon = (u) => (u && !(typeof VORLAGE_INFO !== 'undefined' && VORLAGE_INFO[u.id] && VORLAGE_INFO[u.id].bild === false) && ((u.bib && BIB_ID.get(u.bib)) || BIB_NAME.get(`${u.name.toLowerCase()}|${equipVon(u)}`))) || null;
// Bild und Anleitung gibt es nur bei Einträgen aus der Datenbank; Ergänzungen haben höchstens ein ähnliches Bild
const bildId = (r) => (r ? r[5] || (r[0].startsWith('x-') ? null : r[0]) : null);
const anleitungId = (r) => (r && !r[0].startsWith('x-') ? r[0] : null);
// Animation: bei Vorlage-Übungen von Hand gewählt, sonst über den Bibliothekseintrag
function gifVon(u, r) {
  const v = u && typeof VORLAGE_INFO !== 'undefined' ? VORLAGE_INFO[u.id] : null;
  if (v && v.gif) return { url: GIF_CDN + v.gif + '.gif', aehnlich: !!v.aehnlich };
  if (u && v && v.bild === false) return null;
  const rr = r || bibVon(u);
  return rr && GIF[rr[0]] ? { url: GIF_CDN + GIF[rr[0]] + '.gif', aehnlich: GIF_AEHNLICH.has(rr[0]) } : null;
}
const bildUrl = (id, n = 0) => `${BIB_CDN}${encodeURIComponent(id)}/${n}.jpg`;

// Kleines Vorschaubild für Listen, eigenes Foto geht vor
function vorschau(u, r = null) {
  const rr = r || bibVon(u), gif = gifVon(u, rr), id = gif ? null : bildId(rr);
  const src = u && u.foto ? u.foto : gif ? gif.url : id ? bildUrl(id, 0) : '';
  return src ? `<img class="vorschau" src="${esc(src)}" alt="" loading="lazy" decoding="async" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'vorschau leer'}))">` : '<span class="vorschau leer"></span>';
}

const anleitungen = new Map();
async function anleitungLaden(id) {
  if (anleitungen.has(id)) return anleitungen.get(id);
  const r = await fetch(`${BIB_CDN}${encodeURIComponent(id)}.json`);
  if (!r.ok) throw new Error(r.status);
  const l = (await r.json()).instructions || [];
  anleitungen.set(id, l);
  return l;
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
    const id = bildId(r), equip = u ? equipVon(u) : r ? r[2] : 'sonst';
    const muskel = u ? u.muskel : r ? r[3] : '', mit = u ? u.muskeln2 || [] : r ? r[4] : [];
    let bild = '';
    const gif = gifVon(u, r);
    if (u && u.foto) bild = `<div class="ablauf eins"><img src="${esc(u.foto)}" alt="Eigenes Foto"></div>`;
    else if (gif) bild = `<div class="animation"><img src="${esc(gif.url)}" alt="Bewegungsablauf" onerror="this.parentNode.outerHTML='<p class=&quot;hinweis oben&quot;>Die Animation lädt nur mit Internet.</p>'"></div>${gif.aehnlich ? '<p class="hinweis oben">Animation einer ähnlichen Übung.</p>' : ''}`;
    else if (id) bild = `<div class="ablauf"><img src="${bildUrl(id, 0)}" alt="Startposition"><img class="zwei" src="${bildUrl(id, 1)}" alt="Endposition"></div>${r && r[5] ? '<p class="hinweis oben">Bild einer ähnlichen Übung.</p>' : ''}`;
    const g = u ? geraetVon(u) : null;
    if (!bild && u) bild = '<p class="hinweis oben">Kein passendes Bild in der Bibliothek. Mit „Eigenes Foto“ unten kannst du das Gerät selbst fotografieren.</p>';
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
    const id = anleitungId(r), el = $('#anleitung', this.b.el);
    const eigen = u && typeof VORLAGE_INFO !== 'undefined' && VORLAGE_INFO[u.id] && VORLAGE_INFO[u.id].anleitung;
    if (eigen && el) { el.innerHTML = `<div class="gruppe-titel klein">Anleitung</div><ol class="anleitung">${eigen.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>`; return; }
    if (!id || !el) return;
    el.innerHTML = '<p class="hinweis oben">Anleitung lädt …</p>';
    try {
      const l = await anleitungLaden(id);
      if (l.length) el.innerHTML = `<div class="gruppe-titel klein">Anleitung</div><ol class="anleitung">${l.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>`;
      else el.innerHTML = '';
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
