# Baut die Übungsbibliothek aus dem RepDB-Datensatz (freie Version, https://repdb.co).
# Aufruf: python3 -I tools/repdb.py <repdb/exercises.json> <alte bibliothek.js> <ausgabeordner gym/>
# Erzeugt gym/js/bibliothek.js (Index) und gym/daten/uebungen.json (Beschreibung, Anleitung, Tipps, lädt bei Bedarf).
import json, re, sys

rep = json.load(open(sys.argv[1]))['exercises']
alt_src = open(sys.argv[2], encoding='utf8').read()
alt = json.loads(alt_src[alt_src.index('['):alt_src.index('];') + 1]) if 'const BIBLIOTHEK' in alt_src else []
ziel = sys.argv[3]

MUSKEL = {
    'pectoralis_major': 'Brust', 'latissimus_dorsi': 'Lat', 'trapezius': 'Nacken', 'rhomboids': 'Oberer Rücken',
    'erector_spinae': 'Unterer Rücken', 'quadratus_lumborum': 'Unterer Rücken',
    'anterior_deltoid': 'Vordere Schulter', 'lateral_deltoid': 'Seitliche Schulter', 'posterior_deltoid': 'Hintere Schulter',
    'infraspinatus_teres_minor': 'Hintere Schulter', 'supraspinatus': 'Hintere Schulter',
    'biceps_brachii': 'Bizeps', 'brachialis': 'Bizeps', 'brachioradialis': 'Unterarme', 'forearm_flexors': 'Unterarme',
    'forearm_extensors': 'Unterarme', 'forearms': 'Unterarme', 'triceps_brachii': 'Trizeps',
    'rectus_abdominis': 'Bauch', 'obliques': 'Bauch', 'transverse_abdominis': 'Bauch', 'serratus_anterior': 'Bauch', 'hip_flexors': 'Bauch',
    'quadriceps': 'Quadrizeps', 'hamstrings': 'Beinbeuger', 'gluteus_maximus': 'Gesäß', 'gluteus_medius': 'Gesäß',
    'adductors': 'Adduktoren', 'abductors': 'Abduktoren', 'gastrocnemius': 'Waden', 'soleus': 'Waden', 'tibialis_anterior': 'Waden',
}
KOERPER = {None, 'pull_up_bar', 'dip_station', 'rings', 'suspension_trainer', 'plyo_box', 'ab_wheel', 'parallettes', 'climbing_rope'}
def equip(e):
    q, i = e.get('equipment'), e['id']
    if 'plate-loaded' in i or q in ('leg_press', 'hack_squat', 'shrug_machine', 'hip_thrust_machine', 'donkey_calf_raise_machine'): return 'plate'
    if q == 'dumbbell': return 'kurzhantel'
    if q in ('barbell', 'trap_bar'): return 'langhantel'
    if q == 'ez_bar': return 'sz'
    if q == 'kettlebell': return 'kettlebell'
    if q == 'cable': return 'kabel'
    if q == 'smith_machine': return 'multipresse'
    if q and (q.endswith('_machine') or q in ('leg_curl', 'leg_extension')): return 'maschine'
    if q in KOERPER or (q == 'flat_bench' and e.get('is_bodyweight')): return 'koerper'
    return 'sonst'

def name(e):
    n = e['name_de'].strip()
    n = re.sub(r'\ban der Smith-Maschine\b', 'an der Multipresse', n)
    n = re.sub(r'\bSmith[- ]Maschine\b|\bSmith Machine\b', 'Multipresse', n)
    n = n.replace('Lat-Pulldown', 'Latzug').replace('Latziehen', 'Latzug')
    FEST = {'machine-calf-raise': 'Wadenheben an der Maschine', 'seated-calf-raise': 'Wadenheben sitzend', 'standing-calf-raise': 'Wadenheben stehend',
            'dips': 'Dips (Brust)', 'tricep-pushdown': 'Trizepsdrücken am Kabel', 'v-bar-tricep-pushdown': 'Trizepsdrücken mit V-Griff',
            'behind-the-neck-lat-pulldown': 'Nackenlatzug', 'v-bar-lat-pulldown': 'Latzug mit V-Griff', 'one-arm-lat-pulldown': 'Latzug einarmig',
            'cable-upright-row': 'Aufrechtes Rudern am Kabel', 'smith-machine-upright-row': 'Aufrechtes Rudern an der Multipresse',
            'plate-loaded-shrug': 'Shrugs an der Scheibenmaschine', 'lateral-raise': 'Seitheben mit Kurzhanteln', 'seated-dumbbell-lateral-raise': 'Seitheben sitzend',
            'chest-press-machine': 'Brustpresse', 'machine-shoulder-press': 'Schulterpresse', 'chest-supported-machine-row': 'Rudern mit Brustauflage', 'seated-cable-row': 'Rudern am Kabel', 'lat-pulldown': 'Latzug', 'smith-machine-shrug': 'Shrugs an der Multipresse'}
    return FEST.get(e['id'], n)

