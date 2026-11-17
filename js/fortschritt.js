'use strict';
/* Fortschritt-Reiter: Kalender (wie regelmäßig?) und Kraft (wie stark?). */


function zeigeFortschritt() {
  return kopf('Fortschritt') + segment('fortschritt', [['kalender', 'Kalender'], ['kraft', 'Kraft']]) + (ui.fortschritt === 'kalender' ? kalenderHtml() : kraftHtml());
}

// Quartal als Zahl (Jahr * 4 + 0..3), Anzeige wie 26Q4
const quartalVon = (ts) => { const d = new Date(ts); return d.getFullYear() * 4 + Math.floor(d.getMonth() / 3); };
const quartalName = (q) => `${String(Math.floor(q / 4)).slice(-2)}Q${(q % 4) + 1}`;

function kalenderHtml() {
  if (!D.trainings.length) return `<div class="leer"><h2>Noch kein Training gespeichert</h2><p>Nach deinem ersten Training siehst du hier, an welchen Tagen du im Studio warst.</p></div>`;
  const jetzt = Date.now(), qJetzt = quartalVon(jetzt), qMin = Math.min(qJetzt, quartalVon(D.trainings[0].start));
  if (ui.quartal == null || ui.quartal > qJetzt || ui.quartal < qMin) ui.quartal = qJetzt;
  const q = ui.quartal, jahr = Math.floor(q / 4), m0 = (q % 4) * 3;
  const von = new Date(jahr, m0, 1).getTime(), bis = new Date(jahr, m0 + 3, 1).getTime();
  const imQ = D.trainings.filter((t) => t.start >= von && t.start < bis);

  // Trainingstage je Datum, bei mehreren am selben Tag zählt das letzte
  const proTag = new Map();
  for (const t of imQ) proTag.set(tagKey(t.start), t);

  // Kennzahlen: Trainings im Quartal und pro Woche, gerechnet ab dem ersten Training bzw. bis heute
  const start = Math.max(von, D.trainings[0].start), ende = Math.min(bis - 1, jetzt);
  const wochen = Math.max(1, (tagStart(ende) - tagStart(start)) / TAG / 7);
  const reihe = serie();

  let h = `<div class="hero streak">
      <div class="streak-zahl"><span class="zahl">${reihe}</span>${ic('flamme', 30)}</div>
      <p>${reihe === 1 ? 'Woche' : 'Wochen'} in Folge aktiv</p>
      <div class="hero-zahlen"><div><b class="zahl">${imQ.length}</b><small>Trainings ${quartalName(q)}</small></div><div><b class="zahl">${imQ.length ? rund1(imQ.length / wochen) : '0'}</b><small>pro Woche</small></div></div>
    </div>
    <div class="jahrwahl">
      <button class="rund klein" data-akt="quartal" data-d="-1" ${q <= qMin ? 'disabled' : ''} aria-label="Quartal davor">${ic('chevL', 16)}</button>
      <b>${quartalName(q)}</b>
      <button class="rund klein" data-akt="quartal" data-d="1" ${q >= qJetzt ? 'disabled' : ''} aria-label="Quartal danach">${ic('chevR', 16)}</button>
    </div>
    <div class="monate">`;
  const heute = tagKey(jetzt);
  for (let m = m0; m < m0 + 3; m++) {
    const erster = new Date(jahr, m, 1), tage = new Date(jahr, m + 1, 0).getDate(), versatz = (erster.getDay() + 6) % 7;
    let zellen = '<i></i>'.repeat(versatz), n = 0;
    for (let d = 1; d <= tage; d++) {
      const k = `${jahr}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`, t = proTag.get(k);
      if (t) n++;
      zellen += `<i class="tag ${t ? 'an' : ''} ${k === heute ? 'heute' : ''}" ${t ? `style="--c:${planFarbe(t.farbe)}"` : ''}></i>`;
    }
    h += `<div class="monat" role="img" aria-label="${MONATE[m]}: ${n} ${n === 1 ? 'Training' : 'Trainings'}"><h4>${MONATE[m]}<span>${n || ''}</span></h4><div class="tage kopfzeile">${'MDMDFSS'.split('').map((c) => `<b>${c}</b>`).join('')}</div><div class="tage">${zellen}</div></div>`;
  }
  h += '</div>';

  const letzte = [...imQ].reverse().slice(0, ui.alle ? 400 : 6);
  if (letzte.length) {
    h += `<div class="gruppe-titel">${ui.alle ? 'Alle Trainings ' + quartalName(q) : 'Letzte Trainings'}</div><div class="liste">${letzte.map((t) => `<button class="zeile" data-akt="trainingAuf" data-id="${t.id}">
        <span class="farbpunkt" style="background:${planFarbe(t.farbe)}"></span>
        <div class="haupt"><b>${esc(t.name)}</b><small>${fmtWochentag.format(t.start)}, ${dauer(t.ende - t.start)}, ${satzZahl(t)} Sätze</small></div>${ic('chevR', 16)}</button>`).join('')}</div>`;
    if (!ui.alle && imQ.length > 6) h += `<button class="textknopf mittig" data-akt="alleTrainings">Alle ${imQ.length} anzeigen</button>`;
  }
  return h;
}

