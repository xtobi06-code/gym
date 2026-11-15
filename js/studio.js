'use strict';
/* Studio-Reiter: welche Geräte gibt es, wo stehen sie, und welche Übungen machst du daran. */

const ui = { kat: 'alle', studio: 'uebungen', fortschritt: 'kalender', jahr: new Date().getFullYear() };

function segment(name, werte) {
  return `<div class="segment" role="tablist">${werte.map(([v, t]) => `<button class="${ui[name] === v ? 'an' : ''}" data-akt="seg" data-name="${name}" data-v="${v}" role="tab" aria-selected="${ui[name] === v}">${esc(t)}</button>`).join('')}</div>`;
}
Akt.seg = (el) => { ui[el.dataset.name] = el.dataset.v; zeichne(); };

function zeigeStudio() {
  let h = kopf('Studio') + segment('studio', [['uebungen', 'Übungen'], ['geraete', 'Geräte']]);
  if (ui.studio === 'geraete') {
    if (!D.geraete.length) {
      h += `<div class="leer"><h2>Noch keine Geräte</h2><p>Geräte brauchst du nur für Maschinen mit eigener Einstellung, etwa Steckgewicht oder Sitzhöhe. Kurzhantel- und Langhantelübungen legst du direkt unter Übungen an.</p>
        <div class="knopfzeile"><button class="knopf haupt" data-akt="geraetNeu">${ic('plus', 18)} Gerät</button></div></div>`;
    } else {
      const m = new Map();
      for (const g of D.geraete) { const k = katVonGeraet(g); if (!m.has(k)) m.set(k, []); m.get(k).push(g); }
      const bereiche = [...m.entries()].sort((a, b) => KATEGORIEN.indexOf(a[0]) - KATEGORIEN.indexOf(b[0]));
      h += bereiche.map(([b, liste]) => `<div class="gruppe-titel">${esc(b)}<span class="zahl-klein">${liste.length}</span></div><div class="liste">${liste.sort((x, y) => x.name.localeCompare(y.name, 'de')).map((g) => {
        const n = D.uebungen.filter((u) => u.geraet === g.id).length;
        return `<button class="zeile" data-akt="geraetAuf" data-id="${g.id}" data-wisch="geraete"><div class="haupt"><b>${esc(g.name)}</b><small>${esc([typText(g), g.bereich].filter(Boolean).join(', '))}</small></div><span class="neben">${n ? n + (n === 1 ? ' Übung' : ' Übungen') : ''}</span>${ic('chevR', 16)}</button>`;
      }).join('')}</div>`).join('');
      h += `<button class="knopf zweit breit" data-akt="geraetNeu">${ic('plus', 18)} Gerät eintragen</button>`;
    }
  } else {
    if (!D.uebungen.length) {
      h += `<div class="leer"><h2>Noch keine Übungen</h2><p>Übernimm die bekannten Maschinen aus dem AlphaClub oder such dir Übungen aus der Bibliothek mit rund 600 Einträgen.</p>
        <div class="knopfzeile"><button class="knopf haupt" data-akt="ueBib">${ic('suche', 18)} Bibliothek</button></div></div>`;
    } else {
      const vorhanden = KATEGORIEN.filter((k) => D.uebungen.some((u) => katVon(u) === k));
      if (ui.kat !== 'alle' && !vorhanden.includes(ui.kat)) ui.kat = 'alle';
      h += `<div class="chipleiste">${['alle', ...vorhanden].map((k) => `<button class="chip ${ui.kat === k ? 'an' : ''}" data-akt="studioKat" data-k="${k}" aria-pressed="${ui.kat === k}">${k === 'alle' ? 'Alle' : k}</button>`).join('')}</div>`;
      h += `<label class="suchfeld">${ic('suche', 18)}<input data-ein="studioSuche" placeholder="Übung suchen" value="${esc(ui.suche || '')}" enterkeyhint="search" autocomplete="off" aria-label="Übung suchen"></label>
        <div id="studio-liste">${uebungsListe(studioTreffer())}</div>
        <button class="knopf haupt breit" data-akt="ueBib">${ic('suche', 18)} Aus der Bibliothek hinzufügen</button>
        <button class="knopf zweit breit" data-akt="ueNeu">${ic('plus', 18)} Eigene Übung anlegen</button>`;
    }
  }
  return h;
}
function studioTreffer() {
  const f = (ui.suche || '').trim().toLowerCase();
  return D.uebungen.filter((u) => (ui.kat === 'alle' || katVon(u) === ui.kat) && (!f || u.name.toLowerCase().includes(f) || (u.muskel || '').toLowerCase().includes(f)));
}
Akt.studioKat = (el) => { ui.kat = el.dataset.k; zeichne(); };
function uebungsListe(treffer) {
  if (!treffer.length) return `<p class="hinweis oben">Keine Übung passt zur Suche.</p>`;
  return nachMuskel(treffer).map(([mk, liste]) => `<div class="gruppe-titel">${esc(mk)}<span class="zahl-klein">${liste.length}</span></div><div class="liste">${liste.map((u) => {
    const o = ortVon(u);
    return `<button class="zeile mitbild" data-akt="ueInfo" data-id="${u.id}" data-wisch="uebungen">${vorschau(u)}<div class="haupt"><b>${esc(u.name)}</b>${o ? `<small>${esc(o)}</small>` : ''}</div>${u.notiz ? `<span class="neben">${ic('notiz', 16)}</span>` : ''}${ic('chevR', 16)}</button>`;
  }).join('')}</div>`).join('');
}
Object.assign(Ein, {
  studioSuche(el) {
    ui.suche = el.value;
    $('#studio-liste').innerHTML = uebungsListe(studioTreffer());
  },
});