index, details = [], {}
for e in rep:
    prim = [MUSKEL[m] for m in (e.get('primary_muscles') or []) if m in MUSKEL]
    if not prim: continue
    p = prim[0]
    # Für Kniebeugen und Beinpressen zählt hier der Quadrizeps als Hauptmuskel, nicht das Gesäß
    if 'quadriceps' in (e.get('primary_muscles') or []) or (re.search(r'leg-press|squat', e['id']) and 'quadriceps' in (e.get('secondary_muscles') or [])):
        p = 'Quadrizeps'; prim = [p] + [m for m in prim if m != p]
    sek = []
    for m in prim[1:] + [MUSKEL[m] for m in (e.get('secondary_muscles') or []) if m in MUSKEL]:
        if m != p and m not in sek: sek.append(m)
    fl = e['images']['flat']
    posen = 'sp' if 'start' in fl and 'peak' in fl else 'm'
    index.append([e['id'], name(e), equip(e), p, sek, posen, e['name_en']])
    details[e['id']] = {'b': e.get('description_de') or '', 'a': e.get('instructions_de') or [], 't': e.get('tips_de') or []}
index.sort(key=lambda r: r[1].lower())

# Alte Bibliothek (free-exercise-db) auf die neue abbilden, damit gespeicherte Übungen ihr Bild behalten
STOP = {'with', 'the', 'on', 'a', 'and', 'to', 'of', 'version', 'flat', 'machine', 'cable', 'dumbbell', 'barbell', 'smith', 'lever', 'leverage', 'ez', 'bar', 'kettlebell', 'grip', 'medium'}
def tok(n):
    n = re.sub(r'[^a-z0-9 ]', ' ', n.lower().replace('-', ' ').replace('_', ' '))
    return {w.rstrip('s') for w in n.split() if w not in STOP}
nt = [(r, tok(r[6])) for r in index]
alt2neu = {}
for r in alt:
    t = tok(r[6]) if len(r) > 6 and r[6] else tok(r[1])
    best, bs = None, 0
    for n, tn in nt:
        if n[2] != r[2] or not t or not tn: continue
        s = len(t & tn) / len(t | tn)
        if s > bs: best, bs = n, s
    if best and bs >= .6: alt2neu[r[0]] = best[0]
alt2neu.update({'Side_Lateral_Raise': 'lateral-raise', 'Dumbbell_Lying_Rear_Lateral_Raise': 'rear-delt-fly', 'x-lateral-raise-maschine': 'plate-loaded-lateral-raise', 'x-seated-dip-plate': 'plate-loaded-seated-dip-machine'})
for k in ('One_Arm_Floor_Press', 'One_Arm_Dumbbell_Bench_Press', 'Zottman_Preacher_Curl'): alt2neu.pop(k, None)

with open(f'{ziel}/js/bibliothek.js', 'w', encoding='utf8') as f:
    f.write("'use strict';\n/* Übungsbibliothek: Exercise data by RepDB (repdb.co), freie Version. Erzeugt mit tools/repdb.py.\n"
            "   [id, Name, Equipment, Primärmuskel, weitere Muskeln, Posen (sp = Start und Ende, m = ein Bild), englischer Name] */\n")
    f.write('const BIBLIOTHEK = [\n' + ',\n'.join(json.dumps(r, ensure_ascii=False, separators=(',', ':')) for r in index) + '\n];\n')
    f.write('// Einträge der früheren Bibliothek, damit schon angelegte Übungen ihr Bild finden\n')
    f.write('const BIB_ALT = ' + json.dumps(alt2neu, separators=(',', ':')) + ';\n')
import os
os.makedirs(f'{ziel}/daten', exist_ok=True)
json.dump(details, open(f'{ziel}/daten/uebungen.json', 'w', encoding='utf8'), ensure_ascii=False, separators=(',', ':'))
print(len(index), 'Übungen,', len(alt2neu), 'alte Einträge zugeordnet', file=sys.stderr)
from collections import Counter
print(Counter(r[2] for r in index), file=sys.stderr)
