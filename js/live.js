'use strict';
/* Laufendes Training: alle Übungen als Liste. Sätze in beliebiger Reihenfolge abhaken,
   Übungen tauschen, wenn ein Gerät besetzt ist, Pausentimer unten. */

const Live = {
  takt: null, sperre: null,
  get el() { return $('#live'); },

  auf(i = null) {
    if (!Aktiv.t) return;
    this.el.hidden = false;
    this.zeichne();
    this.el.getBoundingClientRect();
    this.el.classList.add('offen');
    if (i != null) this.zeige(i, false);
    clearInterval(this.takt);
    this.takt = setInterval(() => this.uhr(), 1000);
    this.wach(true);
  },
  zu() {
    this.el.classList.remove('offen');
    clearInterval(this.takt);
    this.wach(false);
    setTimeout(() => { if (!this.el.classList.contains('offen')) { this.el.hidden = true; this.el.innerHTML = ''; } }, 420);
    zeichne();
  },
  // Bildschirm während des Trainings anlassen, wo der Browser das erlaubt
  async wach(an) {
    try {
      if (an && navigator.wakeLock && !this.sperre) { this.sperre = await navigator.wakeLock.request('screen'); this.sperre.addEventListener('release', () => { this.sperre = null; }); }
      if (!an && this.sperre) { await this.sperre.release(); this.sperre = null; }
    } catch { /* nicht verfügbar */ }
  },

  zeichne() {
    const t = Aktiv.t;
    const y = $('#live-liste') ? $('#live-liste').scrollTop : 0;
    this.el.innerHTML = `
      <header class="live-kopf">
        <button class="rund" data-akt="liveZu" aria-label="Training einklappen">${ic('chevD')}</button>
        <div class="mitte"><b><i class="tagpunkt"></i><span>${esc(t.name)}</span></b><small id="live-uhr"></small></div>
        <button class="knopf klein zweit" data-akt="liveEnde">Beenden</button>
      </header>
      <div class="live-fortschritt"><i id="live-balken"></i></div>
      <div class="live-liste" id="live-liste">
        ${t.punkte.map((_, i) => `<article class="uekarte" data-i="${i}">${this.karte(i)}</article>`).join('')}
        <section class="schluss" id="live-schluss">${this.schluss()}</section>
      </div>
      <div class="pausenleiste" id="pausenleiste" hidden></div>`;
    $$('textarea', this.el).forEach(wachse);
    this.klassen();
    $('#live-liste').scrollTop = y;
    this.uhrLaenge = 0;
    this.uhr();
  },

  // Langer Name (etwa FREIES TRAINING): Schrift verkleinern, bis er neben die Uhr passt, statt ihn abzuschneiden
  titelPassen() {
    const b = $('.live-kopf .mitte b', this.el), s = b && $('span', b);
    if (!s) return;
    b.style.fontSize = '';
    for (let px = 25; px >= 16 && s.scrollWidth > s.clientWidth + 0.5; px--) b.style.fontSize = px + 'px';
  },

  // Zustand der Karten (eingeklappt, fertig) und Gesamtfortschritt
  klassen() {
    const t = Aktiv.t;
    let ok = 0, alle = 0;
    t.punkte.forEach((p, i) => {
      const a = arbeitsSaetze(p), f = a.filter((s) => s.ok).length;
      ok += f; alle += a.length;
      const el = $(`.uekarte[data-i="${i}"]`);
      if (el) { el.classList.toggle('zu', !!p.zu); el.classList.toggle('fertig', a.length > 0 && f === a.length); }
    });
    const b = $('#live-balken');
    if (b) b.style.width = (alle ? (ok / alle) * 100 : 0) + '%';
  },

  zeige(i, weich = true) {
    const el = $(`.uekarte[data-i="${i}"]`), box = $('#live-liste');
    // Abstand zur Liste selbst messen: offsetTop bezöge sich auf die ganze Live-Ansicht samt Kopf
    if (el && box) box.scrollTo({ top: box.scrollTop + el.getBoundingClientRect().top - box.getBoundingClientRect().top - 8, behavior: weich ? 'smooth' : 'auto' });
  },

  uhr() {
    const t = Aktiv.t, el = $('#live-uhr');
    if (!t || !el) return;
    el.textContent = uhr(Date.now() - t.start);
    if (el.textContent.length !== this.uhrLaenge) { this.uhrLaenge = el.textContent.length; this.titelPassen(); }
    this.pause();
  },

  // Pausentimer: läuft ab dem letzten abgehakten Satz rückwärts, danach sichtbar ins Plus
  pause() {
    const t = Aktiv.t, el = $('#pausenleiste');
    if (!el || !t) return;
    const soll = t.pauseSoll || 120, vergangen = t.pause ? (Date.now() - t.pause) / 1000 : Infinity;
    if (!t.pause || vergangen > soll + 600) { el.hidden = true; return; }
    const rest = soll - vergangen, drueber = rest < 0;
    const anzeige = drueber ? `+${uhr(-rest * 1000)}` : uhr(rest * 1000 + 999);
    if (el.hidden) {
      el.hidden = false;
      el.innerHTML = `<i class="pl-fuell"></i>
        <button class="pl-knopf" data-akt="pauseDelta" data-d="-15" aria-label="15 Sekunden weniger">−15</button>
        <div class="pl-mitte"><small id="pl-text"></small><span class="zahl" id="pl-zeit"></span></div>
        <button class="pl-knopf" data-akt="pauseDelta" data-d="15" aria-label="15 Sekunden mehr">+15</button>
        <button class="pl-knopf" data-akt="pauseAus" aria-label="Pause beenden">${ic('x', 18)}</button>`;
    }
    el.classList.toggle('drueber', drueber);
    if (drueber && !el.classList.contains('drueber-war')) { el.classList.add('drueber-war'); el.animate && el.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.04)' }, { transform: 'scale(1)' }], { duration: 420, easing: 'ease-out' }); }
    if (!drueber) el.classList.remove('drueber-war');
    $('#pl-zeit').textContent = anzeige;
    $('#pl-text').textContent = drueber ? 'Pause vorbei' : 'Pause';
    $('.pl-fuell', el).style.width = Math.min(100, Math.max(0, (vergangen / soll) * 100)) + '%';
  },

  // Eine Karte neu aufbauen, Scrollstand bleibt
  neu(i) {
    const el = $(`.uekarte[data-i="${i}"]`);
    if (el) { el.innerHTML = this.karte(i); $$('textarea', el).forEach(wachse); }
    const s = $('#live-schluss');
    if (s) s.innerHTML = this.schluss();
    this.klassen();
  },

  karte(i) {
    const t = Aktiv.t, p = t.punkte[i], ue = finde('uebungen', p.ue);
    const alt = letztes(p.ue, t.start);
    const a = arbeitsSaetze(p), fertig = a.filter((s) => s.ok).length;
    const statt = p.statt ? finde('uebungen', p.statt) : null;
    const unter = [statt ? `statt ${statt.name}` : ortVon(ue), `${fertig} von ${a.length} Sätzen`].filter(Boolean).join(', ');
    return `
      <header class="uek-kopf" data-akt="karteKlapp">
        <button class="uek-bild" data-akt="ueInfo" data-id="${esc(p.ue)}" aria-label="Bild und Anleitung">${vorschau(ue)}</button>
        <div class="haupt"><h2>${esc(ue ? ue.name : 'Gelöschte Übung')}</h2><small>${esc(unter)}</small></div>
        <span class="uek-fertig">${ic('check', 18)}</span>
        <button class="rund klein" data-akt="karteMenue" aria-label="Mehr zu dieser Übung">${ic('punkte', 18)}</button>
      </header>
      <div class="uek-inhalt">
        ${this.progression(p, alt)}
        <label class="notizkarte">${ic('notiz', 18)}<textarea data-ein="ueNotiz" data-ue="${esc(p.ue)}" rows="1" placeholder="Notiz, z. B. Sitzhöhe oder Bankwinkel">${esc(ue ? ue.notiz : '')}</textarea></label>
        <div class="liste saetze">${p.saetze.map((_, si) => this.satz(p, si, alt)).join('')}</div>
        <div class="satzknoepfe">
          <button class="textknopf" data-akt="satzPlus">${ic('plus', 16)} Satz</button>
          <button class="textknopf" data-akt="tauschen">${ic('tausch', 16)} Gerät besetzt</button>
        </div>
      </div>`;
  },

  // Doppelte Progression: letztes Mal in allen Arbeitssätzen das obere Ende erreicht, dann diesmal mehr Gewicht
  progression(p, alt) {
    if (!alt || !p.wmax) return '';
    const g = gewichtVon(finde('uebungen', p.ue));
    if (g && g.typ === 'koerper') return '';
    const l = alt.p.saetze.filter((s) => s.g > 0);
    if (l.length < 2 || !l.every((s) => s.w >= p.wmax)) return '';
    const naechst = this.naechstesGewicht(g, Math.max(...l.map((s) => s.g)));
    const offen = arbeitsSaetze(p).filter((x) => !x.ok);
    if (naechst && offen.length && offen.every((x) => x.g >= naechst)) return '';   // schon übernommen
    return `<button class="progression" ${naechst && offen.length ? `data-akt="progression" data-g="${naechst}"` : 'disabled'}>${ic('hoch', 18)}<div><b>Zeit für mehr Gewicht</b><small>Letztes Mal alle Sätze mit ${p.wmax} oder mehr Wiederholungen geschafft.${naechst && offen.length ? ` Antippen setzt ${kg(naechst)} kg für die offenen Sätze.` : ''}</small></div></button>`;
  },
  // Kleinster sinnvoller Schritt nach oben, so wie es ihn am Gerät gibt
  naechstesGewicht(g, jetzt) {
    if (!g) return jetzt + 2.5;
    if (g.typ === 'stack' || g.typ === 'kurzhantel') { const st = stufenVon(g); return st.find((w) => w > jetzt + 1e-9) || null; }
    if (g.typ === 'scheiben') return jetzt + (g.beidseitig === false ? 1.25 : 2.5);
    return jetzt + 2.5;
  },

  satz(p, si, alt) {
    const s = p.saetze[si];
    let unter = '';
    if (s.auf) unter = 'Aufwärmen';
    else {
      const k = +satzLabel(p, si) - 1, a = alt ? alt.p.saetze[k] : null;
      unter = a ? `Letztes Mal ${vz(p.ue)}${kg(a.g)} kg × ${a.w}` : (p.wmin && p.wmax ? `Ziel ${p.wmin} bis ${p.wmax} Wiederholungen` : '');
    }
    return `<div class="zeile satz ${s.ok ? 'ok' : ''} ${s.auf ? 'warm' : ''}" data-akt="satzAuf" data-si="${si}" data-wisch="satz">
      <span class="nr">${satzLabel(p, si)}</span>
      <div class="haupt">
        <div class="werte ${s.g == null ? 'offen' : ''}"><span class="z">${s.g == null ? '' : vz(p.ue)}${kg(s.g)}</span><span class="e">kg</span><span class="mal">×</span><span class="z">${s.w ?? '–'}</span></div>
        ${s.pr && s.ok ? `<small class="pr-zeile">${ic('stern', 14)} Neuer Bestwert</small>` : unter ? `<small>${unter}</small>` : ''}
      </div>
      <button class="haken ${s.ok ? 'an' : ''}" data-akt="satzOk" data-si="${si}" aria-label="Satz ${satzLabel(p, si)} ${s.ok ? 'wieder öffnen' : 'abhaken'}" aria-pressed="${!!s.ok}">${ic('check', 22)}</button>
    </div>`;
  },

  // Unterschied zwischen dem laufenden Training und dem Trainingstag, von dem es kommt.
  // Getauschte Übungen (Gerät besetzt) zählen als die ursprüngliche.
  planAenderung() {
    const t = Aktiv.t, plan = t && t.plan ? finde('plaene', t.plan) : null;
    if (!plan) return null;
    const name = (id) => { const u = finde('uebungen', id); return u ? u.name : 'Übung'; };
    const idVon = (p) => p.statt || p.ue;
    const alt = plan.punkte, neu = t.punkte;
    const teile = [];
    const neuIds = neu.map(idVon), altIds = alt.map((p) => p.ue);
    for (const p of neu) if (!altIds.includes(idVon(p))) teile.push(`+ ${name(idVon(p))}`);
    for (const p of alt) if (!neuIds.includes(p.ue)) teile.push(`− ${name(p.ue)}`);
    for (const p of neu) { const a = alt.find((x) => x.ue === idVon(p)), n = arbeitsSaetze(p).length; if (a && a.saetze !== n) teile.push(`${name(a.ue)}: ${a.saetze} → ${n} Sätze`); }
    const reihenfolge = neuIds.filter((id) => altIds.includes(id)).join() !== altIds.filter((id) => neuIds.includes(id)).join();
    if (reihenfolge) teile.push('Reihenfolge geändert');
    if (!teile.length) return null;
    const punkte = neu.map((p) => {
      const a = alt.find((x) => x.ue === idVon(p));
      return { ...(a || { wmin: 8, wmax: 12 }), ue: idVon(p), saetze: arbeitsSaetze(p).length };
    });
    return { plan, teile, punkte };
  },
  planUebernehmen() {
    const c = this.planAenderung();
    if (!c) return false;
    setze('plaene', { ...c.plan, punkte: c.punkte });
    return true;
  },

  schluss() {
    const t = Aktiv.t;
    const a = t.punkte.flatMap(arbeitsSaetze), n = a.filter((s) => s.ok).length;
    const c = this.planAenderung();
    return `
      ${t.punkte.length ? '' : `<div class="ue-kopf"><h2>Womit fängst du an?</h2><p>Füge die erste Übung hinzu.</p></div>`}
      <button class="knopf zweit breit" data-akt="liveUePlus">${ic('plus', 18)} Übung hinzufügen</button>
      ${c ? `<div class="aenderung"><b>Du hast den Ablauf geändert</b><ul>${c.teile.map((x) => `<li>${esc(x)}</li>`).join('')}</ul><button class="knopf zweit breit" data-akt="planUebernehmen">Im Trainingstag ${esc(c.plan.name)} speichern</button></div>` : ''}
      ${t.punkte.length ? `<button class="knopf haupt breit gross" data-akt="liveEnde">Training beenden</button><p class="hinweis mittig-text">${n} von ${a.length} Sätzen abgehakt. Offene Sätze und Aufwärmsätze werden nicht gespeichert.</p>` : ''}
      <button class="textknopf rot mittig" data-akt="liveVerwerfen">Training verwerfen</button>`;
  },

  punktVon(el) { return +el.closest('.uekarte').dataset.i; },

  abschliessen() {
    const t = Aktiv.t;
    const punkte = t.punkte.map((p) => ({
      ue: p.ue, marke: '', notiz: '',
      saetze: p.saetze.filter((s) => s.ok && !s.auf).map((s) => ({ g: s.g, w: s.w, ...(s.sch ? { sch: s.sch } : {}), ...(s.zu ? { zu: 1 } : {}) })),
    })).filter((p) => p.saetze.length);
    // Bestwerte gegenüber allem Bisherigen
    const best = [];
    for (const p of punkte) {
      const vor = Math.max(0, ...verlauf(p.ue).map((v) => v.e));
      const jetzt = Math.max(...p.saetze.map((s) => e1rm(s.g, s.w)));
      if (vor > 0 && jetzt > vor + 0.05) best.push({ ue: finde('uebungen', p.ue), jetzt, vor });
    }
    const vorher = t.plan ? [...D.trainings].reverse().find((x) => x.plan === t.plan && x.id !== t.id) : null;
    const fertig = setze('trainings', { id: t.id, plan: t.plan, name: t.name, farbe: t.farbe, start: t.start, ende: Date.now(), punkte });
    const vVol = vorher ? volumen(vorher) : 0, diff = vVol > 0 ? (volumen(fertig) - vVol) / vVol : null;
    const vergleich = diff == null ? '' : `<p class="vergleich ${diff > 0.005 ? 'mehr' : ''}">${Math.abs(diff) < 0.005 ? 'Genauso viel bewegt' : `${Math.round(Math.abs(diff) * 100)} % ${diff > 0 ? 'mehr' : 'weniger'} bewegt`} als beim letzten ${esc(t.name)} (${vorWieLang(vorher.start)})</p>`;
    Aktiv.t = null; Aktiv.sichern();
    ui.neuTag = tagKey(fertig.start);
    this.zu();
    Sync.abgleich();
    const min = Math.round((fertig.ende - fertig.start) / 60000);
    Blatt.auf({
      titel: 'Training gespeichert',
      html: `<div class="kennzahlen">
          <div><span class="zahl">${min < 60 ? min : Math.floor(min / 60) + ':' + String(min % 60).padStart(2, '0')}</span><small>${min < 60 ? 'Minuten' : 'Stunden'}</small></div>
          <div><span class="zahl">${satzZahl(fertig)}</span><small>Sätze</small></div>
          <div><span class="zahl">${Math.round(volumen(fertig)).toLocaleString('de-DE')}</span><small>kg bewegt</small></div>
        </div>
        ${vergleich}
        ${best.length ? `<div class="gruppe-titel">Neue Bestwerte</div><div class="gruppe">${best.map((b) => `<div class="zeile"><span class="stern">${ic('stern', 18)}</span><div class="haupt"><b>${esc(b.ue ? b.ue.name : 'Übung')}</b><small>Geschätztes Maximum ${rund1(b.jetzt)} kg, bisher ${rund1(b.vor)} kg</small></div></div>`).join('')}</div>` : ''}
        <button class="knopf haupt breit" data-akt="blattZu">Fertig</button>`,
    });
  },
  pauseStart(p) { Aktiv.t.pause = Date.now(); Aktiv.t.pauseSoll = pauseVon(p.ue); },
};