/* Gewichtsart und Einstellungen: gleich für Geräte und für Freihantel-Übungen.
   p ist das Kürzel der Eingabe-Funktionen (g für Gerät, u für Übung). */
function gewichtHtml(o, p) {
  return `<div class="typwahl">${Object.entries(TYPEN).map(([k, t]) => `<button class="chip ${o.typ === k ? 'an' : ''}" data-akt="${p}Typ" data-typ="${k}" aria-pressed="${o.typ === k}">${t}</button>`).join('')}</div>${gewichtFelder(o, p)}`;
}
function gewichtFelder(o, p) {
  let typFelder = '';
  if (o.typ === 'stack') typFelder = `<div class="gruppe">
      ${zahlfeld('Oberste Platte', `data-ein="${p}Feld" data-f="start"`, o.start, 'kg')}
      ${zahlfeld('Schritt je Platte', `data-ein="${p}Feld" data-f="schritt"`, o.schritt, 'kg')}
      ${zahlfeld('Anzahl Platten', `data-ein="${p}Feld" data-f="anzahl"`, o.anzahl)}
      ${zahlfeld('Zusatzgewicht', `data-ein="${p}Feld" data-f="zusatz" placeholder="keins"`, o.zusatz || null, 'kg')}
      ${feld('Eigene Stufen', `data-ein="${p}Feld" data-f="stufen" placeholder="z. B. 5 10 15 22,5"`, o.stufen)}
    </div><p class="hinweis" id="${p}-vorschau">${gewichtVorschau(o)}</p>`;
  if (o.typ === 'scheiben') typFelder = `<div class="gruppe">
      ${zahlfeld('Leergewicht der Stange', `data-ein="${p}Feld" data-f="stange"`, o.stange, 'kg')}
      <label class="zeile feldzeile"><span>Scheiben auf beiden Seiten</span><input type="checkbox" class="schalter" data-ein="${p}Schalter" data-f="beidseitig" ${o.beidseitig !== false ? 'checked' : ''}></label>
    </div>`;
  if (o.typ === 'kurzhantel') typFelder = `<div class="gruppe">
      ${zahlfeld('Leichteste', `data-ein="${p}Feld" data-f="kmin"`, o.kmin, 'kg')}
      ${zahlfeld('Schwerste', `data-ein="${p}Feld" data-f="kmax"`, o.kmax, 'kg')}
      ${zahlfeld('Schritt', `data-ein="${p}Feld" data-f="kschritt"`, o.kschritt, 'kg')}
      ${feld('Eigene Stufen', `data-ein="${p}Feld" data-f="stufen" placeholder="z. B. 2 4 6 8 10 12,5"`, o.stufen)}
    </div><p class="hinweis" id="${p}-vorschau">${gewichtVorschau(o)}</p>`;
  return typFelder;
}
function gewichtVorschau(o) {
  const s = stufenVon(o);
  if (!s.length) return '';
  const zeige = s.length > 6 ? `${s.slice(0, 3).map(kg).join(', ')} … ${kg(s[s.length - 1])}` : s.map(kg).join(', ');
  return `Wählbar: ${zeige} kg (${s.length} Stufen)`;
}

