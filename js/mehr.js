'use strict';
/* Mehr-Reiter: Abgleich mit GitHub und Sicherung als Datei. */

function zeigeMehr() {
  const c = Sync.cfg();
  return kopf('Mehr') + `
    ${window.GYM_VORSCHAU ? `<div class="merkzettel"><span class="mz-ic">${ic('notiz', 20)}</span><div><b>Vorschau mit Beispieldaten</b><p>Synchronisierung und Sicherung als Datei funktionieren erst in der Fassung auf GitHub.</p></div></div>` : ''}
    <div class="gruppe-titel">Synchronisierung</div>
    <div class="gruppe">
      <div class="zeile"><span class="sync-ic">${ic('wolke', 20)}</span><div class="haupt"><small id="sync-status">${esc(Sync.text())}</small></div></div>
      ${feld('Konto', 'data-ein="syncFeld" data-f="owner" autocapitalize="none" autocorrect="off" spellcheck="false"', c.owner)}
      ${feld('Repo', 'data-ein="syncFeld" data-f="repo" autocapitalize="none" autocorrect="off" spellcheck="false"', c.repo)}
      ${feld('Datei', 'data-ein="syncFeld" data-f="pfad" autocapitalize="none" autocorrect="off" spellcheck="false"', c.pfad)}
      ${feld('Token', 'data-ein="syncFeld" data-f="token" type="password" placeholder="github_pat_…" autocapitalize="none" autocorrect="off" spellcheck="false"', c.token)}
    </div>
    <button class="knopf haupt breit" data-akt="syncJetzt">Jetzt synchronisieren</button>
    <p class="hinweis">Deine Daten liegen als eine Datei im privaten Repo. Das Token braucht Lese- und Schreibrecht auf „Contents“ dieses Repos, dasselbe wie beim Panel. Es bleibt nur auf diesem Gerät.</p>

${window.GYM_VORSCHAU ? '' : `    <div class="gruppe-titel">Sicherung</div>
    <div class="gruppe">
      <button class="zeile" data-akt="exportieren"><div class="haupt"><b>Als Datei sichern</b><small>${D.trainings.length} Trainings, ${D.geraete.length} Geräte, ${D.uebungen.length} Übungen</small></div>${ic('chevR', 16)}</button>
      <label class="zeile"><div class="haupt"><b>Aus Datei einlesen</b><small>Wird mit dem jetzigen Stand zusammengeführt</small></div>${ic('chevR', 16)}<input type="file" accept="application/json,.json" data-ein="importieren" hidden></label>
    </div>`}
    <div class="gruppe-titel">Studio</div>
    <p class="hinweis oben">Was es im Studio gibt. Ausgeschaltetes Equipment blendet die Bibliothek aus.</p>
    <div class="muskelchips">${Object.entries(EQUIP).filter(([k]) => k !== 'sonst').map(([k, q]) => { const an = !ohneEquip().includes(k); return `<button class="chip ${an ? 'an' : ''}" data-akt="equipDa" data-k="${k}" aria-pressed="${an}">${esc(q.name)}</button>`; }).join('')}</div>
    ${(() => { const h = hantelEinst(); return `<div class="gruppe">
      ${zahlfeld('Kurzhanteln ab', 'data-ein="hantelFeld" data-f="kmin"', h.kmin, 'kg')}
      ${zahlfeld('Kurzhanteln bis', 'data-ein="hantelFeld" data-f="kmax"', h.kmax, 'kg')}
      ${zahlfeld('Schritt', 'data-ein="hantelFeld" data-f="kschritt"', h.kschritt, 'kg')}
      ${zahlfeld('Langhantel leer', 'data-ein="hantelFeld" data-f="stange"', h.stange, 'kg')}
      ${zahlfeld('SZ-Stange leer', 'data-ein="hantelFeld" data-f="sz"', h.sz, 'kg')}
    </div>`; })()}
    <div class="gruppe"><button class="zeile" data-akt="vorlage"><div class="haupt"><b>AlphaClub-Geräteliste übernehmen</b><small>Bekannte Maschinen mit passenden Übungen. Schon Vorhandenes bleibt, wie es ist.</small></div>${ic('chevR', 16)}</button></div>
    <p class="hinweis">Tipp fürs iPhone: Öffne die Seite in Safari und wähle „Zum Home-Bildschirm“. Dann startet sie wie eine App und funktioniert im Studio auch ohne Netz.</p>`;
}

Object.assign(Akt, {
  syncJetzt() { Sync.abgleich(true); },
  exportieren() {
    const blob = new Blob([JSON.stringify(D, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `gym-daten-${tagKey(Date.now())}.json`;
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  },
});
Object.assign(Ein, {
  syncFeld(el) {
    const c = Sync.cfg();
    c[el.dataset.f] = el.value.trim();
    Sync.speichereCfg({ owner: c.owner, repo: c.repo, pfad: c.pfad, token: c.token });
    Sync.fehler = '';
    Sync.melde();
  },
  async importieren(el) {
    const datei = el.files && el.files[0];
    if (!datei) return;
    try {
      const fremd = JSON.parse(await datei.text());
      if (!fremd || !Array.isArray(fremd.trainings) || !Array.isArray(fremd.uebungen)) throw new Error('falsches Format');
      D = mischen(D, fremd);
      migriere();
      sichern();
      zeichne();
      toast('Datei eingelesen');
    } catch {
      toast('Diese Datei enthält keine Gym-Daten');
    }
    el.value = '';
  },
});