/* Übung tauschen, wenn das Gerät besetzt ist: nur für dieses Training */
const Tausch = {
  pi: 0, b: null,
  auf(pi) {
    this.pi = pi;
    const t = Aktiv.t, p = t.punkte[pi], orig = p.statt || p.ue, ue = finde('uebungen', orig);
    const plan = t.plan ? finde('plaene', t.plan) : null, pp = plan ? plan.punkte.find((x) => x.ue === orig) : null;
    const imTraining = new Set(t.punkte.map((x) => x.ue));
    const alts = [...(p.statt ? [orig] : []), ...((pp && pp.alt) || [])].filter((id, i, l) => l.indexOf(id) === i && id !== p.ue && finde('uebungen', id));
    const muskel = ue ? ue.muskel : '';
    const gleich = D.uebungen.filter((u) => u.muskel === muskel && u.id !== p.ue && u.id !== orig && !alts.includes(u.id) && !imTraining.has(u.id)).sort((a, b) => a.name.localeCompare(b.name, 'de'));
    const zeile = (u, zurueck) => `<button class="zeile" data-akt="tauschWahl" data-id="${u.id}"><div class="haupt"><b>${esc(u.name)}</b><small>${esc(zurueck ? 'Zurück zur ursprünglichen Übung' : [ortVon(u), imTraining.has(u.id) ? 'steht schon im Training' : ''].filter(Boolean).join(', '))}</small></div>${ic('tausch', 18)}</button>`;
    const html = `
      ${alts.length ? `<div class="gruppe-titel">${(pp && pp.alt && pp.alt.length) ? 'Deine Alternativen' : 'Zurück'}</div><div class="gruppe">${alts.map((id) => zeile(finde('uebungen', id), id === orig)).join('')}</div>` : ''}
      ${gleich.length ? `<div class="gruppe-titel">Auch für ${esc(muskel)}</div><div class="gruppe">${gleich.map((u) => zeile(u)).join('')}</div>` : ''}
      <button class="knopf zweit breit" data-akt="tauschSuche">${ic('suche', 18)} Andere Übung suchen</button>
      ${pp ? '<p class="hinweis">Was du über die Suche wählst, wird als Alternative im Trainingstag gemerkt.</p>' : ''}`;
    this.b = Blatt.auf({ titel: `${ue ? ue.name : 'Übung'} tauschen`, voll: true, html });
  },
  async wahl(id, merken = false) {
    const t = Aktiv.t, p = t.punkte[this.pi], orig = p.statt || p.ue;
    if (p.saetze.some((s) => s.ok) && !(await frage('Bereits abgehakte Sätze dieser Übung gehen beim Tauschen verloren.', 'Tauschen', false))) return;
    const warm = p.saetze.filter((s) => s.auf).length;
    const n = Aktiv.punkt(id, arbeitsSaetze(p).length || 3, p.wmin, p.wmax, warm);
    if (id !== orig) n.statt = orig;
    t.punkte[this.pi] = n;
    if (merken && t.plan) {
      const plan = finde('plaene', t.plan), pp = plan && plan.punkte.find((x) => x.ue === orig);
      if (pp && id !== orig && !(pp.alt || []).includes(id)) { pp.alt = [...(pp.alt || []), id]; setze('plaene', plan); }
    }
    Aktiv.sichern();
    if (this.b) this.b.zu();
    Live.neu(this.pi);
  },
};