/* Gerät bearbeiten */
const GeraetEd = {
  g: null, neu: false, b: null, mitUe: true, muskel: MUSKELN[0], danach: null,

  auf(id, danach = null) {
    const o = id ? finde('geraete', id) : null;
    this.neu = !o; this.mitUe = !danach; this.muskel = MUSKELN[0]; this.danach = danach;
    this.g = o ? structuredClone(o) : { id: neuId(), name: '', bereich: '', ...GEWICHT_STD, typ: 'stack', marke: '', modell: '', notiz: '' };
    this.b = Blatt.auf({ titel: o ? 'Gerät' : 'Neues Gerät', voll: true, html: this.html(), neu: () => this.html(), aktion: { text: 'Sichern', akt: 'geraetSichern' } });
  },

  html() {
    const g = this.g;
    const bereiche = [...new Set(D.geraete.map((x) => x.bereich).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'de'));
    const uebungen = D.uebungen.filter((u) => u.geraet === g.id);
    return `
      <div class="gruppe">
        ${feld('Name', 'data-ein="gFeld" data-f="name" placeholder="z. B. Brustpresse"', g.name)}
        ${feld('Bereich', 'data-ein="gFeld" data-f="bereich" placeholder="z. B. hinten links" list="bereiche"', g.bereich)}
        <datalist id="bereiche">${bereiche.map((b) => `<option value="${esc(b)}">`).join('')}</datalist>
      </div>
      <div class="gruppe-titel">So stellst du das Gewicht ein</div>
      ${gewichtHtml(g, 'g')}
      <div class="gruppe-titel">Typenschild und Notiz</div>
      <div class="gruppe">
        ${feld('Marke', 'data-ein="gFeld" data-f="marke" placeholder="optional"', g.marke)}
        ${feld('Modell', 'data-ein="gFeld" data-f="modell" placeholder="optional"', g.modell)}
        <label class="zeile notizzeile"><textarea data-ein="gFeld" data-f="notiz" rows="1" placeholder="Notiz zum Gerät">${esc(g.notiz)}</textarea></label>
      </div>
      ${this.neu ? (g.typ === 'stack' || g.typ === 'scheiben' ? `<div class="gruppe">
          <label class="zeile feldzeile"><span>Gleichnamige Übung anlegen</span><input type="checkbox" class="schalter" data-ein="gMitUe" ${this.mitUe ? 'checked' : ''}></label>
          ${this.mitUe ? auswahl('Muskelgruppe', 'data-ein="gMuskel"', MUSKELN.map((m) => [m, m]), this.muskel) : ''}
        </div>` : '') : `
        <div class="gruppe-titel">Übungen an diesem Gerät</div>
        ${uebungen.length ? `<div class="gruppe">${uebungen.map((u) => `<button class="zeile" data-akt="ueAuf" data-id="${u.id}"><div class="haupt"><b>${esc(u.name)}</b><small>${esc(u.muskel || '')}</small></div>${ic('chevR', 16)}</button>`).join('')}</div>` : ''}
        <button class="knopf zweit breit" data-akt="ueNeuAmGeraet">${ic('plus', 18)} Übung an diesem Gerät</button>
        <button class="textknopf rot mittig" data-akt="geraetWeg">Gerät löschen</button>`}`;
  },
};

