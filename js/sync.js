'use strict';
/* Abgleich mit einer JSON-Datei im privaten GitHub-Repo (Standard: data-gym).
   Ablauf: Datei lesen, mit dem lokalen Stand zusammenführen, bei Unterschied zurückschreiben. */

const Sync = {
  KEY: 'gym-sync',
  offen: false,   // es gibt lokale Änderungen, die noch nicht oben sind
  laeuft: false,
  fehler: '',
  timer: null,

  cfg() {
    const np = lager.get('np-config', {});   // Zugang vom Panel mitbenutzen, falls im selben Browser vorhanden
    return { owner: np.owner || 'xtobi06-code', repo: 'data-gym', pfad: 'daten.json', token: np.token || '', ...lager.get(this.KEY, {}) };
  },
  speichereCfg(c) { lager.set(this.KEY, c); },
  get zeit() { return lager.get('gym-sync-zeit', 0); },
  get bereit() { return !!this.cfg().token; },

  // Nach jeder Änderung aufgerufen: kurz warten, dann abgleichen
  merken() {
    this.offen = true;
    clearTimeout(this.timer);
    if (this.bereit) this.timer = setTimeout(() => this.abgleich(), 20000);
  },

  enc(s) {
    const bytes = new TextEncoder().encode(s);
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  },
  dec(b64) {
    const bin = atob(b64.replace(/\n/g, ''));
    return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
  },
  url(c) { return `https://api.github.com/repos/${encodeURIComponent(c.owner)}/${encodeURIComponent(c.repo)}/contents/${c.pfad.split('/').map(encodeURIComponent).join('/')}`; },
  kopf(c) { return { Authorization: `Bearer ${c.token}`, Accept: 'application/vnd.github+json' }; },
  async holen(u, opt = {}, ms = 15000) {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), ms);
    try { return await fetch(u, { ...opt, signal: ac.signal }); } finally { clearTimeout(t); }
  },

  async lesen(c) {
    const r = await this.holen(this.url(c), { headers: this.kopf(c), cache: 'no-store' });
    if (r.status === 401 || r.status === 403) throw new Error('Token ungültig oder abgelaufen');
    if (r.status === 404) return null;
    if (!r.ok) throw new Error(`GitHub antwortet mit Status ${r.status}`);
    const j = await r.json();
    let content = j.content;
    if (!content && j.sha) {   // Dateien über 1 MB kommen ohne Inhalt, dann über die Blob-Adresse holen
      const b = await this.holen(`https://api.github.com/repos/${encodeURIComponent(c.owner)}/${encodeURIComponent(c.repo)}/git/blobs/${j.sha}`, { headers: this.kopf(c) });
      if (!b.ok) throw new Error(`GitHub antwortet mit Status ${b.status}`);
      content = (await b.json()).content;
    }
    return { data: JSON.parse(this.dec(content)), sha: j.sha };
  },
  async schreiben(c, data, sha) {
    const body = { message: 'Gym: Stand aktualisiert', content: this.enc(JSON.stringify(data) + '\n') };
    if (sha) body.sha = sha;
    const r = await this.holen(this.url(c), { method: 'PUT', headers: { ...this.kopf(c), 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (r.status === 401 || r.status === 403) throw new Error('Token ungültig oder ohne Schreibrecht');
    if (r.status === 409 || r.status === 422) { const e = new Error('Die Datei wurde gleichzeitig geändert'); e.konflikt = true; throw e; }
    if (!r.ok) throw new Error(`GitHub antwortet mit Status ${r.status}`);
  },

  async abgleich(manuell = false) {
    const c = this.cfg();
    if (!c.token) { if (manuell) toast('Trage zuerst dein GitHub-Token ein'); return false; }
    if (this.laeuft) return false;
    this.laeuft = true; this.melde();
    clearTimeout(this.timer);
    try {
      for (let versuch = 0; versuch < 3; versuch++) {
        const fern = await this.lesen(c);
        const neu = fern ? mischen(D, fern.data) : D;
        if (fern && kern(neu) !== kern(D)) { D = neu; migriere(); sichern(true); zeichne(); }
        if (fern && kern(neu) === kern(fern.data)) break;
        try { await this.schreiben(c, neu, fern ? fern.sha : null); break; }
        catch (e) { if (!e.konflikt || versuch === 2) throw e; }
      }
      this.offen = false; this.fehler = '';
      lager.set('gym-sync-zeit', Date.now());
      if (manuell) toast('Synchronisiert');
      return true;
    } catch (e) {
      this.fehler = e.name === 'AbortError' ? 'Keine Verbindung zu GitHub' : (e.message === 'Failed to fetch' || e.message === 'Load failed' ? 'Keine Verbindung zu GitHub' : e.message);
      if (manuell) toast(this.fehler);
      return false;
    } finally {
      this.laeuft = false; this.melde();
    }
  },

  // Statuszeile unter "Mehr" auffrischen, falls sie gerade sichtbar ist
  melde() {
    const el = $('#sync-status');
    if (el) el.textContent = this.text();
  },
  text() {
    if (!this.bereit) return 'Nicht eingerichtet, die Daten liegen nur auf diesem Gerät';
    if (this.laeuft) return 'Synchronisiert gerade';
    if (this.fehler) return this.fehler;
    if (!this.zeit) return 'Noch nicht synchronisiert';
    const min = Math.round((Date.now() - this.zeit) / 60000);
    const wann = min < 1 ? 'gerade eben' : min < 60 ? `vor ${min} min` : fmtWochentag.format(this.zeit);
    return `Zuletzt synchronisiert ${wann}` + (this.offen ? ', neue Änderungen warten' : '');
  },
};
