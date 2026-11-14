'use strict';
/* Vorlage: Geräte im AlphaClub Neufahrn, soweit sicher bekannt. Feste ids, damit mehrfaches
   Übernehmen nichts verdoppelt. u = 1, damit eigene Änderungen und Löschungen immer gewinnen. */

const VORLAGE_ALPHACLUB = (() => {
  const STECK = { typ: 'stack', start: 5, schritt: 5, anzahl: 20, zusatz: 0, stufen: '', marke: 'Technogym' };
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
    g('brust-platte', 'Brustpresse Plate-Loaded', PLATTE, { marke: '', notiz: 'Griffe laufen nach oben eng zusammen. Leergewicht prüfen' }),
    g('egym-beinpresse', 'Beinpresse eGym', { typ: 'frei' }, { marke: 'eGym', bereich: 'eGym' }),
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
  ];
  return { geraete, uebungen };
})();

function vorlageUebernehmen() {
  const vorher = D.geraete.length + D.uebungen.length;
  D = mischen(D, { ...VORLAGE_ALPHACLUB, weg: {} });
  migriere();
  sichern();
  const neu = D.geraete.length + D.uebungen.length - vorher;
  toast(neu ? `${neu} Einträge übernommen` : 'Alles schon vorhanden');
  zeichne();
}
Akt.vorlage = () => vorlageUebernehmen();