Object.assign(Akt, {
  geraetNeu() { GeraetEd.auf(null); },
  geraetAuf(el) { GeraetEd.auf(el.dataset.id); },
  gTyp(el) { GeraetEd.g.typ = el.dataset.typ; GeraetEd.g.stufen = ''; GeraetEd.b.setze(GeraetEd.html()); },
  geraetSichern() {
    const g = GeraetEd.g;
    g.name = g.name.trim(); g.bereich = (g.bereich || '').trim();
    if (!g.name) { toast('Gib dem Gerät einen Namen'); const i = $('[data-f="name"]', GeraetEd.b.el); if (i) i.focus(); return; }
    setze('geraete', g);
    if (GeraetEd.neu && GeraetEd.mitUe && (g.typ === 'stack' || g.typ === 'scheiben')) setze('uebungen', { id: neuId(), name: g.name, muskel: GeraetEd.muskel, muskeln2: [], geraet: g.id, equip: equipVon({ geraet: g.id }), notiz: '' });
    const danach = GeraetEd.danach;
    GeraetEd.b.zu(); zeichne(); Blatt.frisch();
    if (danach) danach(g.id);
  },
  async geraetWeg() {
    const n = D.uebungen.filter((u) => u.geraet === GeraetEd.g.id).length;
    if (!(await frage(`„${GeraetEd.g.name}“ wird gelöscht.${n ? ` ${n === 1 ? 'Die Übung daran bleibt' : 'Die ' + n + ' Übungen daran bleiben'} erhalten, aber ohne Gerät.` : ''}`))) return;
    for (const u of D.uebungen) if (u.geraet === GeraetEd.g.id) { u.geraet = ''; u.u = Date.now(); }
    entferne('geraete', GeraetEd.g.id);
    GeraetEd.b.zu(); zeichne();
  },
  ueNeuAmGeraet() { UeEd.auf(null, { geraet: GeraetEd.g.id }, null, 'geraet'); },
});
Object.assign(Ein, {
  gFeld(el) {
    if (el.tagName === 'TEXTAREA') wachse(el);
    GeraetEd.g[el.dataset.f] = 'zahl' in el.dataset ? zahl(el.value) : el.value;
    const v = $('#g-vorschau', GeraetEd.b.el);
    if (v) v.textContent = gewichtVorschau(GeraetEd.g);
  },
  gSchalter(el) { GeraetEd.g[el.dataset.f] = el.checked; },
  gMitUe(el) { GeraetEd.mitUe = el.checked; GeraetEd.b.setze(GeraetEd.html()); },
  gMuskel(el) { GeraetEd.muskel = el.value; },
});

/* Übung bearbeiten: Name, Equipment, Gerät, Muskeln. Ohne verknüpftes Gerät trägt die Übung
   die Gewichtseinstellungen selbst (Hanteln, Körpergewicht). */
