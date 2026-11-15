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

## 13. Steckgewicht realistischer: Stahlplatten, Kopfplatte, Steckstift mit Umsteck-Animation

Commit `94cf3c1`

Platten mit gebürsteter Oberfläche und Bohrung, Kopfplatte oben, gehobene Platten hell mit Lücke zum Rest. Der Stift ist ein eigenes Element mit rotem Griff: beim Umstecken wird er herausgezogen, fährt zur neuen Platte und steckt ein, danach ruckt der Turm kurz an. Mit „Bewegung reduzieren“ springt er ohne Animation.

## 14. Scheiben realistischer: gerundete Gummischeiben, Verschluss, Maschinenarm bei Plate-Loaded

Commit `de444a0`

Scheiben mit Zylinder-Schattierung und Schatten am Boden, Stange mit Rändelung und glänzender Hülse, Federverschluss am Ende. Nur die neu aufgelegte Scheibe gleitet auf (vorher flogen alle neu herein), abgenommene rutschen seitlich herunter. Bei Plate-Loaded-Maschinen ist statt der Hantelstange ein Maschinenarm zu sehen und die Rechnung lautet „je Seite … kg“.

## 15. Satz-Eingabe: Satznummer vorne im Titel

Commit `6537c2a`

Bei langen Übungsnamen wurde „Satz 1“ hinten abgeschnitten. Jetzt steht „Satz 1: Konvergierende Brustpresse“ da, abgeschnitten wird höchstens der Name.

## 16. Kurzhanteln realistischer: Hex-Hanteln auf der Ablage

Commit `6265b9f`

Statt stilisierter „H“ jetzt Hex-Hanteln mit gummierten Köpfen, Chromringen und gerändeltem Griff, die auf einer Stahlschiene liegen. Schwere Hanteln haben größere und breitere Köpfe. Die gewählte wird angehoben und wirft einen Schatten.

## 17. Live-Training: Hinweis, wann mehr Gewicht dran ist (doppelte Progression)

Commit `1cfd1d2`

Hast du letztes Mal in allen Arbeitssätzen das obere Ende des Wiederholungsbereichs geschafft, erscheint über den Sätzen „Zeit für mehr Gewicht“ mit dem nächsten Schritt, den es am Gerät gibt (nächste Platte, nächste Kurzhantel, +2,5 kg an der Stange). Antippen setzt das Gewicht für alle offenen Sätze, die Wiederholungen beginnen wieder am unteren Ende und das Aufwärmen passt sich an.

## 18. Live-Training: neuer Bestwert schon beim Abhaken

Commit `6cd4da2`

Schlägt ein abgehakter Satz das bisherige geschätzte Maximum der Übung, steht in der Zeile „Neuer Bestwert“ mit Stern, die Zeile leuchtet kurz auf und eine Meldung nennt den neuen Wert. Vorher gab es das erst nach dem Beenden. Wird der Satz wieder geöffnet, verschwindet die Markierung.

## 19. Fortschritt: neuer Bereich „Muskeln“ mit Sätzen pro Muskel und Woche

Commit `aaa0216`

Pro Woche zeigt ein Balken für jeden Muskel die Arbeitssätze, mittrainierte zählen halb. Ein helles Band markiert 10 bis 20 Sätze. Muskeln ohne Sätze bleiben sichtbar, damit auffällt, was zu kurz kommt. Mit den Pfeilen lassen sich frühere Wochen ansehen.

## 20. Pausentimer: Doppelton und kurzes Pulsieren am Ende der Pause

Commit `b98c3a6`

Läuft die Pause ab, kommt ein kurzer Doppelton (und auf Geräten, die es können, eine Vibration), die Pausenleiste pulsiert einmal. Der Ton lässt sich unter Mehr, Training abschalten. Hinweis: iOS spielt ihn nur, solange die App offen ist, und im Lautlos-Modus nicht.

## 21. Trainingsabschluss: Vergleich mit dem letzten Mal

Commit `88fef90`

Die Zusammenfassung nach dem Training nennt jetzt, wie viel mehr oder weniger Gewicht bewegt wurde als beim letzten Mal desselben Trainingstags, mehr wird grün hervorgehoben.

## 22. Tab-Leiste: Glas-Kapsel gleitet zum gewählten Reiter

Commit `92610e0`

Wie in der Panel-App springt die Markierung nicht mehr, sondern gleitet mit leichtem Nachfedern zum neuen Reiter.

## 23. Satz-Eingabe: Gewicht und Wiederholungen rollen wie ein Zählwerk

Commit `58013a1`

Ändert sich ein Wert, rollt die neue Zahl herein: von unten bei mehr, von oben bei weniger. So sieht man auch aus dem Augenwinkel, in welche Richtung man gerade geändert hat.

## 24. Reiterwechsel: Inhalt gleitet in Fahrtrichtung herein

Commit `90c8ea2`

Beim Wechsel des Reiters blendet der neue Inhalt kurz ein und kommt von der Seite, in die die Kapsel fährt. Mit „Bewegung reduzieren“ ohne Animation.

## 25. Abhaken: Haken zeichnet sich

Commit `f01febb`

Beim Abhaken eines Satzes erscheint der Haken nicht einfach, sondern wird wie mit einem Stift gezogen, zusätzlich zum kurzen Aufploppen.

## 26. Training beendet: Tageskreis füllt sich mit kleiner Welle

Commit `5296c56`

Nach dem Beenden füllt sich der heutige Kreis unter „Diese Woche“ sichtbar, sobald die Live-Ansicht weggeklappt ist, eine Welle läuft nach außen. Nur einmal direkt nach dem Training.
