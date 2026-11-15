'use strict';
/* Satz-Eingabe: Gewicht so einstellen wie am Gerät (Stift umstecken, Scheiben aufstecken, Hantel greifen)
   und die Wiederholungen zählen. Änderungen landen sofort im laufenden Training. */

// Zahl wechseln wie ein Zählwerk: größer rollt von unten herein, kleiner von oben
function rollen(el, wert, text) {
  if (!el) return;
  const alt = parseFloat(el.dataset.v);
  el.dataset.v = wert;
  if (el.textContent === text) return;
  el.textContent = text;
  if (Number.isNaN(alt) || !el.animate) return;
  const r = wert > alt ? 1 : -1;
  el.animate([{ transform: `translateY(${r * 0.32}em)`, opacity: 0.2 }, { transform: 'none', opacity: 1 }], { duration: 220, easing: 'cubic-bezier(.2, .9, .3, 1)' });
}

const Satz = {
  pi: 0, si: 0, b: null, typ: 'frei', g: null, vorher: null,

  get p() { return Aktiv.t.punkte[this.pi]; },
  get s() { return this.p.saetze[this.si]; },

  auf(pi, si) {
    this.pi = pi; this.si = si;
    const ue = finde('uebungen', this.p.ue);
    this.g = gewichtVon(ue);
    this.typ = this.g ? this.g.typ : 'frei';
    const s = this.s;
    // Vorbild ist der vorige Satz derselben Art (Aufwärmen oder Arbeit)
    let davor = null;
    for (let j = si - 1; j >= 0; j--) if (!!this.p.saetze[j].auf === !!s.auf) { davor = this.p.saetze[j]; break; }
    // Leere Sätze sinnvoll vorbelegen
    if (s.g == null) {
      if (davor && davor.g != null) { s.g = davor.g; if (davor.sch) s.sch = [...davor.sch]; if (davor.zu) s.zu = 1; }
      else if (this.typ === 'stack' || this.typ === 'kurzhantel') s.g = stufenVon(this.g)[0];
      else if (this.typ === 'scheiben') s.g = this.g.stange ?? 20;
      else s.g = 0;
    }
    if (s.w == null) s.w = (davor && davor.w) || (s.auf ? 10 : this.p.wmin) || 10;
    if (this.typ === 'scheiben' && !s.sch) s.sch = this.scheibenAus(s.g);
    this.vorher = JSON.stringify([s.g, s.w]);
    this.b = Blatt.auf({ titel: `${s.auf ? 'Aufwärmen' : 'Satz ' + satzLabel(this.p, si)}: ${ue ? ue.name : 'Übung'}`, html: this.html(), onZu: () => this.fertig() });
    this.b.el.classList.add('satzblatt');
    this.stiftY = null;
    this.nachZeichnen(true);
  },

  html() {
    const s = this.s, p = this.p;
    const ziel = p.wmin && p.wmax ? `<small>Ziel ${p.wmin} bis ${p.wmax}</small>` : '';
    return `
      <div class="wert" data-akt="wertTippen" role="button" tabindex="0" aria-label="Gewicht eintippen">
        <span class="zahl" id="pk-zahl">${kg(s.g)}</span><span class="einheit">kg${this.typ === 'kurzhantel' ? ' je Hantel' : this.typ === 'koerper' ? ' Zusatz' : ''}</span>
      </div>
      <div id="pk-bild" class="pk-bild t-${this.typ}">${this.bild()}</div>
      <div class="wdh">
        <button class="rund gross" data-akt="wdh" data-d="-1" aria-label="Eine Wiederholung weniger">${ic('minus', 26)}</button>
        <div class="wdh-mitte"><span class="zahl" id="pk-wdh">${s.w}</span><small>Wiederholungen</small>${ziel}</div>
        <button class="rund gross" data-akt="wdh" data-d="1" aria-label="Eine Wiederholung mehr">${ic('plus', 26)}</button>
      </div>
      <button class="knopf haupt breit gross" data-akt="satzFertig">${ic('check')} ${s.ok ? 'Übernehmen' : 'Satz abhaken'}</button>`;
  },

  bild() {
    const s = this.s, g = this.g;
    if (this.typ === 'stack') {
      const st = stufenVon(g), sel = this.stackIndex(st), lb = (w) => Math.round(w * 2.20462);
      return `<div class="stack" id="pk-stack"><div class="st-turm">
          <span class="st-kopf">${g.zusatz > 0 ? `<span class="st-zusatz ${s.zu ? 'an' : ''}">+${kg(g.zusatz)}</span>` : ''}</span>
          ${st.map((w, i) => `<button class="platte ${i <= sel ? 'oben' : 'unten'} ${i === sel ? 'pin' : ''}" data-akt="stackWahl" data-i="${i}" aria-label="${kg(w)} Kilo stecken"><span class="aufkleber">${kg(w)}</span><span class="lb">${lb(w)}</span></button>`).join('')}
          <span class="st-stift" id="pk-stift"></span>
        </div></div>
        ${g.zusatz > 0 ? `<button class="chip ${s.zu ? 'an' : ''}" data-akt="stackZusatz" aria-pressed="${!!s.zu}">${ic('plus', 15)} ${kg(g.zusatz)} kg Zusatzgewicht</button>` : ''}`;
    }
    if (this.typ === 'scheiben') {
      const mult = g.beidseitig === false ? 1 : 2, summe = s.sch.reduce((a, b) => a + b, 0), stange = g.stange ?? 20;
      const rechnung = [stange > 0 ? `${kg(stange)} kg ${mult === 2 ? 'Stange' : 'leer'}` : '', summe > 0 ? (mult === 2 ? (stange > 0 ? `2 × ${kg(summe)} kg` : `je Seite ${kg(summe)} kg`) : `${kg(summe)} kg Scheiben`) : ''].filter(Boolean).join(' + ') || 'Noch nichts aufgelegt';
      const neu = this.neuIdx; this.neuIdx = null;
      return `<div class="stange ${stange > 0 ? '' : 'horn'}">${stange > 0 ? '<span class="griffstueck"></span>' : '<span class="hebel"></span>'}<span class="bund"></span>
          <div class="aufgesteckt">${s.sch.map((w, i) => `<button class="sch ${this.schKlasse(w)} ${i === neu ? 'neu' : ''}" data-akt="schWeg" data-i="${i}" aria-label="${kg(w)} Kilo abnehmen"><span>${kg(w)}</span></button>`).join('')}${s.sch.length && stange > 0 ? '<span class="verschluss"></span>' : ''}</div>
          <span class="huelse"></span></div>
        <p class="rechnung">${rechnung}</p>
        <div class="schwahl">${SCHEIBEN.map((w) => `<button class="schknopf ${this.schKlasse(w)}" data-akt="schDazu" data-w="${w}" aria-label="${kg(w)} Kilo auflegen">${kg(w)}</button>`).join('')}</div>
        <p class="hinweis">Scheibe antippen legt sie auf, auf der Stange nimmt sie wieder ab.</p>`;
    }
    if (this.typ === 'kurzhantel') {
      const st = stufenVon(g), max = st[st.length - 1] || 1;
      return `<div class="kh-zeiger"></div><div class="kh-leiste" id="pk-kh">${st.map((w) => `<button class="kh ${w === s.g ? 'an' : ''}" data-akt="khWahl" data-g="${w}" style="--h:${Math.round(26 + 44 * Math.sqrt(w / max))}px;--w:${Math.round(11 + 11 * Math.sqrt(w / max))}px" aria-label="${kg(w)} Kilo"><span class="kh-bild"><i></i><b></b><i></i></span><span class="kh-zahl">${kg(w)}</span></button>`).join('')}</div>`;
    }
    return `<div class="schritte">${[-5, -2.5, 2.5, 5].map((d) => `<button class="knopf zweit" data-akt="schritt" data-d="${d}">${d > 0 ? '+' : '−'}${kg(Math.abs(d))}</button>`).join('')}</div>
      ${this.typ === 'koerper' ? '<p class="hinweis">Bei 0 zählt nur dein Körpergewicht.</p>' : ''}`;
  },

  schKlasse: (w) => 's' + String(w).replace('.', '_'),
  stackIndex(st) {
    const s = this.s, basis = s.zu && this.g.zusatz > 0 ? s.g - this.g.zusatz : s.g;
    let best = 0;
    st.forEach((w, i) => { if (Math.abs(w - basis) < Math.abs(st[best] - basis)) best = i; });
    return best;
  },
  // Gesamtgewicht in Scheiben je Seite zerlegen, schwerste zuerst
  scheibenAus(gesamt, g = this.g) {
    const mult = g.beidseitig === false ? 1 : 2;
    let rest = (gesamt - (g.stange ?? 20)) / mult;
    const out = [];
    for (const w of SCHEIBEN) while (rest >= w - 1e-9 && out.length < 12) { out.push(w); rest -= w; }
    return out;
  },

  // Nach einer Änderung nur das Nötige anfassen, damit nichts springt
  nachZeichnen(start = false) {
    const s = this.s;
    const z = $('#pk-zahl', this.b.el); if (z && !$('input', z)) rollen(z, s.g, kg(s.g));
    rollen($('#pk-wdh', this.b.el), s.w, String(s.w));
    if (this.typ === 'stack') {
      const st = stufenVon(this.g), sel = this.stackIndex(st), box = $('#pk-stack', this.b.el), platten = $$('.platte', box);
      platten.forEach((el, i) => { el.classList.toggle('oben', i <= sel); el.classList.toggle('unten', i > sel); el.classList.toggle('pin', i === sel); });
      const z = $('.st-zusatz', box); if (z) z.classList.toggle('an', !!this.s.zu);
      const el = platten[sel];
      if (el && start) box.scrollTop += el.getBoundingClientRect().top - box.getBoundingClientRect().top - (box.clientHeight - el.offsetHeight) / 2;
      if (el) this.stiftSetzen(el, !start);
    }
    if (this.typ === 'kurzhantel') {
      const box = $('#pk-kh', this.b.el);
      if (start) {
        const el = $('.kh.an', box) || $('.kh', box);
        if (el) box.scrollLeft = el.offsetLeft - box.clientWidth / 2 + el.offsetWidth / 2;
        let raf = 0;
        box.addEventListener('scroll', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => this.khMitte(box)); }, { passive: true });
      }
    }
  },
  // Steckstift umstecken: herausziehen, zur neuen Platte fahren, wieder einstecken
  stiftSetzen(platte, bewegt) {
    const stift = $('#pk-stift', this.b.el), y = platte.offsetTop + platte.offsetHeight / 2 - 3;   // gehobene Platte sitzt 3 px höher
    const alt = this.stiftY;
    this.stiftY = y;
    stift.style.transform = `translateY(${y}px)`;
    if (!bewegt || alt == null || alt === y || !stift.animate || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    stift.animate([
      { transform: `translateY(${alt}px) scale(1)`, easing: 'cubic-bezier(.3, 0, .3, 1)' },
      { transform: `translateY(${alt}px) scale(1.45)`, offset: 0.22, easing: 'cubic-bezier(.45, 0, .2, 1)' },
      { transform: `translateY(${y}px) scale(1.45)`, offset: 0.74, easing: 'cubic-bezier(.3, 0, .3, 1)' },
      { transform: `translateY(${y}px) scale(1)` },
    ], { duration: Math.min(560, 300 + Math.abs(y - alt) * 0.8) });
    // Der Turm ruckt kurz an, sobald der Stift sitzt
    const box = $('#pk-stack', this.b.el);
    box.classList.remove('probe'); void box.offsetWidth; box.classList.add('probe');
  },
  // Die Hantel in der Mitte der Leiste ist die gewählte
  khMitte(box) {
    const mitte = box.scrollLeft + box.clientWidth / 2;
    let best = null, abstand = Infinity;
    for (const el of $$('.kh', box)) {
      const a = Math.abs(el.offsetLeft + el.offsetWidth / 2 - mitte);
      if (a < abstand) { abstand = a; best = el; }
    }
    if (!best || best.classList.contains('an')) return;
    $$('.kh.an', box).forEach((el) => el.classList.remove('an'));
    best.classList.add('an');
    this.s.g = zahl(best.dataset.g);
    rollen($('#pk-zahl', this.b.el), this.s.g, kg(this.s.g));
    Aktiv.sichern();
  },

  setzeGewicht(n) {
    const s = this.s;
    s.g = Math.max(0, Math.round(n * 100) / 100);
    delete s.zu;
    if (this.typ === 'scheiben') { s.sch = this.scheibenAus(s.g); $('#pk-bild', this.b.el).innerHTML = this.bild(); }
    if (this.typ === 'kurzhantel') { $('#pk-bild', this.b.el).innerHTML = this.bild(); this.nachZeichnen(true); }
    if (this.typ === 'stack') { $('#pk-bild', this.b.el).innerHTML = this.bild(); this.nachZeichnen(true); }
    this.nachZeichnen();
    Aktiv.sichern();
  },

  // Beim Schließen: geändertes Gewicht auf die folgenden, noch offenen Sätze übertragen
  fertig() {
    const s = this.s, p = this.p;
    if (JSON.stringify([s.g, s.w]) !== this.vorher) {
      const altG = JSON.parse(this.vorher)[0];
      s.hand = 1;
      if (s.g !== altG && !s.auf) for (let j = this.si + 1; j < p.saetze.length; j++) {
        const n = p.saetze[j];
        if (n.ok || n.hand || n.auf) continue;
        n.g = s.g;
        if (s.sch) n.sch = [...s.sch]; else delete n.sch;
        if (s.zu) n.zu = 1; else delete n.zu;
        if (n.w == null) n.w = s.w;
      }
    }
    // Erstes Arbeitsgewicht geändert: offene Aufwärmsätze neu berechnen
    if (!s.auf && arbeitsSaetze(p)[0] === s) for (const w of p.saetze) if (w.auf && !w.ok && !w.hand) Object.assign(w, aufwaermSatz(finde('uebungen', p.ue), s.g));
    Aktiv.sichern();
    Live.neu(this.pi);
    this.b = null;
  },
};