function muskelAuswahl(attr, wert) {
  return `<label class="zeile feldzeile"><span>Primärer Muskel</span><select ${attr}>${REGIONEN.map(([r, l]) => `<optgroup label="${esc(r)}">${l.map((m) => `<option value="${esc(m)}" ${m === wert ? 'selected' : ''}>‎${esc(m)}‎</option>`).join('')}</optgroup>`).join('')}</select></label>`;
}
const pauseText = (n) => (n < 120 ? `${n} Sek.` : `${String(n / 60).replace('.', ',')} Min.`);
const UeEd = {
  u: null, neu: false, b: null, danach: null,

  auf(id, vorgabe = {}, danach = null) {
    const o = id ? finde('uebungen', id) : null;
    this.neu = !o; this.danach = danach;
    if (o) this.u = { ...GEWICHT_STD, ...structuredClone(o) };
    else {
      const equip = vorgabe.equip || (vorgabe.geraet ? equipVon({ geraet: vorgabe.geraet }) : 'kurzhantel');
      this.u = { id: neuId(), name: '', muskel: MUSKELN[0], muskeln2: [], geraet: '', notiz: '', ...GEWICHT_STD, ...this.equipStd(equip), equip, ...vorgabe };
    }
    this.u.equip = equipVon(this.u);
    this.u.muskeln2 = this.u.muskeln2 || [];
    this.b = Blatt.auf({ titel: o ? 'Übung' : 'Neue Übung', voll: true, html: this.html(), neu: () => this.html(), aktion: { text: 'Sichern', akt: 'ueSichern' } });
  },
  equipStd(e) {
    const q = EQUIP[e], out = { typ: q.typ };
    if (q.stange != null) out.stange = q.stange;
    out.stufen = q.stufen || '';
    return out;
  },
  bildZeile() {
    const u = this.u, r = bibVon(u);
    return `<div class="gruppe"><button class="zeile mitbild" data-akt="ueBild">${r ? vorschau(u, r) : '<span class="vorschau leer"></span>'}<div class="haupt"><b>Bild und Anleitung</b><small>${r ? esc(r[1]) : 'Aus der Bibliothek wählen'}</small></div>${ic('chevR', 16)}</button></div>
      ${bibEigen(u) && !vorlageGilt(u) ? `<button class="textknopf mittig" data-akt="ueBildWeg">${vorlageInfo(u) ? 'Standardbild wiederherstellen' : 'Bild entfernen'}</button>` : ''}`;
  },
  html() {
    const u = this.u, q = EQUIP[u.equip], g = geraetVon(u);
    const passend = D.geraete.filter((x) => equipVon({ geraet: x.id }) === u.equip || /egym/i.test(x.marke || ''));
    const geraete = [['', 'Kein bestimmtes Gerät'], ...[...(passend.length ? passend : D.geraete)].sort((a, b) => a.name.localeCompare(b.name, 'de')).map((x) => [x.id, x.name])];
    const geraetTeil = q.geraet ? `
      <div class="gruppe">${auswahl('Gerät', 'data-ein="uFeld" data-f="geraet"', geraete, u.geraet)}</div>
      ${g ? `<p class="hinweis">${esc(typText(g))}. Die Gewichtsstufen stellst du beim Gerät ein.</p>` : ''}
      ${g ? '' : `<button class="textknopf mittig" data-akt="ueGeraetNeu">${ic('plus', 16)} Neues Gerät eintragen</button>`}` : '';
    const studioweit = ['kurzhantel', 'langhantel', 'sz'].includes(u.equip);
    const felder = g || studioweit ? '' : gewichtFelder(u, 'u');
    return `
      <div class="gruppe">
        ${feld('Name', 'data-ein="uFeld" data-f="name" placeholder="z. B. Schrägbank-Curls" autocorrect="off" spellcheck="false"', u.name)}
        ${auswahl('Equipment', 'data-ein="uEquip"', Object.entries(EQUIP).map(([k, x]) => [k, x.name]), u.equip)}
      </div>
      ${geraetTeil}
      ${felder ? `<div class="gruppe-titel">Gewicht</div>${felder}` : studioweit ? `<p class="hinweis oben">${esc(typText(gewichtVon(u)))}. Gilt für alle Übungen mit ${esc(EQUIP[u.equip].name)} und lässt sich unter Mehr, Studio ändern.</p>` : ''}
      <div class="gruppe"><label class="zeile feldzeile"><span>Einarmig, Sätze zählen pro Arm</span><input type="checkbox" class="schalter" data-ein="uSchalter" data-f="einarmig" ${u.einarmig ? 'checked' : ''}></label></div>
      ${this.bildZeile()}
      <div class="gruppe-titel">Muskeln</div>
      <div class="gruppe">${muskelAuswahl('data-ein="uFeld" data-f="muskel"', u.muskel)}</div>
      <p class="hinweis oben">Mittrainiert</p>
      <div class="muskelchips">${REGIONEN.map(([, l]) => l.filter((m) => m !== u.muskel).map((m) => `<button class="chip klein ${u.muskeln2.includes(m) ? 'an' : ''}" data-akt="uMuskel2" data-m="${esc(m)}" aria-pressed="${u.muskeln2.includes(m)}">${esc(m)}</button>`).join('')).join('')}</div>
      <div class="gruppe">${auswahl('Pause', 'data-ein="uPause"', [60, 90, 120, 150, 180, 240, 300].map((n) => [String(n), pauseText(n)]), String(u.pause || 120))}</div>
      <div class="gruppe-titel">Notiz</div>
      <div class="gruppe"><label class="zeile notizzeile"><textarea data-ein="uFeld" data-f="notiz" rows="3" placeholder="Einstellungen und worauf du achten willst, z. B. Bank auf 30°, Sitz Stufe 4, Ellbogen eng">${esc(u.notiz)}</textarea></label></div>
      <p class="hinweis">Die Notiz steht bei jedem Training bei der Übung.</p>
      ${this.neu ? '' : `<button class="textknopf rot mittig" data-akt="ueWeg">Übung löschen</button>`}`;
  },
};
Object.assign(Akt, {
  ueNeu() { UeEd.auf(null); },
  ueBild() { Bib.auf(null, UeEd.u.name, true); },
  ueBildWeg() { UeEd.u.bib = ''; UeEd.b.setze(UeEd.html()); },
  ueBib() { Bib.auf(null); },
  ueAuf(el) { UeEd.auf(el.dataset.id); },
  uMuskel2(el) {
    const l = UeEd.u.muskeln2, m = el.dataset.m;
    UeEd.u.muskeln2 = l.includes(m) ? l.filter((x) => x !== m) : [...l, m];
    el.classList.toggle('an'); el.setAttribute('aria-pressed', UeEd.u.muskeln2.includes(m));
  },
  uTyp(el) { UeEd.u.typ = el.dataset.typ; UeEd.u.stufen = ''; UeEd.b.setze(UeEd.html()); },
  ueGeraetNeu() {
    GeraetEd.auf(null, (id) => { UeEd.u.geraet = id; UeEd.b.setze(UeEd.html()); });
  },
  ueSichern() {
    const u = UeEd.u;
    u.name = u.name.trim();
    if (!u.name) { toast('Gib der Übung einen Namen'); const i = $('[data-f="name"]', UeEd.b.el); if (i) i.focus(); return; }
    if (!EQUIP[u.equip].geraet) u.geraet = '';
    u.muskeln2 = u.muskeln2.filter((m) => m !== u.muskel);
    setze('uebungen', u);
    const danach = UeEd.danach;
    UeEd.b.zu(); zeichne(); Blatt.frisch();
    if (danach) danach(u.id);
  },
  async ueWeg() {
    if (!(await frage(`„${UeEd.u.name}“ wird gelöscht. Der bisherige Verlauf dieser Übung ist dann nicht mehr sichtbar.`))) return;
    entferne('uebungen', UeEd.u.id);
    UeEd.b.zu(); zeichne(); Blatt.frisch();
  },
});
Object.assign(Ein, {
  uFeld(el) {
    if (el.tagName === 'TEXTAREA') wachse(el);
    UeEd.u[el.dataset.f] = 'zahl' in el.dataset ? zahl(el.value) : el.value;
    if (el.dataset.f === 'geraet' || el.dataset.f === 'muskel') { UeEd.u.muskeln2 = UeEd.u.muskeln2.filter((m) => m !== UeEd.u.muskel); UeEd.b.setze(UeEd.html()); }
    const v = $('#u-vorschau', UeEd.b.el);
    if (v) v.textContent = gewichtVorschau(UeEd.u);
  },
  uEquip(el) {
    const u = UeEd.u;
    u.equip = el.value;
    Object.assign(u, UeEd.equipStd(u.equip));
    if (!EQUIP[u.equip].geraet) u.geraet = '';
    else if (u.geraet && equipVon({ geraet: u.geraet }) !== u.equip) u.geraet = '';
    UeEd.b.setze(UeEd.html());
  },
  uSchalter(el) { UeEd.u[el.dataset.f] = el.checked; },
  uPause(el) { UeEd.u.pause = +el.value; },
});

