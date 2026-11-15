'use strict';
/* Start: Reiter, Klick-Verteilung, Abgleich beim Öffnen. */

let tab = lager.get('gym-tab', 'training');
const ANSICHTEN = { training: zeigeTraining, studio: zeigeStudio, fortschritt: zeigeFortschritt, mehr: zeigeMehr };

function zeichne() {
  if (!ANSICHTEN[tab]) tab = 'training';
  $('#inhalt').innerHTML = ANSICHTEN[tab]();
  $$('#tabs button').forEach((b, i) => { const an = b.dataset.tab === tab; b.classList.toggle('an', an); if (an) { b.setAttribute('aria-current', 'page'); $('#tabs').style.setProperty('--i', i); } else b.removeAttribute('aria-current'); });
}

Object.assign(Akt, {
  tab(el) {
    const neu = el.dataset.tab;
    if (neu === tab) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    const reihe = Object.keys(ANSICHTEN), r = Math.sign(reihe.indexOf(neu) - reihe.indexOf(tab));
    tab = neu; lager.set('gym-tab', tab);
    zeichne();
    window.scrollTo(0, 0);
    // Inhalt gleitet aus der Richtung herein, in die die Kapsel fährt
    const inh = $('#inhalt');
    if (inh.animate && !matchMedia('(prefers-reduced-motion: reduce)').matches) inh.animate([{ opacity: 0, transform: `translateX(${r * 18}px)` }, { opacity: 1, transform: 'none' }], { duration: 260, easing: 'cubic-bezier(.2, .8, .3, 1)' });
    if (tab === 'fortschritt') zumAktuellenMonat();
  },
  blattZu(el) {
    const huelle = el.closest('.blatt-huelle');
    const b = Blatt.stapel.find((x) => x.el === huelle);
    if (b) b.zu();
  },
  frageJa() { Blatt.stapel[Blatt.stapel.length - 1].antworte(true); },
  frageNein() { Blatt.stapel[Blatt.stapel.length - 1].antworte(false); },
});

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-akt]');
  if (!el || el.disabled) return;
  const f = Akt[el.dataset.akt];
  if (f) f(el, e);
});
const eingabe = (e) => {
  const el = e.target.closest('[data-ein]');
  if (el && Ein[el.dataset.ein]) Ein[el.dataset.ein](el, e);
};
document.addEventListener('input', (e) => { if (e.target.type !== 'file') eingabe(e); });
document.addEventListener('change', (e) => { if (e.target.type === 'file' || e.target.dataset.ein === 'syncFeld') eingabe(e); });
document.addEventListener('focusout', (e) => { if (e.target.dataset && e.target.dataset.ein === 'syncFeld') eingabe(e); });
// Zeilen, die wie Knöpfe wirken, auch per Tastatur auslösen
document.addEventListener('keydown', (e) => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role="button"][data-akt]')) { e.preventDefault(); e.target.click(); }
  if (e.key === 'Escape' && Blatt.stapel.length) Blatt.zu();
});

// Bildschirmtastatur: Blätter enden an der Oberkante der Tastatur statt dahinter
if (window.visualViewport) {
  const vv = window.visualViewport;
  const messen = () => document.documentElement.style.setProperty('--tastatur', Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop)) + 'px');
  vv.addEventListener('resize', messen);
  vv.addEventListener('scroll', messen);
}

vorlageSicherstellen();
zeichne();
if (tab === 'fortschritt') zumAktuellenMonat();
if (Aktiv.t) Live.auf();
bilderVorladen();

// Abgleich: beim Öffnen, beim Zurückkommen und bevor die Seite in den Hintergrund geht
if (Sync.bereit) Sync.abgleich();
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    if (Sync.bereit && Date.now() - Sync.zeit > 60000) Sync.abgleich();
    if (Aktiv.t && !$('#live').hidden) Live.wach(true);
    if (tab === 'training' && !Blatt.stapel.length) zeichne();
  } else if (Sync.offen && Sync.bereit) {
    Sync.abgleich();
  }
});

// Ohne Netz starten können (nur wenn die Seite über https ausgeliefert wird)
if ('serviceWorker' in navigator && location.protocol === 'https:' && !window.GYM_OHNE_SW) {
  navigator.serviceWorker.register('sw.js').catch(() => { /* dann eben ohne */ });
}
