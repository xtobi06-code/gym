'use strict';
/* Reihenfolge per Ziehen: lange auf den Griff drücken, dann ziehen. Während des Ziehens klappt die Liste
   auf die Köpfe zusammen (Klasse "sortiert"), damit auch weite Wege kurz sind.
   sortierbar(liste, { eintrag, griff, fertig(von, nach) }) wird einmal pro Liste aufgerufen. */

const Sortier = { aktiv: null };

function scrollbox(el) {
  for (let e = el.parentElement; e; e = e.parentElement) {
    const o = getComputedStyle(e).overflowY;
    if ((o === 'auto' || o === 'scroll') && e.scrollHeight > e.clientHeight) return e;
  }
  return document.scrollingElement;
}

function sortierbar(liste, opt) {
  if (!liste || liste.dataset.sortierbar) return;
  liste.dataset.sortierbar = '1';
  let warte = null, start = null;

  const ende = () => { clearTimeout(warte); warte = null; start = null; };

  liste.addEventListener('pointerdown', (e) => {
    const griff = e.target.closest(opt.griff);
    if (!griff || !liste.contains(griff) || e.target.closest('button:not([data-akt="karteKlapp"]), textarea, input, a')) return;
    const el = griff.closest(opt.eintrag);
    if (!el) return;
    start = { x: e.clientX, y: e.clientY, el, id: e.pointerId };
    warte = setTimeout(() => los(e.clientY), 380);
  });
  liste.addEventListener('pointermove', (e) => {
    if (start && !Sortier.aktiv && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 8) ende();   // das war Scrollen
  });
  liste.addEventListener('pointerup', ende);
  liste.addEventListener('touchmove', (e) => { if (Sortier.aktiv) e.preventDefault(); }, { passive: false });
  liste.addEventListener('contextmenu', (e) => { if (start || Sortier.aktiv) e.preventDefault(); });
  liste.addEventListener('pointercancel', () => { if (!Sortier.aktiv) ende(); });

  function los(y) {
    const el = start.el, box = scrollbox(liste), alle = [...liste.querySelectorAll(':scope > ' + opt.eintrag)];
    const von = alle.indexOf(el);
    if (von < 0 || alle.length < 2) return ende();
    liste.classList.add('sortiert');
    // Nach dem Zusammenklappen den gegriffenen Kopf wieder unter den Finger holen
    const r0 = el.getBoundingClientRect();
    box.scrollTop += r0.top + r0.height / 2 - y;
    const boxTop = () => (box === document.scrollingElement ? 0 : box.getBoundingClientRect().top);
    const c = (cy) => cy - boxTop() + box.scrollTop;   // Bildschirm-y in Inhalts-Koordinaten
    const lage = alle.map((x) => { const r = x.getBoundingClientRect(); return { top: c(r.top), h: r.height }; });
    const abstand = alle.length > 1 ? lage[1].top - lage[0].top - lage[0].h : 8;
    const greif = c(y);
    let nach = von, letztY = y, lauf = 0;
    el.classList.add('gezogen');
    alle.forEach((x) => { if (x !== el) x.style.transition = 'transform .22s var(--ease-out)'; });

    const zeichne = () => {
      const d = c(letztY) - greif;
      el.style.transform = `translateY(${d}px) scale(1.02)`;
      const mitte = lage[von].top + lage[von].h / 2 + d;
      nach = von;
      lage.forEach((l, i) => { if (i < von && mitte < l.top + l.h / 2) nach = Math.min(nach, i); if (i > von && mitte > l.top + l.h / 2) nach = Math.max(nach, i); });
      const weg = lage[von].h + abstand;
      alle.forEach((x, i) => {
        if (x === el) return;
        const t = von < nach && i > von && i <= nach ? -weg : von > nach && i >= nach && i < von ? weg : 0;
        x.style.transform = t ? `translateY(${t}px)` : '';
      });
    };
    // Am Rand der Liste weiterscrollen
    const rollen = () => {
      const bt = boxTop(), bh = box === document.scrollingElement ? innerHeight : box.clientHeight, rand = 70;
      const v = letztY < bt + rand ? -(bt + rand - letztY) / 4 : letztY > bt + bh - rand ? (letztY - (bt + bh - rand)) / 4 : 0;
      if (v) { box.scrollTop += Math.max(-18, Math.min(18, v)); zeichne(); }
      lauf = requestAnimationFrame(rollen);
    };
    const bewegen = (e) => { letztY = e.clientY; zeichne(); };
    const halt = (e) => e.preventDefault();   // Seite darf beim Ziehen nicht mitscrollen
    const loslassen = () => {
      cancelAnimationFrame(lauf);
      removeEventListener('pointermove', bewegen); removeEventListener('pointerup', loslassen); removeEventListener('pointercancel', loslassen);
      removeEventListener('touchmove', halt);
      // Klick nach dem Loslassen nicht als Antippen werten
      const schlucken = (e) => { e.stopPropagation(); e.preventDefault(); };
      addEventListener('click', schlucken, { capture: true, once: true });
      setTimeout(() => removeEventListener('click', schlucken, { capture: true }), 350);
      alle.forEach((x) => { x.style.transform = ''; x.style.transition = ''; });
      el.classList.remove('gezogen');
      liste.classList.remove('sortiert');
      Sortier.aktiv = null;
      ende();
      if (nach !== von) opt.fertig(von, nach);
    };
    Sortier.aktiv = { liste };
    addEventListener('pointermove', bewegen); addEventListener('pointerup', loslassen); addEventListener('pointercancel', loslassen);
    addEventListener('touchmove', halt, { passive: false });
    zeichne();
    lauf = requestAnimationFrame(rollen);
  }
}

// Eintrag in einer Liste verschieben
function verschiebe(l, von, nach) { const [x] = l.splice(von, 1); l.splice(nach, 0, x); }