Object.assign(Akt, {
  stackWahl(el) {
    const st = stufenVon(Satz.g), s = Satz.s;
    s.g = st[+el.dataset.i] + (s.zu && Satz.g.zusatz > 0 ? Satz.g.zusatz : 0);
    Satz.nachZeichnen(); Aktiv.sichern();
  },
  stackZusatz(el) {
    const s = Satz.s, st = stufenVon(Satz.g), basis = st[Satz.stackIndex(st)];
    if (s.zu) delete s.zu; else s.zu = 1;
    s.g = basis + (s.zu ? Satz.g.zusatz : 0);
    el.classList.toggle('an', !!s.zu); el.setAttribute('aria-pressed', !!s.zu);
    Satz.nachZeichnen(); Aktiv.sichern();
  },
  schDazu(el) {
    const s = Satz.s, g = Satz.g;
    if (s.sch.length >= 12) return toast('Mehr passt nicht auf die Stange');
    s.sch.push(+el.dataset.w); s.sch.sort((a, b) => b - a);
    Satz.neuIdx = s.sch.lastIndexOf(+el.dataset.w);   // nur die neue Scheibe gleitet auf
    s.g = (g.stange ?? 20) + (g.beidseitig === false ? 1 : 2) * s.sch.reduce((a, b) => a + b, 0);
    $('#pk-bild', Satz.b.el).innerHTML = Satz.bild(); Satz.nachZeichnen(); Aktiv.sichern();
  },
  schWeg(el) {
    const s = Satz.s, g = Satz.g;
    if (el.classList.contains('runter')) return;
    // Erst abziehen lassen, dann neu zeichnen
    if (el.animate && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.classList.add('runter');
      el.animate([{ transform: 'none', opacity: 1 }, { transform: 'translate(34px, 6px) rotate(4deg)', opacity: 0 }], { duration: 200, easing: 'cubic-bezier(.4, 0, 1, 1)', fill: 'forwards' })
        .finished.then(() => Akt.schWegJetzt(el));
      return;
    }
    Akt.schWegJetzt(el);
  },
  schWegJetzt(el) {
    const s = Satz.s, g = Satz.g;
    s.sch.splice(+el.dataset.i, 1);
    s.g = (g.stange ?? 20) + (g.beidseitig === false ? 1 : 2) * s.sch.reduce((a, b) => a + b, 0);
    $('#pk-bild', Satz.b.el).innerHTML = Satz.bild(); Satz.nachZeichnen(); Aktiv.sichern();
  },
  khWahl(el) {
    const box = $('#pk-kh', Satz.b.el);
    box.scrollTo({ left: el.offsetLeft - box.clientWidth / 2 + el.offsetWidth / 2, behavior: 'smooth' });
  },
  schritt(el) { Satz.setzeGewicht((Satz.s.g || 0) + +el.dataset.d); },
  wdh(el) {
    const s = Satz.s;
    s.w = Math.min(99, Math.max(1, (s.w || 0) + +el.dataset.d));
    Satz.nachZeichnen(); Aktiv.sichern();
  },
  // Gewicht direkt eintippen, falls das Gerät etwas anderes anzeigt als erwartet
  wertTippen(el) {
    if ($('input', el)) return;
    const span = $('.zahl', el);
    span.innerHTML = `<input inputmode="decimal" enterkeyhint="done" value="${kg(Satz.s.g)}" aria-label="Gewicht in Kilo">`;
    const inp = $('input', span);
    // Feld wächst mit der Zahl, damit auch 102,5 ganz zu sehen ist
    const breite = () => { inp.style.width = `${Math.max(2, inp.value.length) + 0.4}ch`; };
    breite(); inp.addEventListener('input', breite);
    Satz.b.el.classList.add('tippt');   // Gewichtsbild und Wiederholungen weg, solange die Tastatur offen ist
    inp.focus(); inp.select();
    const fertig = () => {
      const n = zahl(inp.value);
      Satz.b.el.classList.remove('tippt');
      span.textContent = kg(Satz.s.g);
      if (n != null && n !== Satz.s.g) Satz.setzeGewicht(n);
    };
    inp.addEventListener('blur', fertig, { once: true });
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') inp.blur(); });
  },
  satzFertig() {
    const s = Satz.s;
    if (s.g == null || !(s.w > 0)) return toast('Gewicht und Wiederholungen fehlen noch');
    const neu = !s.ok;
    if (neu) { s.ok = true; Live.pauseStart(Satz.p); }
    const pi = Satz.pi, si = Satz.si;
    Satz.b.zu();
    if (neu) Live.nachHaken(pi, si, true);
  },
});
