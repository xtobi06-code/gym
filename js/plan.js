'use strict';
/* Training-Reiter: Trainingstage (Splits) anlegen, bearbeiten und starten. */

function kopf(titel, zusatz = '') {
  return `<div class="kopf">${zusatz ? `<p class="info">${esc(zusatz)}</p>` : ''}<h1>${esc(titel)}</h1></div>`;
}
// Alle Trainingstage teilen sich die Kontrastfarbe: im Kalender zählt nur, ob trainiert wurde
const planFarbe = () => 'var(--pin)';

const WOCHENTAGE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

// Diese Woche auf einen Blick: ein Kreis pro Tag, gefüllt in der Farbe des Trainingstags
function wocheHtml() {
  const heute = tagStart(Date.now()), wt = (new Date(heute).getDay() + 6) % 7, w = wocheVon(Date.now()), pause = istPause(w);
  let n = 0;
  const tage = WOCHENTAGE.map((name, i) => {
    const d = new Date(heute); d.setDate(d.getDate() - wt + i);
    const von = d.getTime();
    const t = D.trainings.find((x) => tagStart(x.start) === von);
    if (t) n++;
    const frisch = t && ui.neuTag === tagKey(von);
    return `<div class="wtag ${t ? 'an' : ''} ${frisch ? 'frisch' : ''} ${von === heute ? 'heute' : ''} ${von > heute ? 'spaeter' : ''}" ${t ? `style="--c:${planFarbe(t.farbe)}"` : ''}><span class="scheibchen">${t ? ic('check', 16) : ''}</span><small>${name}</small></div>`;
  }).join('');
  ui.neuTag = null;   // die Füll-Animation nur einmal zeigen
  const info = pause ? 'Pause, die Serie bleibt' : n === 0 ? 'noch kein Training' : n === 1 ? '1 Training' : n + ' Trainings';
  return `<div class="woche ${pause ? 'pausiert' : ''}"><div class="woche-kopf"><b>Diese Woche</b><span>${info}</span></div><div class="wtage">${tage}</div>
    <button class="textknopf leise pausenknopf" data-akt="wochePause">${pause ? 'Pause aufheben' : 'Krank oder im Urlaub? Woche pausieren'}</button></div>`;
}
Akt.wochePause = () => {
  const w = wocheVon(Date.now()), p = D.pausen.find((x) => x.woche === w);
  if (p) entferne('pausen', p.id); else setze('pausen', { id: neuId(), woche: w });
  zeichne();
};

// Geschätzte Dauer: Schnitt der letzten Trainings dieses Tags, sonst aus Sätzen und Pausen gerechnet, auf 5 Minuten gerundet
function dauerSchaetzung(p) {
  const fruehere = D.trainings.filter((x) => x.plan === p.id && x.ende > x.start).slice(-3);
  let ms;
  if (fruehere.length) ms = fruehere.reduce((a, x) => a + (x.ende - x.start), 0) / fruehere.length;
  else {
    let s = 90;
    for (const x of p.punkte) {
      if (!finde('uebungen', x.ue)) continue;
      const n = (x.saetze || 0) + (x.warm ? (x.warmN || aufwaermAnzahl()) : 0);
      s += 60 + n * 45 + Math.max(0, n - 1) * pauseVon(x.ue);
    }
    ms = s * 1000;
  }
  const min = Math.max(5, Math.round(ms / 300000) * 5);
  return dauer(min * 60000);
}