/* Bibliothek: rund 600 Übungen zum Übernehmen, gefiltert nach dem Equipment, das es im Studio gibt */
const studioEinst = () => D.einst.find((x) => x.id === 'einst') || { id: 'einst' };
const ohneEquip = () => studioEinst().ohne || [];
const Bib = {
  b: null, cb: null, q: '', equip: 'alle', muskel: '',
  auf(cb, q = '', bildModus = false) {
    this.cb = cb; this.q = q; this.bildModus = bildModus; this.equip = 'alle'; this.muskel = '';
    this.b = Blatt.auf({ titel: 'Bibliothek', voll: true, html: this.html(), neu: () => this.html() });
  },
  html() {
    const da = Object.keys(EQUIP).filter((k) => !ohneEquip().includes(k) && k !== 'sonst');
    return `<label class="suchfeld">${ic('suche', 18)}<input data-ein="bibSuche" placeholder="Suchen, z. B. Schrägbank Curl" value="${esc(this.q)}" enterkeyhint="search" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" aria-label="Bibliothek durchsuchen"></label>
      <div class="chipleiste">${['alle', ...da].map((k) => `<button class="chip ${this.equip === k ? 'an' : ''}" data-akt="bibEquip" data-k="${k}">${k === 'alle' ? 'Alles' : EQUIP[k].name}</button>`).join('')}</div>
      <div id="bib-liste">${this.liste()}</div>
      <button class="knopf zweit breit" data-akt="ueEigen">${ic('plus', 18)} Eigene Übung anlegen</button>`;
  },
  liste() {
    const worte = this.q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (!worte.length && !this.muskel) {
      return REGIONEN.map(([r, l]) => `<div class="gruppe-titel klein">${esc(r)}</div><div class="muskelchips">${l.map((m) => `<button class="chip" data-akt="bibMuskel" data-m="${esc(m)}">${esc(m)}</button>`).join('')}</div>`).join('');
    }
    const ohne = ohneEquip();
    const meine = new Map(D.uebungen.map((u) => [`${u.name.toLowerCase()}|${equipVon(u)}`, u.id]));
    const treffer = BIBLIOTHEK.filter(([, n, e, p, , , en]) => !ohne.includes(e) && (this.equip === 'alle' || e === this.equip) && (!this.muskel || p === this.muskel) && worte.every((w) => n.toLowerCase().includes(w) || en.toLowerCase().includes(w)));
    // Treffer, deren Name mit dem ersten Suchwort beginnt, zuerst; dann kürzere Namen
    if (worte.length) treffer.sort((x, y) => (y[1].toLowerCase().startsWith(worte[0]) - x[1].toLowerCase().startsWith(worte[0])) || x[1].length - y[1].length);
    const kopf = this.muskel ? `<div class="bib-kopf"><b>${esc(this.muskel)}</b><button class="textknopf" data-akt="bibMuskel" data-m="">Alle Muskeln</button></div>` : '';
    if (!treffer.length) return kopf + `<p class="hinweis oben">Nichts gefunden. Leg die Übung unten selbst an.</p>`;
    const zeig = treffer.slice(0, 120);
    return kopf + `<div class="liste">${zeig.map(([id, n, e, p]) => {
      const hab = meine.get(`${n.toLowerCase()}|${e}`);
      return `<div class="zeile mitbild" data-akt="bibInfo" data-id="${esc(id)}" role="button" tabindex="0">${vorschau(null, BIB_ID.get(id))}<div class="haupt"><b>${esc(n)}</b><small>${esc(EQUIP[e].name)}, ${esc(p)}${hab ? ', schon angelegt' : ''}</small></div><button class="rund klein" data-akt="bibWahl" data-id="${esc(id)}" aria-label="${hab ? 'Schon angelegt' : 'Übernehmen'}">${hab ? ic('check', 16) : ic('plus', 16)}</button></div>`;
    }).join('')}</div>${treffer.length > zeig.length ? `<p class="hinweis oben">${treffer.length - zeig.length} weitere, such genauer.</p>` : ''}`;
  },
  neu() { $('#bib-liste', this.b.el).innerHTML = this.liste(); },
};
Object.assign(Akt, {
  bibEquip(el) { Bib.equip = el.dataset.k; Bib.b.setze(Bib.html()); },
  bibMuskel(el) { Bib.muskel = el.dataset.m; Bib.neu(); Bib.b.inhalt.scrollTop = 0; },
  bibWahl(el) {
    const r = BIBLIOTHEK.find((x) => x[0] === el.dataset.id);
    if (!r) return;
    const [, name, equip, muskel, muskeln2] = r;
    if (Bib.bildModus) { UeEd.u.bib = r[0]; Bib.b.zu(); UeEd.b.setze(UeEd.html()); return; }
    const hab = D.uebungen.find((u) => u.name.toLowerCase() === name.toLowerCase() && equipVon(u) === equip);
    const cb = Bib.cb;
    if (hab) { Bib.b.zu(); if (cb) cb(hab.id); else UeEd.auf(hab.id); return; }
    // Gibt es genau ein passendes Gerät, wird es gleich verknüpft
    const passend = EQUIP[equip].geraet ? D.geraete.filter((g) => equipVon({ geraet: g.id }) === equip) : [];
    UeEd.auf(null, { name, equip, muskel, muskeln2: [...muskeln2], bib: r[0], ...UeEd.equipStd(equip), geraet: passend.length === 1 ? passend[0].id : '' }, (id) => { Bib.b.zu(); if (cb) cb(id); });
  },
  ueEigen() { const cb = Bib.cb; UeEd.auf(null, { name: Bib.q.trim() }, (id) => { Bib.b.zu(); if (cb) cb(id); }); },
  equipDa(el) {
    const e = studioEinst(), l = e.ohne || [], k = el.dataset.k;
    setze('einst', { ...e, ohne: l.includes(k) ? l.filter((x) => x !== k) : [...l, k] });
    zeichne();
  },
});
Object.assign(Ein, {
  hantelFeld(el) {
    const e = studioEinst(), n = el.dataset.f === 'stufen' ? el.value : zahl(el.value);
    setze('einst', { ...e, hantel: { ...(e.hantel || {}), [el.dataset.f]: n } });
  },
  bibSuche(el) { Bib.q = el.value; Bib.neu(); },
});