/* Ein gespeichertes Training ansehen */
function trainingHtml(t) {
  return `<p class="hinweis oben">${fmtLang.format(t.start)}, ${dauer(t.ende - t.start)}, ${Math.round(volumen(t)).toLocaleString('de-DE')} kg bewegt</p>
    ${t.punkte.map((p) => {
      const ue = finde('uebungen', p.ue);
      return `<div class="gruppe-titel">${esc(ue ? ue.name : 'Gelöschte Übung')}</div><div class="liste">
        ${p.saetze.map((s, i) => `<div class="zeile satz fest ${s.auf ? 'warm' : ''}"><span class="nr">${satzLabel(p, i)}</span><div class="haupt"><div class="werte"><span class="z">${vz(p.ue)}${kg(s.g)}</span><span class="e">kg</span><span class="mal">×</span><span class="z">${s.w}</span></div></div></div>`).join('')}
        ${p.marke || p.notiz ? `<div class="zeile merk">${ic(p.marke ? MARKEN[p.marke].ic : 'notiz', 18)}<div class="haupt">${p.marke ? `<b>${MARKEN[p.marke].kurz}</b>` : ''}${p.notiz ? `<small>${esc(p.notiz)}</small>` : ''}</div></div>` : ''}
      </div>`;
    }).join('')}
    <button class="textknopf rot mittig" data-akt="trainingWeg" data-id="${t.id}">Training löschen</button>`;
}

/* Kraft: geschätztes Maximum je Übung */
function kraftDaten(ueId) {
  const rows = verlauf(ueId);
  const modus = rows.some((r) => r.e > 0) ? 'kg' : 'wdh';   // ohne Gewicht (Körpergewicht) zählen die Wiederholungen
  const punkte = rows.filter((r) => (modus === 'kg' ? r.e > 0 : r.wmax > 0)).map((r) => ({ ...r, y: modus === 'kg' ? r.e : r.wmax }));
  const echte = D.maxe.filter((m) => m.ue === ueId).sort((a, b) => a.datum - b.datum);
  return { modus, punkte, echte };
}