function kachelHtml(p, art) {
  const letzt = [...D.trainings].reverse().find((x) => x.plan === p.id);
  const namen = p.punkte.map((x) => finde('uebungen', x.ue)).filter(Boolean).map((u) => u.name);
  const vorschau = namen.length ? namen.slice(0, 3).join(', ') + (namen.length > 3 ? ` und ${namen.length - 3} weitere` : '') : 'Noch keine Übungen';
  const saetze = p.punkte.reduce((a, x) => a + (finde('uebungen', x.ue) ? x.saetze || 0 : 0), 0);
  const info = `${namen.length} ${namen.length === 1 ? 'Übung' : 'Übungen'}, ${saetze} ${saetze === 1 ? 'Satz' : 'Sätze'}, ${letzt ? 'zuletzt ' + vorWieLang(letzt.start) : 'noch nie trainiert'}`;
  if (art === 'dran') return `<div class="hero dran" data-akt="planAuf" data-id="${p.id}" role="button" tabindex="0">
      <div class="hero-kopf"><span class="hero-marke">Als Nächstes</span><span class="hero-nr zahl dauer">~${dauerSchaetzung(p)}</span></div>
      <h2>${esc(p.name)}</h2>
      <p>${esc(vorschau)}</p>
      <small>${info}</small>
      <button class="knopf haupt breit gross" data-akt="start" data-plan="${p.id}">${ic('play', 20)} ${esc(p.name)} starten</button>
    </div>`;
  if (art === 'klein') return `<div class="kachel klein" data-akt="planAuf" data-id="${p.id}" role="button" tabindex="0">
      <div class="kachel-text"><h2>${esc(p.name)}</h2><small>${info}</small></div>
      <button class="scheibe" data-akt="start" data-plan="${p.id}" aria-label="${esc(p.name)} starten">${ic('play', 20)}</button>
    </div>`;
  return `<div class="kachel" data-akt="planAuf" data-id="${p.id}" role="button" tabindex="0">
      <div class="kachel-text"><h2>${esc(p.name)}</h2><p>${esc(vorschau)}</p><small>${info}</small></div>
      <button class="scheibe" data-akt="start" data-plan="${p.id}" aria-label="${esc(p.name)} starten">${ic('play', 24)}</button>
    </div>`;
}

function zeigeTraining() {
  let h = `<div class="kopf kopf-streak"><div><p class="info">${esc(fmtLang.format(new Date()))}</p><h1>Training</h1></div>${D.trainings.length ? `<div class="streak-marke" title="Wochen in Folge aktiv"><span class="zahl">${serie()}</span>${ic('flamme', 22)}</div>` : ''}</div>`;
  const t = Aktiv.t;
  if (t) {
    const fertig = t.punkte.reduce((a, p) => a + arbeitsSaetze(p).filter((s) => s.ok).length, 0), alle = t.punkte.reduce((a, p) => a + arbeitsSaetze(p).length, 0);
    h += `<button class="laeuft" data-akt="liveAuf"><span class="puls"></span>
      <span class="haupt"><b>${esc(t.name)} läuft</b><small>seit ${dauer(Date.now() - t.start)}, ${fertig} von ${alle} Sätzen</small></span>
      <span class="weiter">Weiter ${ic('chevR', 16)}</span></button>`;
  }
  if (!D.plaene.length) {
    const hatUe = D.uebungen.length > 0;
    h += `<div class="leer"><h2>${hatUe ? 'Stell deinen ersten Trainingstag zusammen' : 'Lege zuerst Übungen an'}</h2>
      <p>${hatUe ? 'Ein Trainingstag ist eine feste Reihenfolge von Übungen, zum Beispiel Push, Pull oder Beine.' : 'Trag unter Studio ein, was du trainierst. Daraus baust du danach deine Trainingstage.'}</p>
      ${hatUe ? `<button class="knopf haupt" data-akt="planNeu">${ic('plus', 18)} Trainingstag anlegen</button>` : `<button class="knopf haupt" data-akt="tab" data-tab="studio">Zum Studio</button>`}</div>`;
  } else {
    h += wocheHtml();
    const splits = splitsVon(), aktiv = aktiverSplit();
    // Dran ist im aktiven Split der Trainingstag, der am längsten nicht mehr war
    const zuletzt = (p) => { const x = [...D.trainings].reverse().find((y) => y.plan === p.id); return x ? x.start : 0; };
    const meine = D.plaene.filter((p) => splitKey(p.split) === aktiv);
    const dran = [...meine].filter((p) => p.punkte.length).sort((a, b) => zuletzt(a) - zuletzt(b))[0] || null;
    if (splits.length > 1) h += `<button class="splitzeile" data-akt="splitWechsel"><span><small>Aktueller Split</small><b>${esc(splitName(aktiv))}</b></span>${ic('chevD', 18)}</button>`;
    h += `<div class="kacheln">${dran ? kachelHtml(dran, 'dran') : ''}${meine.filter((p) => p !== dran).map((p) => kachelHtml(p, 'normal')).join('')}</div>`;
    const andere = splits.filter((s) => s !== aktiv);
    if (andere.length) {
      h += `<div class="trenner"><span>Andere Trainingstage</span></div>` + andere.map((s) => `<div class="gruppe-titel klein">${esc(splitName(s))}</div><div class="kacheln">${D.plaene.filter((p) => splitKey(p.split) === s).map((p) => kachelHtml(p, 'klein')).join('')}</div>`).join('');
    }
    h += `<div class="knopfzeile"><button class="knopf zweit" data-akt="planNeu">${ic('plus', 18)} Trainingstag</button><button class="knopf zweit" data-akt="start" data-plan="">Freies Training</button></div>`;
  }
  return h;
}

