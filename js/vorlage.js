'use strict';
/* Vorlage: Geräte im AlphaClub Neufahrn, soweit sicher bekannt. Feste ids, damit mehrfaches
   Übernehmen nichts verdoppelt. u = 1, damit eigene Änderungen und Löschungen immer gewinnen. */

const VORLAGE_ALPHACLUB = (() => {
  const STECK = { typ: 'stack', start: 5, schritt: 5, anzahl: 20, zusatz: 2.5, stufen: '', marke: 'Technogym' };
  const PLATTE = { typ: 'scheiben', stange: 0, beidseitig: true };
  const pruefen = 'Gewichtsstufen beim nächsten Training prüfen';
  const g = (id, name, art, extra = {}) => ({ id: 'ac-g-' + id, u: 1, name, bereich: '', modell: '', notiz: '', ...art, ...extra });
  const geraete = [
    g('seitheben', 'Seitheben-Maschine', STECK, { notiz: pruefen }),
    g('schulter', 'Schulterdrücken-Maschine', STECK, { notiz: pruefen }),
    g('brust-schraeg', 'Brustpresse schräg', STECK, { notiz: 'Drückt eher nach oben. ' + pruefen }),
    g('brust', 'Brustpresse', STECK, { notiz: 'Drückt nach vorne. ' + pruefen }),
    g('latzug', 'Latzug', STECK, { notiz: 'Frei drehbare Griffe. ' + pruefen }),
    g('kabel', 'Kabelzug', STECK, { notiz: 'Gibt es zweimal, eventuell mit Crossover dazwischen. ' + pruefen }),
    g('rudern-breit', 'Rudern breit', STECK, { notiz: pruefen }),
    g('beinstrecker', 'Beinstrecker', STECK, { notiz: 'Gibt es zweimal. ' + pruefen }),
    g('dips', 'Dips-Maschine', PLATTE, { marke: '', notiz: 'Leergewicht prüfen' }),
    g('vsquat', 'V-Squat', PLATTE, { marke: '', notiz: 'Leergewicht prüfen' }),
    g('brust-platte', 'Brustpresse Plate-Loaded', PLATTE, { marke: '', notiz: 'Im Liegen auf einer Bank, Griffe laufen eng zusammen. Leergewicht prüfen' }),
    g('egym-beinpresse', 'Beinpresse eGym', { typ: 'frei' }, { marke: 'eGym', bereich: 'eGym' }),
    g('egym-bizeps', 'Bizeps-Curl eGym', { typ: 'frei' }, { marke: 'eGym', bereich: 'eGym' }),
    g('egym-rudern', 'Ruderzug eGym', { typ: 'frei' }, { marke: 'eGym', bereich: 'eGym' }),
    g('egym-ruecken', 'Rückentrainer eGym', { typ: 'frei' }, { marke: 'eGym', bereich: 'eGym' }),
    g('egym-beinbeuger', 'Beinbeuger eGym', { typ: 'frei' }, { marke: 'eGym', bereich: 'eGym' }),
    g('egym-schulter', 'Schulterpresse eGym', { typ: 'frei' }, { marke: 'eGym', bereich: 'eGym' }),
    g('egym-latzug', 'Latzug eGym', { typ: 'frei' }, { marke: 'eGym', bereich: 'eGym' }),
    g('egym-hipthrust', 'Hip Thrust eGym', { typ: 'frei' }, { marke: 'eGym', bereich: 'eGym' }),
    g('egym-brust', 'Brustpresse eGym', { typ: 'frei' }, { marke: 'eGym', bereich: 'eGym' }),
    g('egym-bauch', 'Bauchtrainer eGym', { typ: 'frei' }, { marke: 'eGym', bereich: 'eGym' }),
  ];
  const u = (id, name, equip, muskel, muskeln2, geraet, bib) => ({ id: 'ac-u-' + id, u: 1, name, equip, muskel, muskeln2, geraet: 'ac-g-' + geraet, notiz: '', ...(bib ? { bib } : {}) });
  const uebungen = [
    u('seitheben', 'Seitheben-Maschine', 'maschine', 'Seitliche Schulter', [], 'seitheben'),
    u('schulter', 'Schulterpresse', 'maschine', 'Vordere Schulter', ['Trizeps', 'Seitliche Schulter'], 'schulter'),
    u('brust-schraeg', 'Schräge Brustpresse', 'maschine', 'Brust', ['Vordere Schulter', 'Trizeps'], 'brust-schraeg'),
    u('brust', 'Brustpresse', 'maschine', 'Brust', ['Trizeps', 'Vordere Schulter'], 'brust'),
    u('latzug', 'Latzug', 'maschine', 'Lat', ['Bizeps', 'Oberer Rücken'], 'latzug'),
    u('kabel-rudern', 'Rudern am Kabel', 'kabel', 'Oberer Rücken', ['Lat', 'Bizeps'], 'kabel'),
    u('kabel-latzug', 'Latzug am Kabel', 'kabel', 'Lat', ['Bizeps', 'Oberer Rücken'], 'kabel', 'x-lat-pulldown-kabel'),
    u('kabel-trizeps', 'Trizepsdrücken am Seil', 'kabel', 'Trizeps', [], 'kabel'),
    u('rudern-breit', 'Rudern mit Brustauflage', 'maschine', 'Oberer Rücken', ['Lat', 'Hintere Schulter', 'Bizeps'], 'rudern-breit'),
    u('kelso', 'Kelso Shrug', 'maschine', 'Oberer Rücken', ['Nacken'], 'rudern-breit', 'x-kelso-shrug-plate'),
    u('beinstrecker', 'Beinstrecker', 'maschine', 'Quadrizeps', [], 'beinstrecker'),
    u('dips', 'Dips sitzend', 'plate', 'Trizeps', ['Brust', 'Vordere Schulter'], 'dips'),
    u('vsquat', 'V-Squat', 'plate', 'Quadrizeps', ['Gesäß'], 'vsquat'),
    u('brust-platte', 'Konvergierende Brustpresse', 'plate', 'Brust', ['Trizeps', 'Vordere Schulter'], 'brust-platte'),
    u('beinpresse', 'Beinpresse', 'maschine', 'Quadrizeps', ['Gesäß', 'Beinbeuger'], 'egym-beinpresse'),
    u('waden-beinpresse', 'Wadenheben an der Beinpresse', 'maschine', 'Waden', [], 'egym-beinpresse'),
    u('egym-bizeps', 'Bizeps-Curl eGym', 'maschine', 'Bizeps', [], 'egym-bizeps'),
    u('egym-rudern', 'Rudern eGym', 'maschine', 'Oberer Rücken', ['Lat', 'Bizeps', 'Hintere Schulter'], 'egym-rudern'),
    u('egym-ruecken', 'Rückenstrecker eGym', 'maschine', 'Unterer Rücken', ['Gesäß'], 'egym-ruecken'),
    u('egym-beinbeuger', 'Beinbeuger eGym', 'maschine', 'Beinbeuger', ['Waden'], 'egym-beinbeuger'),
    u('egym-schulter', 'Schulterpresse eGym', 'maschine', 'Vordere Schulter', ['Seitliche Schulter', 'Trizeps'], 'egym-schulter'),
    u('egym-latzug', 'Latzug eGym', 'maschine', 'Lat', ['Bizeps', 'Oberer Rücken'], 'egym-latzug'),
    u('egym-hipthrust', 'Hip Thrust eGym', 'maschine', 'Gesäß', ['Beinbeuger'], 'egym-hipthrust'),
    u('egym-brust', 'Brustpresse eGym', 'maschine', 'Brust', ['Trizeps', 'Vordere Schulter'], 'egym-brust'),
    u('egym-bauch', 'Bauchtrainer eGym', 'maschine', 'Bauch', [], 'egym-bauch'),
  ];
  return { geraete, uebungen };
})();