Object.assign(Akt, {
  start(el) {
    if (Aktiv.t) { toast('Es läuft schon ein Training'); return Live.auf(); }
    const plan = el.dataset.plan ? finde('plaene', el.dataset.plan) : null;
    if (plan && !plan.punkte.length) return toast('Dieser Trainingstag hat noch keine Übungen');
    Aktiv.starte(el.dataset.plan);
    Live.auf();
  },
  liveAuf() { Live.auf(); },
  liveZu() { Live.zu(); },
  karteKlapp(el, e) {
    if (e.target.closest('button')) return;
    const p = Aktiv.t.punkte[Live.punktVon(el)];
    p.zu = !p.zu; Aktiv.sichern(); Live.klassen();
  },
  karteMenue(el) {
    const pi = Live.punktVon(el), n = Aktiv.t.punkte.length, p = Aktiv.t.punkte[pi];
    const ue = finde('uebungen', p.ue);
    Blatt.auf({ titel: ue ? ue.name : 'Übung', html: `<div class="gruppe">
      <button class="zeile" data-akt="karteInfo" data-id="${esc(p.ue)}">${ic('info', 18)}<div class="haupt"><b>Bild und Anleitung</b></div></button>
      <button class="zeile" data-akt="karteHoch" data-i="${pi}" ${pi === 0 ? 'disabled' : ''}>${ic('chevU', 18)}<div class="haupt"><b>Nach oben</b></div></button>
      <button class="zeile" data-akt="karteRunter" data-i="${pi}" ${pi === n - 1 ? 'disabled' : ''}>${ic('chevD', 18)}<div class="haupt"><b>Nach unten</b></div></button>
      ${arbeitsSaetze(p).length > 1 ? `<button class="zeile" data-akt="satzMinus" data-i="${pi}">${ic('minus', 18)}<div class="haupt"><b>Letzten Satz entfernen</b></div></button>` : ''}
      <button class="zeile" data-akt="aufwaermen" data-i="${pi}">${ic('flamme', 18)}<div class="haupt"><b>${p.saetze.some((s) => s.auf) ? 'Aufwärmsätze entfernen' : 'Aufwärmsätze hinzufügen'}</b></div></button>
      <button class="zeile rotzeile" data-akt="punktRaus" data-i="${pi}">${ic('muell', 18)}<div class="haupt"><b>Aus dem Training nehmen</b></div></button>
    </div>` });
  },
  karteInfo(el) { Akt.blattZu(el); UeInfo.auf({ ueId: el.dataset.id }); },
  karteHoch(el) { Akt.blattZu(el); const i = +el.dataset.i, l = Aktiv.t.punkte; [l[i - 1], l[i]] = [l[i], l[i - 1]]; Aktiv.sichern(); Live.zeichne(); Live.zeige(i - 1); },
  karteRunter(el) { Akt.blattZu(el); const i = +el.dataset.i, l = Aktiv.t.punkte; [l[i + 1], l[i]] = [l[i], l[i + 1]]; Aktiv.sichern(); Live.zeichne(); Live.zeige(i + 1); },
  satzMinus(el) {
    Akt.blattZu(el);
    const p = Aktiv.t.punkte[+el.dataset.i];
    for (let j = p.saetze.length - 1; j >= 0; j--) if (!p.saetze[j].auf) { p.saetze.splice(j, 1); break; }
    Aktiv.sichern(); Live.neu(+el.dataset.i);
  },
  aufwaermen(el) {
    Akt.blattZu(el);
    const pi = +el.dataset.i, p = Aktiv.t.punkte[pi];
    if (p.saetze.some((s) => s.auf)) p.saetze = p.saetze.filter((s) => !s.auf);
    else {
      const a = arbeitsSaetze(p)[0];
      // So viele Aufwärmsätze, wie im Trainingstag für diese Übung eingestellt sind, sonst der Standard
      const plan = Aktiv.t.plan ? finde('plaene', Aktiv.t.plan) : null, pp = plan ? plan.punkte.find((x) => x.ue === (p.statt || p.ue)) : null;
      p.saetze.unshift(...Array.from({ length: (pp && pp.warmN) || aufwaermAnzahl() }, () => ({ ...aufwaermSatz(finde('uebungen', p.ue), a && a.g), w: 10, ok: false, auf: 1 })));
    }
    Aktiv.sichern(); Live.neu(pi);
  },
  punktRaus(el) {
    Akt.blattZu(el);
    Aktiv.t.punkte.splice(+el.dataset.i, 1);
    Aktiv.sichern(); Live.zeichne();
  },
  tauschen(el) { Tausch.auf(Live.punktVon(el)); },
  tauschWahl(el) { Tausch.wahl(el.dataset.id); },
  tauschSuche() { UeWahl.auf((id) => Tausch.wahl(id, true)); },
  pauseDelta(el) { const t = Aktiv.t; t.pauseSoll = Math.max(15, (t.pauseSoll || 120) + +el.dataset.d); Aktiv.sichern(); Live.pause(); },
  pauseAus() { Aktiv.t.pause = 0; Aktiv.sichern(); Live.pause(); },
  async liveEnde() {
    const n = Aktiv.t.punkte.reduce((a, p) => a + p.saetze.filter((s) => s.ok && !s.auf).length, 0);
    if (!n) return Akt.liveVerwerfen();
    const offen = Aktiv.t.punkte.reduce((a, p) => a + p.saetze.filter((s) => !s.ok && !s.auf).length, 0);
    if (offen && !(await frage(`${offen} ${offen === 1 ? 'Satz ist' : 'Sätze sind'} noch offen und ${offen === 1 ? 'wird' : 'werden'} nicht gespeichert.`, 'Trotzdem beenden', false))) return;
    const c = Live.planAenderung();
    if (c && await frage(`Du hast den Ablauf geändert (${c.teile.join(', ')}). Im Trainingstag ${c.plan.name} speichern?`, 'Im Plan speichern', false, 'Nur diesmal')) Live.planUebernehmen();
    Live.abschliessen();
  },
  async liveVerwerfen() {
    if (!(await frage('Das laufende Training wird verworfen, nichts davon wird gespeichert.', 'Verwerfen'))) return;
    Aktiv.t = null; Aktiv.sichern(); Live.zu();
  },
  liveUePlus() {
    UeWahl.auf((id) => {
      Aktiv.t.punkte.push(Aktiv.punkt(id));
      Aktiv.sichern();
      Live.zeichne();
      Live.zeige(Aktiv.t.punkte.length - 1);
    });
  },
  planUebernehmen() {
    if (Live.planUebernehmen()) { toast('Trainingstag aktualisiert'); const s = $('#live-schluss'); if (s) s.innerHTML = Live.schluss(); }
  },
  satzAuf(el) { Satz.auf(Live.punktVon(el), +el.dataset.si); },
  satzOk(el, e) {
    e.stopPropagation();
    const pi = Live.punktVon(el), p = Aktiv.t.punkte[pi], s = p.saetze[+el.dataset.si];
    if (!s.ok && (s.g == null || !(s.w > 0))) return Satz.auf(pi, +el.dataset.si);
    s.ok = !s.ok;
    if (s.ok) Live.pauseStart(p);
    Live.nachHaken(pi, +el.dataset.si, s.ok);
  },
  // Vorschlag übernehmen: neues Gewicht für alle offenen Arbeitssätze, Aufwärmen passt sich an
  progression(el) {
    const pi = Live.punktVon(el), p = Aktiv.t.punkte[pi], ue = finde('uebungen', p.ue), g = gewichtVon(ue), neu = +el.dataset.g;
    for (const s of arbeitsSaetze(p)) {
      if (s.ok) continue;
      s.g = neu; s.hand = 1; delete s.zu;
      if (p.wmin) s.w = p.wmin;   // mit mehr Gewicht wieder unten im Bereich anfangen
      if (g && g.typ === 'scheiben') s.sch = Satz.scheibenAus(neu, g); else delete s.sch;
    }
    for (const w of p.saetze) if (w.auf && !w.ok && !w.hand) Object.assign(w, aufwaermSatz(ue, neu));
    Aktiv.sichern(); Live.neu(pi);
    toast(`${kg(neu)} kg für die offenen Sätze`);
  },
  satzPlus(el) {
    const pi = Live.punktVon(el), p = Aktiv.t.punkte[pi], a = arbeitsSaetze(p), l = a[a.length - 1];
    p.saetze.push(l ? { g: l.g, w: l.w, ok: false, ...(l.sch ? { sch: [...l.sch] } : {}), ...(l.zu ? { zu: 1 } : {}) } : { g: null, w: null, ok: false });
    Aktiv.sichern(); Live.neu(pi);
  },
});

