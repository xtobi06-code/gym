'use strict';
/* Wischen zum Löschen: Zeilen mit data-wisch="liste" und data-id lassen sich nach links wegwischen.
   Danach gibt es kurz „Rückgängig“. Senkrechtes Scrollen bleibt beim Browser (touch-action: pan-y). */

const Wisch = {
  ZIEL: 96,          // so weit muss die Zeile weg, damit sie gelöscht wird
  z: null,           // gerade bewegte Zeile
  geklickt: 0,       // Zeitpunkt des letzten Wischs, damit danach kein Klick auslöst

  start(e) {
    const el = e.target.closest('[data-wisch]');
    if (!el || (e.pointerType === 'mouse' && e.button !== 0)) return;
    this.z = { el, x: e.clientX, y: e.clientY, dx: 0, art: '', t: performance.now(), v: 0, letzt: e.clientX, tl: performance.now() };
  },
  bewegt(e) {
    const z = this.z;
    if (!z) return;
    const dx = e.clientX - z.x, dy = e.clientY - z.y;
    if (!z.art) {
      if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { this.z = null; return; }
      if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        z.art = 'h';
        try { z.el.setPointerCapture(e.pointerId); } catch { /* egal */ }
        z.el.classList.add('wischt');
      } else return;
    }
    const jetzt = performance.now();
    if (jetzt > z.tl) z.v = (e.clientX - z.letzt) / (jetzt - z.tl);
    z.letzt = e.clientX; z.tl = jetzt;
    z.dx = dx < 0 ? dx : dx * 0.25;   // nach rechts nur ein wenig Gummi
    z.el.style.transform = `translateX(${z.dx}px)`;
    z.el.classList.toggle('bereit', z.dx < -this.ZIEL);
  },
  ende() {
    const z = this.z;
    this.z = null;
    if (!z || z.art !== 'h') return;
    this.geklickt = Date.now();
    const el = z.el;
    el.classList.remove('wischt');
    // Mit Schwung zählt auch ein kürzerer Wisch
    const ziel = z.dx + z.v * 180 < -this.ZIEL * 1.6 || z.dx < -this.ZIEL * 1.5;
    if (!ziel) { el.classList.remove('bereit'); el.style.transform = ''; return; }
    el.classList.add('weg');
    el.style.transform = 'translateX(-110%)';
    const liste = el.dataset.wisch, id = el.dataset.id;
    if (liste === 'satz') { setTimeout(() => this.satzWeg(el), 220); return; }
    setTimeout(() => this.loeschen(liste, id), 220);
  },

  // Satz im laufenden Training: nur dort, nicht in den gespeicherten Daten
  satzWeg(el) {
    const pi = +el.closest('.uekarte').dataset.i, si = +el.dataset.si, p = Aktiv.t && Aktiv.t.punkte[pi];
    if (!p || !p.saetze[si]) return;
    const [weg] = p.saetze.splice(si, 1);
    Aktiv.sichern(); Live.neu(pi);
    toast(weg.auf ? 'Aufwärmsatz entfernt' : 'Satz entfernt', () => {
      const q = Aktiv.t && Aktiv.t.punkte[pi];
      if (!q) return;
      q.saetze.splice(Math.min(si, q.saetze.length), 0, weg);
      Aktiv.sichern(); Live.neu(pi);
    });
  },

  loeschen(liste, id) {
    const obj = finde(liste, id);
    if (!obj) { zeichne(); return; }
    const kopie = JSON.parse(JSON.stringify(obj));
    let verknuepft = [];
    if (liste === 'geraete') {   // Übungen am Gerät bleiben erhalten, nur ohne Gerät
      verknuepft = D.uebungen.filter((u) => u.geraet === id).map((u) => u.id);
      for (const u of D.uebungen) if (u.geraet === id) { u.geraet = ''; u.u = Date.now(); }
    }
    entferne(liste, id);
    zeichne(); Blatt.frisch();
    toast(`„${kopie.name || 'Eintrag'}“ gelöscht`, () => {
      delete D.weg[id];
      setze(liste, kopie);
      for (const uid of verknuepft) { const u = finde('uebungen', uid); if (u) { u.geraet = id; u.u = Date.now(); } }
      sichern();
      zeichne(); Blatt.frisch();
    });
  },
};
document.addEventListener('pointerdown', (e) => Wisch.start(e));
document.addEventListener('pointermove', (e) => Wisch.bewegt(e));
document.addEventListener('pointerup', () => Wisch.ende());
document.addEventListener('pointercancel', () => { if (Wisch.z) { const el = Wisch.z.el; el.classList.remove('wischt', 'bereit'); el.style.transform = ''; } Wisch.z = null; });
// Nach einem Wisch kein Antippen auslösen
document.addEventListener('click', (e) => { if (Date.now() - Wisch.geklickt < 350) { e.stopPropagation(); e.preventDefault(); } }, true);
Akt.toastRueck = () => { const f = toastRueck; toastRueck = null; $('#toast').classList.remove('an'); if (f) f(); };
