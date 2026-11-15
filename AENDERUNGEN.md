# Änderungen seit dem Stand `vor-fable`

Jeder Punkt ist ein eigener Commit und lässt sich einzeln zurücknehmen (`git revert <Commit>`).
Der Stand davor liegt als Tag `vor-fable` im Arbeitsverzeichnis und als Branch `vor-fable` auf GitHub.

## 1. Steckgewicht: gewählte Platte beim Öffnen sichtbar

Commit `23d13b0`

Der Plattenturm scrollte beim Öffnen an die falsche Stelle (Abstand zum falschen Bezugselement gemessen), Stift und gewählte Platte lagen außerhalb des sichtbaren Bereichs.

## 2. Übung bearbeiten: fehlender Pfeil bei „Bild und Anleitung“

Commit `43e855a`

Die Zeile verwies auf ein Symbol, das es nicht gibt; dadurch fehlte der Pfeil rechts.

## 3. Selbst gewähltes Bild gilt auch bei Übungen aus der Studio-Vorlage

Commit `787e48a`

Bei den vorangelegten AlphaClub-Übungen wurde ein im Editor gewähltes Bild ignoriert, weil das Vorlagenbild immer Vorrang hatte. Jetzt gewinnt die eigene Wahl; „Standardbild wiederherstellen“ führt zurück.

## 4. Übung bearbeiten: Geräteliste zeigt nur Geräte zum gewählten Equipment

Commit `ee5f4b4`

Die eGym-Geräte standen bei jedem Equipment in der Auswahl, auch bei Plate-Loaded. Sie erscheinen jetzt nur noch unter „Maschine“.

## 5. Tab-Leiste springt beim Start nicht mehr

Commit `14bee57`

Die Symbole der Leiste kamen erst, nachdem alle Skripte geladen waren. Bis dahin war die Leiste 24 px niedriger und sprang dann nach oben. Die Symbole stehen jetzt direkt in der Seite, der gewählte Reiter ist sofort markiert.

## 6. Maximalversuch: Datumsfeld im hellen Modus richtig dargestellt

Commit `e50e6ab`

Das Feld war fest auf dunkle Darstellung gestellt; im hellen Modus war das Kalendersymbol dadurch unsichtbar.

## 7. Studio: Hinweistext bei leerer Übungsliste aktualisiert

Commit `998832e`

Der Text nannte noch den entfernten AlphaClub-Knopf und 600 statt rund 700 Bibliothekseinträge.

## 8. Live-Training: Sprung zur nächsten Übung schneidet den Titel nicht mehr ab

Commit `ee40efe`

Nach dem letzten Satz einer Übung scrollte die Liste um die Höhe des Kopfbereichs zu weit. Vom nächsten Übungsnamen war nichts mehr zu sehen.

## 9. Live-Kopf: lange Namen werden kleiner statt abgeschnitten

Commit `1a05639`

„FREIES TRAINING“ und längere Trainingstag-Namen passten nicht neben die Uhr und endeten mit „…“. Die Schrift schrumpft jetzt schrittweise, bis der Name passt.

## 10. Live-Training: „Aufwärmsätze hinzufügen“ nimmt die Anzahl aus dem Trainingstag

Commit `d831c7d`

Das Menü der Übungskarte fügte immer die Standardanzahl ein, auch wenn für die Übung im Trainingstag eine andere Zahl eingestellt ist.

## 11. Kraft: Körpergewichtsübungen ohne „0 kg“

Commit `632e9bb`

Bei Übungen ohne Zusatzgewicht stand überall „0 kg × 10“. Jetzt steht „10 Wdh.“ bzw. „Körpergewicht × 10“ da, und statt der leeren Kachel „gemessen“ die Zahl der Trainings.

## 12. Hero-Karte: Dauer auf einer Linie mit „Als Nächstes“

Commit `c93f034`

Die geschätzte Dauer stand groß direkt über dem Namen und kam langen Namen wie POSTERIOR sehr nah. Sie steht jetzt etwas kleiner in der Kopfzeile, der Name hat Luft.