function kraftHtml() {
  const liste = D.uebungen.map((u) => ({ u, ...kraftDaten(u.id) })).filter((x) => x.punkte.length || x.echte.length)
    .sort((a, b) => (b.punkte.length ? b.punkte[b.punkte.length - 1].ts : 0) - (a.punkte.length ? a.punkte[a.punkte.length - 1].ts : 0));
  if (!liste.length) return `<div class="leer"><h2>Noch keine Werte</h2><p>Aus deinen Sätzen wird hier geschätzt, wie viel du einmal schaffen würdest. So siehst du über Monate, ob du stärker wirst.</p></div>`;
  return `<p class="hinweis oben">Geschätztes Maximum für eine Wiederholung, berechnet aus dem besten Satz jedes Trainings.</p>
    <div class="liste">${liste.map(({ u, modus, punkte }) => {
      const l = punkte[punkte.length - 1], e = punkte[0];
      const diff = l && e && punkte.length > 1 ? l.y - e.y : 0;
      const einheit = modus === 'kg' ? 'kg' : 'Wdh.';
      return `<button class="zeile kraft" data-akt="kraftAuf" data-id="${u.id}">
        <div class="haupt"><b>${esc(u.name)}</b><small>${l ? (diff ? `${diff > 0 ? '+' : '−'}${rund1(Math.abs(diff))} ${einheit} seit ${fmtKurz.format(e.ts)}` : `${punkte.length === 1 ? 'Erster Wert' : 'Unverändert'}, ${vorWieLang(l.ts)}`) : 'Nur gemessene Werte'}</small></div>
        ${funke(punkte)}
        <span class="kraftwert"><span class="zahl">${l ? rund1(l.y) : '–'}</span><small>${einheit}</small></span>
      </button>`;
    }).join('')}</div>`;
}