Object.assign(Akt, {
  splitWechsel() {
    const aktiv = aktiverSplit();
    Blatt.auf({ titel: 'Aktueller Split', html: `<div class="gruppe">${splitsVon().map((s) => {
      const n = D.plaene.filter((p) => splitKey(p.split) === s).length;
      return `<button class="zeile" data-akt="splitWahl" data-s="${esc(s)}"><div class="haupt"><b>${esc(splitName(s))}</b><small>${n} ${n === 1 ? 'Trainingstag' : 'Trainingstage'}</small></div>${s === aktiv ? `<span class="haken-an">${ic('check', 20)}</span>` : ''}</button>`;
    }).join('')}</div><p class="hinweis">Neue Splits legst du an, indem du bei einem Trainingstag einen Split-Namen einträgst.</p>` });
  },
  splitWahl(el) {
    setze('einst', { ...studioEinst(), aktiv: el.dataset.s });
    Akt.blattZu(el); zeichne();
  },
});

/* Trainingstag bearbeiten */
const PlanEd = {
  p: null, neu: false, b: null,

  auf(id) {
    const o = id ? finde('plaene', id) : null;
    this.neu = !o;
    this.p = o ? structuredClone(o) : { id: neuId(), name: '', farbe: 0, split: aktiverSplit(), punkte: [] };
    this.b = Blatt.auf({ titel: o ? 'Trainingstag' : 'Neuer Trainingstag', voll: true, html: this.html(), aktion: { text: 'Sichern', akt: 'planSichern' } });
  },

  html() {
    const p = this.p;
    return `
      <div class="gruppe">
        ${feld('Name', 'data-ein="planName" placeholder="z. B. PUSH" enterkeyhint="done" autocapitalize="characters" autocorrect="off" spellcheck="false" class="gross-schrift"', p.name)}
        ${feld('Split', 'data-ein="planSplit" placeholder="z. B. PPL, U/L oder P/A" list="splits" enterkeyhint="done" autocapitalize="characters" autocorrect="off" spellcheck="false"', splitKey(p.split))}
        <datalist id="splits">${splitsVon().filter(Boolean).map((x) => `<option value="${esc(x)}">`).join('')}</datalist>
      </div>
      <div class="gruppe-titel">Übungen in dieser Reihenfolge</div>
      <div id="plan-punkte">${this.punkteHtml()}</div>
      <button class="knopf zweit breit" data-akt="planUePlus">${ic('plus', 18)} Übung hinzufügen</button>
      ${this.neu ? '' : `<button class="textknopf rot mittig" data-akt="planWeg">Trainingstag löschen</button>`}`;
  },

  punkteHtml() {
    const p = this.p;
    if (!p.punkte.length) return `<p class="hinweis">Noch keine Übung. Füge die erste hinzu.</p>`;
    return `<div class="gruppe">${p.punkte.map((x, i) => {
      const ue = finde('uebungen', x.ue);
      return `<div class="punkt" data-i="${i}">
        <div class="punkt-kopf">
          <div class="haupt"><b>${esc(ue ? ue.name : 'Gelöschte Übung')}</b><small>${esc(ue ? [ue.muskel, ortVon(ue)].filter(Boolean).join(', ') : '')}</small></div>
          <button class="rund klein" data-akt="punktHoch" ${i === 0 ? 'disabled' : ''} aria-label="Nach oben">${ic('chevU', 16)}</button>
          <button class="rund klein" data-akt="punktRunter" ${i === p.punkte.length - 1 ? 'disabled' : ''} aria-label="Nach unten">${ic('chevD', 16)}</button>
          <button class="rund klein" data-akt="punktWeg" aria-label="Entfernen">${ic('x', 16)}</button>
        </div>
        <div class="punkt-extra">
          <button class="chip klein ${x.warm ? 'an' : ''}" data-akt="punktWarm" aria-pressed="${!!x.warm}">${ic('flamme', 14)} Aufwärmen</button>
          ${(x.alt || []).map((a) => { const au = finde('uebungen', a); return au ? `<span class="chip klein alt">${ic('tausch', 14)} ${esc(au.name)}<button data-akt="altWeg" data-a="${a}" aria-label="Alternative entfernen">${ic('x', 14)}</button></span>` : ''; }).join('')}
          <button class="chip klein leise" data-akt="altPlus">${ic('plus', 14)} Alternative</button>
        </div>
        ${x.warm ? `<div class="punkt-werte"><span class="zaehler"><button class="rund klein" data-akt="punktWarmN" data-d="-1" aria-label="Ein Aufwärmsatz weniger">${ic('minus', 16)}</button><b>${x.warmN || aufwaermAnzahl()}</b><span>${(x.warmN || aufwaermAnzahl()) === 1 ? 'Aufwärmsatz' : 'Aufwärmsätze'}</span><button class="rund klein" data-akt="punktWarmN" data-d="1" aria-label="Ein Aufwärmsatz mehr">${ic('plus', 16)}</button></span></div>` : ''}
        <div class="punkt-werte">
          <span class="zaehler"><button class="rund klein" data-akt="punktSaetze" data-d="-1" aria-label="Ein Satz weniger">${ic('minus', 16)}</button><b>${x.saetze}</b><span>${x.saetze === 1 ? 'Satz' : 'Sätze'}</span><button class="rund klein" data-akt="punktSaetze" data-d="1" aria-label="Ein Satz mehr">${ic('plus', 16)}</button></span>
          <span class="bereich"><input data-ein="punktMin" inputmode="numeric" value="${x.wmin ?? ''}" aria-label="Wiederholungen von"><span>bis</span><input data-ein="punktMax" inputmode="numeric" value="${x.wmax ?? ''}" aria-label="Wiederholungen bis"><span>Wdh.</span></span>
        </div>
      </div>`;
    }).join('')}</div>`;
  },
  neuPunkte() { $('#plan-punkte', this.b.el).innerHTML = this.punkteHtml(); },
  iVon(el) { return +el.closest('.punkt').dataset.i; },
};