/* Bild und Anleitung der Vorlage-Übungen aus der Bibliothek. Steht hier statt in den Daten, damit schon gespeicherte
   Übungen es ohne Abgleich bekommen. aehnlich: Die Bibliothek hat genau dieses Gerät nicht, gezeigt wird die nächstähnliche Übung. */
const VORLAGE_INFO = {
  'ac-u-seitheben': { bib: 'plate-loaded-lateral-raise', aehnlich: true },
  'ac-u-schulter': { bib: 'machine-shoulder-press' },
  'ac-u-brust-schraeg': { bib: 'chest-press-machine', aehnlich: true },
  'ac-u-brust': { bib: 'chest-press-machine' },
  'ac-u-latzug': { bib: 'v-bar-lat-pulldown', aehnlich: true },
  'ac-u-kabel-latzug': { bib: 'lat-pulldown' },
  'ac-u-kabel-rudern': { bib: 'seated-cable-row' },
  'ac-u-kabel-trizeps': { bib: 'tricep-pushdown', aehnlich: true },
  'ac-u-rudern-breit': { bib: 'chest-supported-machine-row' },
  'ac-u-kelso': { bib: 'chest-supported-machine-row', aehnlich: true, anleitung: [
    'Brust fest gegen das Polster legen, Arme hängen gestreckt nach unten.',
    'Nur die Schulterblätter zusammenziehen, die Arme bleiben gestreckt. Das ist keine Ruderbewegung.',
    'Oben eine Sekunde halten und die Schulterblätter bewusst zusammendrücken.',
    'Langsam wieder nach vorne lassen. Gewicht eher moderat wählen.'] },
  'ac-u-beinstrecker': { bib: 'leg-extension' },
  'ac-u-dips': { bib: 'plate-loaded-seated-dip-machine' },
  'ac-u-vsquat': { bib: 'hack-squat', aehnlich: true },
  'ac-u-brust-platte': { bib: 'chest-press-machine', aehnlich: true },
  'ac-u-beinpresse': { bib: 'horizontal-leg-press' },
  'ac-u-waden-beinpresse': { bib: 'machine-calf-raise', aehnlich: true },
  'ac-u-egym-bizeps': { bib: 'machine-preacher-curl' },
  'ac-u-egym-rudern': { bib: 'chest-supported-machine-row' },
  'ac-u-egym-ruecken': { bib: 'machine-back-extension' },
  'ac-u-egym-beinbeuger': { bib: 'seated-leg-curl' },
  'ac-u-egym-schulter': { bib: 'machine-shoulder-press' },
  'ac-u-egym-latzug': { bib: 'lat-pulldown', aehnlich: true },
  'ac-u-egym-hipthrust': { bib: 'plate-loaded-glute-drive', aehnlich: true },
  'ac-u-egym-brust': { bib: 'chest-press-machine' },
  'ac-u-egym-bauch': { bib: 'machine-seated-crunch' },
};

// Die Studio-Geräte sind von Anfang an da. Gefahrlos bei jedem Start: Die Vorlage hat den ältesten Zeitstempel,
// eigene Änderungen und Löschungen gewinnen also immer.
function vorlageSicherstellen() {
  const neu = mischen(D, { ...VORLAGE_ALPHACLUB, weg: {} });
  // Zusatzgewicht 2,5 kg nachtragen, aber nur bei Vorlage-Geräten, die noch nie bearbeitet wurden (u = 1)
  let zusatz = false;
  for (const g of neu.geraete) if (g.u === 1 && g.typ === 'stack' && !g.zusatz && String(g.id).startsWith('ac-g-')) { g.zusatz = 2.5; g.u = Date.now(); zusatz = true; }
  if (!zusatz && kern(neu) === kern(D)) return;
  D = neu; migriere(); sichern();
}