// Kleine Verlaufslinie für die Liste
function funke(punkte) {
  punkte = punkte.slice(-20);   // die letzten 20 Trainings reichen für den Trend
  if (punkte.length < 2) return '<span class="funke"></span>';
  const b = 64, h = 26, ys = punkte.map((p) => p.y), lo = Math.min(...ys), hi = Math.max(...ys), sp = hi - lo || 1;
  const pts = punkte.map((p, i) => `${(2 + (i / (punkte.length - 1)) * (b - 4)).toFixed(1)},${(h - 3 - ((p.y - lo) / sp) * (h - 6)).toFixed(1)}`).join(' ');
  return `<svg class="funke" width="${b}" height="${h}" viewBox="0 0 ${b} ${h}" aria-hidden="true"><polyline points="${pts}" fill="none" stroke="var(--pin)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

const Kraft = {
  id: null, b: null, wahl: -1,

  auf(id) {
    this.id = id; this.wahl = -1;
    const u = finde('uebungen', id);
    this.b = Blatt.auf({ titel: u ? u.name : 'Übung', voll: true, html: this.html(), neu: () => this.html() });
    this.binde();
  },

  html() {
    const { modus, punkte, echte } = kraftDaten(this.id);
    const einheit = modus === 'kg' ? 'kg' : 'Wdh.';
    const l = punkte[punkte.length - 1], best = punkte.reduce((a, p) => (!a || p.y > a.y ? p : a), null);
    const echtBest = echte.reduce((a, m) => Math.max(a, m.g), 0);
    const i = this.wahl >= 0 && this.wahl < punkte.length ? this.wahl : punkte.length - 1, p = punkte[i];
    return `
      <div class="kennzahlen">
        <div><span class="zahl">${l ? rund1(l.y) : '–'}</span><small>aktuell, ${einheit}</small></div>
        <div><span class="zahl">${best ? rund1(best.y) : '–'}</span><small>Bestwert</small></div>
        ${modus === 'kg' ? `<div><span class="zahl">${echtBest ? kg(echtBest) : '–'}</span><small>gemessen</small></div>` : `<div><span class="zahl">${punkte.length}</span><small>${punkte.length === 1 ? 'Training' : 'Trainings'}</small></div>`}
      </div>
      ${punkte.length + echte.length ? `<div class="diagramm" id="diagramm">${this.diagramm(punkte, echte, i, modus)}</div>
        <p class="ablesung" id="ablesung">${p ? this.ablesung(p, modus) : ''}</p>
        ${modus === 'kg' ? `<div class="legende"><span><i class="l-linie"></i>geschätzt aus dem besten Satz</span>${echte.length ? '<span><i class="l-raute"></i>gemessener Maximalversuch</span>' : ''}</div>` : ''}` : ''}
      ${modus === 'kg' || !punkte.length ? `<button class="knopf zweit breit" data-akt="maxNeu">${ic('plus', 18)} Maximalversuch eintragen</button>` : ''}
      ${echte.length ? `<div class="gruppe-titel">Gemessene Maximalversuche</div><div class="gruppe">${[...echte].reverse().map((m) => `<div class="zeile"><div class="haupt"><b>${kg(m.g)} kg</b><small>${fmtMitJahr.format(m.datum)}</small></div><button class="rund klein" data-akt="maxWeg" data-id="${m.id}" aria-label="Eintrag löschen">${ic('x', 16)}</button></div>`).join('')}</div>` : ''}
      ${punkte.length ? `<div class="gruppe-titel">Alle Trainings</div>
        <div class="gruppe tabelle">
          <div class="zeile tkopf"><span>Datum</span><span>Bester Satz</span><span>${modus === 'kg' ? 'Geschätzt' : 'Meiste Wdh.'}</span></div>
          ${[...punkte].reverse().map((r) => `<div class="zeile"><span>${fmtMitJahr.format(r.ts)}</span><span>${this.satzText(r, true)}</span><span>${rund1(r.y)}${modus === 'kg' ? ' kg' : ''}</span></div>`).join('')}
        </div>` : ''}`;
  },

  ablesung(p, modus) {
    return `${fmtWochentag.format(p.ts)}: bester Satz ${this.satzText(p)}` + (modus === 'kg' ? `, geschätzt ${rund1(p.y)} kg` : '');
  },
  // Ohne Gewicht (Körpergewichtsübung ohne Zusatz) steht kein „0 kg“ da
  satzText(r, kurz = false) { return r.g > 0 ? `${vz(this.id)}${kg(r.g)} kg × ${r.w}` : kurz ? `${r.w} Wdh.` : `Körpergewicht × ${r.w}`; },

  // Liniendiagramm: eine Achse, Zeit nach rechts
  diagramm(punkte, echte, wahl, modus) {
    const B = 340, H = 190, L = 38, R = 12, O = 14, U = 24;
    const alleY = [...punkte.map((p) => p.y), ...(modus === 'kg' ? echte.map((m) => m.g) : [])];
    const alleT = [...punkte.map((p) => p.ts), ...(modus === 'kg' ? echte.map((m) => m.datum) : [])];
    let lo = Math.min(...alleY), hi = Math.max(...alleY);
    const rand = Math.max((hi - lo) * 0.15, modus === 'kg' ? 2.5 : 1);
    lo = Math.max(0, lo - rand); hi += rand;
    const stufe = [1, 2, 2.5, 5, 10, 20, 25, 50].find((s) => (hi - lo) / s <= 4) || 100;
    lo = Math.floor(lo / stufe) * stufe; hi = Math.ceil(hi / stufe) * stufe;
    const t0 = Math.min(...alleT), t1 = Math.max(...alleT), dt = t1 - t0 || 1;
    const x = (t) => (alleT.length < 2 || t1 === t0 ? (L + B - R) / 2 : L + ((t - t0) / dt) * (B - L - R));
    const y = (v) => O + (1 - (v - lo) / (hi - lo || 1)) * (H - O - U);
    let s = `<svg viewBox="0 0 ${B} ${H}" role="img" aria-label="Verlauf, ${punkte.length} Trainings. Die Werte stehen in der Tabelle darunter.">`;
    for (let v = lo; v <= hi + 1e-9; v += stufe) s += `<line class="gitter" x1="${L}" x2="${B - R}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}"/><text class="achse" x="${L - 7}" y="${(y(v) + 4).toFixed(1)}" text-anchor="end">${kg(v)}</text>`;
    s += `<text class="achse" x="${L}" y="${H - 5}">${fmtKurz.format(t0)}</text>`;
    if (t1 > t0) s += `<text class="achse" x="${B - R}" y="${H - 5}" text-anchor="end">${fmtKurz.format(t1)}</text>`;
    if (wahl >= 0 && punkte[wahl]) s += `<line class="lot" id="lot" x1="${x(punkte[wahl].ts).toFixed(1)}" x2="${x(punkte[wahl].ts).toFixed(1)}" y1="${O}" y2="${H - U}"/>`;
    if (punkte.length > 1) s += `<polyline class="linie" points="${punkte.map((p) => `${x(p.ts).toFixed(1)},${y(p.y).toFixed(1)}`).join(' ')}"/>`;
    s += punkte.map((p, i) => `<circle class="punkt ${i === wahl ? 'an' : ''}" data-i="${i}" cx="${x(p.ts).toFixed(1)}" cy="${y(p.y).toFixed(1)}" r="${punkte.length > 30 ? 2.5 : 4}"/>`).join('');
    if (modus === 'kg') s += echte.map((m) => { const cx = x(m.datum), cy = y(m.g); return `<path class="raute" d="M${cx.toFixed(1)} ${(cy - 6).toFixed(1)}l6 6-6 6-6-6z"/>`; }).join('');
    return s + '</svg>';
  },

  // Finger über das Diagramm: der nächste Punkt wird abgelesen
  binde() {
    const box = $('#diagramm', this.b.el);
    if (!box) return;
    const lies = (e) => {
      const svg = $('svg', box), punkte = $$('circle.punkt', svg);
      if (!punkte.length) return;
      const r = svg.getBoundingClientRect(), px = ((e.clientX - r.left) / r.width) * 340;
      let best = 0, abstand = Infinity;
      punkte.forEach((c, i) => { const a = Math.abs(+c.getAttribute('cx') - px); if (a < abstand) { abstand = a; best = i; } });
      if (best === this.wahl) return;
      this.wahl = best;
      const { modus, punkte: daten } = kraftDaten(this.id);
      punkte.forEach((c, i) => c.classList.toggle('an', i === best));
      const lot = $('#lot', svg); if (lot) { lot.setAttribute('x1', punkte[best].getAttribute('cx')); lot.setAttribute('x2', punkte[best].getAttribute('cx')); }
      $('#ablesung', this.b.el).textContent = this.ablesung(daten[best], modus);
    };
    box.addEventListener('pointerdown', (e) => { box.setPointerCapture(e.pointerId); lies(e); });
    box.addEventListener('pointermove', (e) => { if (e.buttons || e.pointerType === 'mouse') lies(e); });
  },
};

Object.assign(Akt, {
  quartal(el) { ui.quartal += +el.dataset.d; ui.alle = false; zeichne(); },
  alleTrainings() { ui.alle = true; zeichne(); },
  trainingAuf(el) {
    const t = finde('trainings', el.dataset.id);
    if (t) Blatt.auf({ titel: t.name, voll: true, html: trainingHtml(t) });
  },
  async trainingWeg(el) {
    if (!(await frage('Dieses Training wird gelöscht, mit allen Sätzen und Notizen.'))) return;
    entferne('trainings', el.dataset.id);
    Blatt.zu(); zeichne();
  },
  kraftAuf(el) { Kraft.auf(el.dataset.id); },
  maxNeu() {
    Blatt.auf({
      titel: 'Maximalversuch', aktion: { text: 'Sichern', akt: 'maxSichern' },
      html: `<div class="gruppe">${zahlfeld('Gewicht', 'id="max-g"', null, 'kg')}
        <label class="zeile feldzeile"><span>Datum</span><input type="date" id="max-d" value="${tagKey(Date.now())}" max="${tagKey(Date.now())}"></label></div>
        <p class="hinweis">Trag hier nur ein, was du wirklich einmal sauber geschafft hast.</p>`,
    });
    setTimeout(() => { const i = $('#max-g'); if (i) i.focus(); }, 350);
  },
  maxSichern() {
    const g = zahl($('#max-g').value), d = $('#max-d').value;
    if (!(g > 0)) return toast('Trag das Gewicht ein');
    const datum = d ? new Date(d + 'T12:00:00').getTime() : Date.now();
    setze('maxe', { id: neuId(), ue: Kraft.id, datum, g });
    Blatt.zu(); Blatt.frisch(); Kraft.binde(); zeichne();
  },
  maxWeg(el) {
    entferne('maxe', el.dataset.id);
    Blatt.frisch(); Kraft.binde(); zeichne();
  },
});