Object.assign(Akt, {
  planNeu() { PlanEd.auf(null); },
  planAuf(el) { PlanEd.auf(el.dataset.id); },
  planUePlus() {
    UeWahl.auf((id) => { PlanEd.p.punkte.push({ ue: id, saetze: 3, wmin: 8, wmax: 12, warm: !PlanEd.p.punkte.length, alt: [] }); PlanEd.neuPunkte(); });
  },
  punktHoch(el) { const i = PlanEd.iVon(el), l = PlanEd.p.punkte; [l[i - 1], l[i]] = [l[i], l[i - 1]]; PlanEd.neuPunkte(); },
  punktRunter(el) { const i = PlanEd.iVon(el), l = PlanEd.p.punkte; [l[i + 1], l[i]] = [l[i], l[i + 1]]; PlanEd.neuPunkte(); },
  punktWarmN(el) { const x = PlanEd.p.punkte[PlanEd.iVon(el)]; x.warmN = Math.min(3, Math.max(1, (x.warmN || aufwaermAnzahl()) + +el.dataset.d)); PlanEd.neuPunkte(); },
  punktWarm(el) { const x = PlanEd.p.punkte[PlanEd.iVon(el)]; x.warm = !x.warm; PlanEd.neuPunkte(); },
  altPlus(el) { const x = PlanEd.p.punkte[PlanEd.iVon(el)]; UeWahl.auf((id) => { if (id !== x.ue && !(x.alt || []).includes(id)) x.alt = [...(x.alt || []), id]; PlanEd.neuPunkte(); }); },
  altWeg(el) { const x = PlanEd.p.punkte[PlanEd.iVon(el)]; x.alt = (x.alt || []).filter((a) => a !== el.dataset.a); PlanEd.neuPunkte(); },
  punktWeg(el) { PlanEd.p.punkte.splice(PlanEd.iVon(el), 1); PlanEd.neuPunkte(); },
  punktSaetze(el) {
    const x = PlanEd.p.punkte[PlanEd.iVon(el)];
    x.saetze = Math.min(10, Math.max(1, x.saetze + +el.dataset.d));
    PlanEd.neuPunkte();
  },
  planSichern() {
    const p = PlanEd.p;
    p.name = p.name.trim().toUpperCase();
    if (!p.name) { toast('Gib dem Trainingstag einen Namen'); const i = $('[data-ein="planName"]', PlanEd.b.el); if (i) i.focus(); return; }
    p.split = splitKey(p.split).trim();
    for (const x of p.punkte) if (x.wmin && x.wmax && x.wmin > x.wmax) [x.wmin, x.wmax] = [x.wmax, x.wmin];
    setze('plaene', p);
    PlanEd.b.zu(); zeichne();
  },
  async planWeg() {
    if (!(await frage(`„${PlanEd.p.name}“ wird gelöscht. Bereits gespeicherte Trainings bleiben erhalten.`))) return;
    entferne('plaene', PlanEd.p.id);
    PlanEd.b.zu(); zeichne();
  },
});
Object.assign(Ein, {
  planName(el) { const a = el.selectionStart; el.value = el.value.toUpperCase(); try { el.setSelectionRange(a, a); } catch { /* egal */ } PlanEd.p.name = el.value; },
  planSplit(el) {
    const pos = el.selectionStart, gross = el.value.toUpperCase();
    if (gross !== el.value) { el.value = gross; try { el.setSelectionRange(pos, pos); } catch { /* egal */ } }
    PlanEd.p.split = gross.trim();
  },
  punktMin(el) { const n = zahl(el.value); PlanEd.p.punkte[PlanEd.iVon(el)].wmin = n ? Math.round(n) : null; },
  punktMax(el) { const n = zahl(el.value); PlanEd.p.punkte[PlanEd.iVon(el)].wmax = n ? Math.round(n) : null; },
});

