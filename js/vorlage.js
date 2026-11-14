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
    g('brust-platte', 'Brustpresse Plate-Loaded', PLATTE, { marke: '', notiz: 'Im Liegen auf einer Bank, Griffe laufen eng zusammen. Leergewicht prüfen' }),
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

/* Bilder und Anleitungen der Vorlage-Übungen. Hier statt in den Daten, damit schon gespeicherte Übungen
   sie ohne Abgleich bekommen. bild: false = kein Bild aus der Bibliothek, weil keines zum Gerät passt
   (lieber ein eigenes Foto als ein falsches Bild). */
const VORLAGE_INFO = {
  'ac-u-seitheben': { bild: false, anleitung: [
    'Sitzhöhe so einstellen, dass die Drehachse auf Höhe deiner Schultergelenke liegt.',
    'Unterarme gegen die Polster legen, Rücken an die Lehne.',
    'Ellbogen seitlich anheben, bis die Oberarme etwa waagerecht sind. Nicht mit Schwung arbeiten.',
    'Oben kurz halten, dann kontrolliert und langsam absenken, ohne das Gewicht abzulegen.'] },
  'ac-u-schulter': { anleitung: [
    'Sitz so stellen, dass die Griffe auf Höhe der Schultern starten.',
    'Rücken fest an die Lehne, Schulterblätter leicht zusammen.',
    'Griffe nach oben drücken, bis die Arme fast gestreckt sind. Ellbogen nicht ganz durchdrücken.',
    'Kontrolliert wieder auf Schulterhöhe absenken.'] },
  'ac-u-brust-schraeg': { anleitung: [
    'Sitz so stellen, dass die Griffe auf Höhe der unteren Brust starten.',
    'Schulterblätter zusammenziehen und an die Lehne drücken.',
    'Griffe schräg nach oben wegdrücken, bis die Arme fast gestreckt sind.',
    'Langsam zurückführen, bis du ein leichtes Dehnen in der Brust spürst.'] },
  'ac-u-brust': { anleitung: [
    'Sitz so stellen, dass die Griffe auf Höhe der Brustmitte liegen.',
    'Schulterblätter zusammenziehen, Rücken an der Lehne lassen.',
    'Griffe gerade nach vorne drücken, Arme fast strecken.',
    'Kontrolliert zurückführen, ohne dass die Gewichte aufsetzen.'] },
  'ac-u-latzug': { bild: false, anleitung: [
    'Oberschenkelpolster so einstellen, dass du fest sitzt und nicht nach oben gezogen wirst.',
    'Griffe fassen, Brust leicht heraus, Schulterblätter nach unten.',
    'Griffe zu den Schultern ziehen, Ellbogen dabei nach unten und leicht nach hinten führen.',
    'Oben kurz halten, dann Arme langsam wieder ganz strecken, bis du den Lat dehnst.'] },
  'ac-u-kabel-latzug': { anleitung: [
    'Polster auf die Oberschenkel stellen, Stange etwas weiter als schulterbreit fassen.',
    'Oberkörper leicht nach hinten lehnen, Brust heraus.',
    'Stange zur oberen Brust ziehen, Ellbogen nach unten führen. Nicht mit dem Rücken schwingen.',
    'Langsam wieder nach oben lassen, bis die Arme gestreckt sind.'] },
  'ac-u-kabel-rudern': { anleitung: [
    'Aufrecht sitzen, Füße fest abstützen, Knie leicht gebeugt.',
    'Griff zum Bauchnabel ziehen und die Schulterblätter dabei zusammenführen.',
    'Oberkörper bleibt aufrecht, kein Schwung aus dem unteren Rücken.',
    'Arme langsam wieder strecken und die Schulterblätter nach vorne gleiten lassen.'] },
  'ac-u-kabel-trizeps': { anleitung: [
    'Seil an der oberen Rolle befestigen, Ellbogen eng an den Körper.',
    'Oberarme bleiben fest, nur die Unterarme bewegen sich.',
    'Seil nach unten drücken und am Ende die Enden leicht auseinanderziehen.',
    'Langsam zurück, bis die Hände etwa auf Brusthöhe sind.'] },
  'ac-u-rudern-breit': { anleitung: [
    'Brustpolster so einstellen, dass du die Griffe mit fast gestreckten Armen erreichst.',
    'Brust fest anlegen, Schultern nicht hochziehen.',
    'Griffe nach hinten ziehen, Ellbogen breit, und die Schulterblätter zusammenführen.',
    'Kurz halten, dann kontrolliert nach vorne lassen.'] },
  'ac-u-kelso': { bild: false, anleitung: [
    'Brust fest gegen das Polster legen, Arme hängen gestreckt nach unten.',
    'Nur die Schulterblätter zusammenziehen, Arme bleiben gestreckt. Das ist keine Ruderbewegung.',
    'Oben eine Sekunde halten und die Schulterblätter bewusst zusammendrücken.',
    'Langsam wieder nach vorne lassen. Gewicht eher moderat wählen.'] },
  'ac-u-beinstrecker': { anleitung: [
    'Rückenlehne so stellen, dass die Knie an der Kante der Sitzfläche abknicken.',
    'Polster knapp über den Knöcheln anlegen.',
    'Beine strecken, bis sie fast gerade sind, und oben kurz anspannen.',
    'Langsam wieder beugen, ohne dass die Gewichte aufsetzen.'] },
  'ac-u-dips': { anleitung: [
    'Sitz so einstellen, dass die Griffe auf Höhe der Brust beginnen.',
    'Schultern nach unten, Ellbogen eng am Körper.',
    'Griffe nach unten drücken, bis die Arme fast gestreckt sind.',
    'Kontrolliert zurückkommen, die Schultern nicht nach vorne fallen lassen.'] },
  'ac-u-vsquat': { bild: false, anleitung: [
    'Schultern unter die Polster, Rücken an die Lehne, Füße etwa schulterbreit auf die Plattform.',
    'Sicherungen lösen und tief beugen, die Knie zeigen in Richtung der Füße.',
    'Aus den Fersen und dem ganzen Fuß wieder hochdrücken.',
    'Knie oben nicht ganz durchdrücken. Bei Ende des Satzes Sicherungen wieder einhängen.'] },
  'ac-u-brust-platte': { bild: false, anleitung: [
    'Rücken flach auf die Bank, Füße fest am Boden.',
    'Griffe fassen, Schulterblätter zusammenziehen.',
    'Griffe nach oben drücken, bis sie sich oben fast treffen.',
    'Langsam wieder absenken, bis du ein Dehnen in der Brust spürst.'] },
  'ac-u-beinpresse': { bild: false, anleitung: [
    'Sitz so einstellen, dass die Knie etwa 90° gebeugt sind, wenn du startest.',
    'Füße schulterbreit auf die Platte, Rücken und Gesäß bleiben an der Lehne.',
    'Beine kräftig strecken, Knie oben nicht ganz durchdrücken.',
    'Langsam zurückkommen, ohne dass das Becken abhebt.'] },
  'ac-u-waden-beinpresse': { bild: false, anleitung: [
    'Mit den Fußballen auf den unteren Rand der Platte, Beine fast gestreckt.',
    'Aus den Sprunggelenken die Platte wegdrücken, Knie bleiben fast gestreckt.',
    'Oben kurz halten, dann Fersen langsam so weit wie möglich absenken.'] },
};

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