// Geschätztes Maximum über allem Bisherigen (frühere Trainings und schon abgehakte Sätze heute)? Gibt den neuen Wert zurück.
Live.bestwertPruefen = function (p, s) {
  if (s.auf) return 0;
  const e = e1rm(s.g, s.w);
  if (!(e > 0)) return 0;
  const vorher = Math.max(0, ...verlauf(p.ue).map((v) => v.e));
  const heute = Math.max(0, ...p.saetze.filter((x) => x !== s && x.ok && !x.auf && x.pr).map((x) => e1rm(x.g, x.w)));
  if (vorher <= 0 || e <= Math.max(vorher, heute) + 0.05) { delete s.pr; return 0; }
  s.pr = 1;
  return e;
};

// Nach dem Abhaken: fertige Übung einklappen und zur nächsten offenen springen
Live.nachHaken = function (pi, si, ok) {
  const p = Aktiv.t.punkte[pi], fertig = p.saetze.every((x) => x.ok);
  const bestwert = ok && this.bestwertPruefen(p, p.saetze[si]);
  if (!ok) delete p.saetze[si].pr;
  if (ok && fertig) p.zu = true;
  Aktiv.sichern();
  this.neu(pi);
  if (ok && !fertig) { const h = $(`.uekarte[data-i="${pi}"] .satz[data-si="${si}"] .haken`); if (h) h.classList.add('frisch'); }
  if (bestwert) {
    const z = $(`.uekarte[data-i="${pi}"] .satz[data-si="${si}"]`);
    if (z) z.classList.add('jubel');
    toast(`Neuer Bestwert, geschätzt ${rund1(bestwert)} kg`);
  }
  if (ok && fertig) {
    const naechste = Aktiv.t.punkte.findIndex((x, j) => j !== pi && x.saetze.some((y) => !y.ok));
    if (naechste >= 0) { Aktiv.t.punkte[naechste].zu = false; this.klassen(); setTimeout(() => this.zeige(naechste), 120); }
  }
  this.uhr();
};

Object.assign(Ein, {
  // Notiz zur Übung: gehört zur Übung selbst und steht bei jedem Training wieder da
  ueNotiz(el) {
    wachse(el);
    const ue = finde('uebungen', el.dataset.ue);
    if (!ue) return;
    ue.notiz = el.value; ue.u = Date.now();
    sichern();
  },
});