/* Übung auswählen (für Trainingstag und laufendes Training) */
const UeWahl = {
  cb: null, b: null, filter: '',

  auf(cb) {
    this.cb = cb; this.filter = '';
    this.b = Blatt.auf({
      titel: 'Übung wählen', voll: true, neu: () => this.html(),
      html: this.html(),
    });
  },
  html() {
    return `<div class="gruppe"><label class="zeile feldzeile suche"><input data-ein="ueFilter" placeholder="Suchen" value="${esc(this.filter)}" enterkeyhint="search" autocomplete="off" aria-label="Übung suchen"></label></div>
      <div id="ue-liste">${this.liste()}</div>
      <button class="knopf zweit breit" data-akt="ueNeuWahl">${ic('suche', 18)} In der Bibliothek suchen</button>`;
  },
  liste() {
    const f = this.filter.trim().toLowerCase();
    const treffer = D.uebungen.filter((u) => !f || u.name.toLowerCase().includes(f) || (u.muskel || '').toLowerCase().includes(f));
    if (!D.uebungen.length) return `<p class="hinweis">Du hast noch keine Übung angelegt.</p>`;
    if (!treffer.length) return `<p class="hinweis">Keine Übung passt zu „${esc(this.filter)}“.</p>`;
    return nachMuskel(treffer).map(([m, liste]) => `<div class="gruppe-titel">${esc(m)}</div><div class="gruppe">${liste.map((u) => {
      const o = ortVon(u);
      return `<button class="zeile mitbild" data-akt="ueGewaehlt" data-id="${u.id}">${vorschau(u)}<div class="haupt"><b>${esc(u.name)}</b>${o ? `<small>${esc(o)}</small>` : ''}</div>${ic('plus', 18)}</button>`;
    }).join('')}</div>`).join('');
  },
};
function nachMuskel(liste) {
  const m = new Map();
  for (const u of liste) { const k = u.muskel || 'Ohne Muskelgruppe'; if (!m.has(k)) m.set(k, []); m.get(k).push(u); }
  const rang = (k) => { const i = MUSKELN.indexOf(k); return i < 0 ? 99 : i; };
  return [...m.entries()].sort((a, b) => rang(a[0]) - rang(b[0])).map(([k, l]) => [k, l.sort((x, y) => x.name.localeCompare(y.name, 'de'))]);
}
Object.assign(Akt, {
  ueGewaehlt(el) { const cb = UeWahl.cb; UeWahl.b.zu(); cb(el.dataset.id); },
  ueNeuWahl() { const cb = UeWahl.cb; Bib.auf((id) => { UeWahl.b.zu(); cb(id); }, UeWahl.filter.trim()); },
});
Object.assign(Ein, {
  ueFilter(el) { UeWahl.filter = el.value; $('#ue-liste', UeWahl.b.el).innerHTML = UeWahl.liste(); },
});
