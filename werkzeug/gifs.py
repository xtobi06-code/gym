# Ordnet Bibliothekseinträgen eine Animation aus ExerciseDB zu (nach Name und Equipment)
import json, re, sys
edb = json.load(open(sys.argv[1]))['uebungen']
src = open(sys.argv[2], encoding='utf8').read()
bib = json.loads(src[src.index('['):src.rindex(']') + 1])
EQ = {'kurzhantel': {'dumbbell'}, 'langhantel': {'barbell', 'olympic barbell'}, 'sz': {'EZ bar'}, 'kettlebell': {'kettlebell'}, 'kabel': {'cable'},
      'maschine': {'leverage machine', 'sled machine'}, 'plate': {'leverage machine', 'sled machine'}, 'multipresse': {'smith machine'}, 'koerper': {'bodyweight', 'assisted', 'weighted'}}
STOP = {'with', 'the', 'on', 'a', 'and', 'attachment', 'machine', 'cable', 'dumbbell', 'barbell', 'smith', 'lever', 'leverage', 'sled', 'ez', 'bar', 'kettlebell', 'to', 'of', 'version', 'x', 'flat'}
SYN = {'triceps': 'tricep', 'biceps': 'bicep', 'presses': 'press', 'rows': 'row', 'raises': 'raise', 'curls': 'curl', 'extensions': 'extension', 'flyes': 'fly', 'flys': 'fly', 'squats': 'squat', 'pulldowns': 'pulldown', 'dips': 'dip', 'shrugs': 'shrug', 'lunges': 'lunge', 'pushups': 'pushup', 'push': 'push', 'ups': 'up'}
def tok(n):
    n = n.lower().replace('-', ' ').replace('_', ' ')
    n = re.sub(r'[^a-z0-9 ]', ' ', n)
    return {SYN.get(w, w) for w in n.split() if w not in STOP}
idx = [(x, tok(x['name']), set(x['equipments'])) for x in edb]
out, n = {}, 0
for r in bib:
    if not r[6]: continue
    t = tok(r[6]); ok = EQ.get(r[2], set())
    best, bs = None, 0
    for x, tx, ex in idx:
        if not (ex & ok) or not t or not tx: continue
        s = len(t & tx) / len(t | tx)
        if s > bs: best, bs = x, s
    if best and bs >= float(sys.argv[3]):
        out[r[0]] = best['exerciseId']; n += 1
        print(f'{bs:.2f} {r[6]!r:45} -> {best["name"]}', file=sys.stderr)
print(json.dumps(out))
print(n, 'von', len(bib), file=sys.stderr)
