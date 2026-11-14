'use strict';
/* Blätter: von unten einfahrende Flächen. Lassen sich am Kopf nach unten wegziehen. */

const Blatt = {
  stapel: [],

  // opt: titel, html, voll (fast bildschirmhoch), aktion {text, akt}, onZu, neu (liefert frisches HTML)
  auf(opt) {
    const huelle = document.createElement('div');
    huelle.className = 'blatt-huelle';
    huelle.innerHTML = `
      <div class="schleier" data-akt="blattZu"></div>
      <section class="blatt ${opt.voll ? 'voll' : ''}" role="dialog" aria-label="${esc(opt.titel)}">
        <header class="blatt-kopf">
          <span class="griff"></span>
          <button class="rund" data-akt="blattZu" aria-label="Schließen">${ic('x', 18)}</button>
          <h3>${esc(opt.titel)}</h3>
          ${opt.aktion ? `<button class="knopf klein haupt" data-akt="${opt.aktion.akt}">${esc(opt.aktion.text)}</button>` : '<span class="platz"></span>'}
        </header>
        <div class="blatt-inhalt">${opt.html}</div>
      </section>`;
    $('#blaetter').append(huelle);
    const b = {
      el: huelle, flaeche: $('.blatt', huelle), inhalt: $('.blatt-inhalt', huelle), opt, zu: () => Blatt.zu(b),
      setze(html) { const y = this.inhalt.scrollTop; this.inhalt.innerHTML = html; this.inhalt.scrollTop = y; $$('textarea', this.inhalt).forEach(wachse); },
    };
    this.stapel.push(b);
    this.ziehen(b);
    $$('textarea', b.inhalt).forEach(wachse);
    huelle.getBoundingClientRect();   // Startzustand festhalten, damit die Bewegung läuft
    huelle.classList.add('offen');
    return b;
  },

  zu(b = this.stapel[this.stapel.length - 1]) {
    if (!b || b.weg) return;
    b.weg = true;
    this.stapel = this.stapel.filter((x) => x !== b);
    if (document.activeElement && b.el.contains(document.activeElement)) document.activeElement.blur();
    b.flaeche.style.transform = '';
    b.flaeche.style.transition = '';
    b.el.classList.remove('offen');
    setTimeout(() => b.el.remove(), 420);
    if (b.opt.onZu) b.opt.onZu();
  },

  // Offene Blätter nach einer Datenänderung auffrischen
  frisch() {
    for (const b of this.stapel) if (b.opt.neu) b.setze(b.opt.neu());
  },

  // Am Kopf ziehen: das Blatt folgt dem Finger, beim Loslassen entscheidet die Wurfweite
  ziehen(b) {
    const kopf = $('.blatt-kopf', b.el);
    let startY = 0, dy = 0, zieht = false, spur = [];
    kopf.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button')) return;
      zieht = true; startY = e.clientY; dy = 0; spur = [{ y: e.clientY, t: e.timeStamp }];
      kopf.setPointerCapture(e.pointerId);
      b.flaeche.style.transition = 'none';
    });
    kopf.addEventListener('pointermove', (e) => {
      if (!zieht) return;
      dy = e.clientY - startY;
      spur.push({ y: e.clientY, t: e.timeStamp });
      if (spur.length > 5) spur.shift();
      // nach oben nur mit Widerstand
      const y = dy >= 0 ? dy : -(Math.abs(dy) * 80 * 0.55) / (80 + 0.55 * Math.abs(dy));
      b.flaeche.style.transform = `translateY(${y}px)`;
    });
    const ende = () => {
      if (!zieht) return;
      zieht = false;
      const a = spur[0], z = spur[spur.length - 1];
      const v = z.t > a.t ? ((z.y - a.y) / (z.t - a.t)) * 1000 : 0;   // px/s
      const wurf = dy + v * 0.25;   // wo das Blatt mit diesem Schwung landen würde
      b.flaeche.style.transition = '';
      if (wurf > Math.min(220, b.flaeche.offsetHeight * 0.4) && v > -200) Blatt.zu(b);
      else b.flaeche.style.transform = '';
    };
    kopf.addEventListener('pointerup', ende);
    kopf.addEventListener('pointercancel', ende);
  },
};

/* Rückfrage vor Dingen, die sich nicht zurücknehmen lassen */
function frage(text, ja = 'Löschen', gefaehrlich = true, nein = 'Abbrechen') {
  return new Promise((ok) => {
    let antwort = false;
    const b = Blatt.auf({
      titel: 'Sicher?',
      html: `<p class="frage-text">${esc(text)}</p>
        <div class="knopfzeile"><button class="knopf zweit" data-akt="frageNein">${esc(nein)}</button><button class="knopf ${gefaehrlich ? 'rot' : 'haupt'}" data-akt="frageJa">${esc(ja)}</button></div>`,
      onZu: () => ok(antwort),
    });
    b.el.classList.add('frage');
    b.antworte = (v) => { antwort = v; b.zu(); };
  });
}

/* Bausteine für Formulare */
function feld(label, attr, wert, extra = '') {
  return `<label class="zeile feldzeile"><span>${esc(label)}</span><input ${attr} value="${esc(wert ?? '')}" autocomplete="off" ${extra}></label>`;
}
function zahlfeld(label, attr, wert, einheit = '') {
  return `<label class="zeile feldzeile"><span>${esc(label)}</span><input ${attr} data-zahl inputmode="decimal" value="${wert == null ? '' : esc(kg(wert))}" autocomplete="off">${einheit ? `<em>${einheit}</em>` : ''}</label>`;
}
function auswahl(label, attr, optionen, wert) {
  return `<label class="zeile feldzeile"><span>${esc(label)}</span><select ${attr}>${optionen.map(([v, t]) => `<option value="${esc(v)}" ${v === wert ? 'selected' : ''}>\u200E${esc(t)}\u200E</option>`).join('')}</select></label>`;
}
