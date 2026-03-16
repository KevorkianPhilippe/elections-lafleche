#!/usr/bin/env python3
"""Analyse ecologique rigoureuse pour projection T2 municipales La Fleche 2026.
   Methode: regression cross-bureaux, correlations, analogie T2 nationaux.
"""
import json, math, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

with open(os.path.join(ROOT, "data", "historique_bv.json"), "r", encoding="utf-8") as f:
    hist = json.load(f)
with open(os.path.join(ROOT, "data", "resultats_t1_definitifs.json"), "r", encoding="utf-8") as f:
    t1 = json.load(f)

BV = [str(i) for i in range(1, 18)]

# === Municipal T1 2026 ===
muni = {}
for bv in BV:
    r = t1["resultats"][bv.zfill(2)]
    expr = r["votants"] - r["blancs"] - r["nuls"]
    muni[bv] = {
        "inscrits": r["inscrits"], "votants": r["votants"], "exprimes": expr,
        "L": r["voix"][0], "D": r["voix"][1], "G": r["voix"][2],
        "pL": r["voix"][0]/expr*100, "pD": r["voix"][1]/expr*100, "pG": r["voix"][2]/expr*100,
        "part": r["votants"]/r["inscrits"]*100,
    }

# === National elections (blocs % exprimes) ===
nat = {}
for ek in ["europeennes2024", "legislatives2024t1", "presidentielle2022t1",
           "legislatives2022t1", "europeennes2019"]:
    elec = hist["elections"].get(ek, {})
    if not elec.get("bureaux"): continue
    nat[ek] = {}
    for bv in BV:
        bd = elec["bureaux"].get(bv, {})
        blocs = bd.get("blocs", {})
        expr = bd.get("exprimes", 1)
        nat[ek][bv] = {b: v/expr*100 for b, v in blocs.items()}
        nat[ek][bv]["_expr"] = expr
        nat[ek][bv]["_voix"] = blocs

# === T2 nationaux ===
pres_t2, leg_t2 = {}, {}
for bv in BV:
    bd = hist["elections"]["presidentielle2022t2"]["bureaux"][bv]
    e = bd["exprimes"]
    pres_t2[bv] = {"Mac": bd["voix"]["LREM"]/e*100, "LP": bd["voix"]["RN"]/e*100,
                    "bn": (bd["votants"]-e)/bd["votants"]*100}
    bd2 = hist["elections"]["legislatives2022t2"]["bureaux"][bv]
    e2 = bd2["exprimes"]
    leg_t2[bv] = {"ENS": bd2["voix"]["ENS"]/e2*100, "RN": bd2["voix"]["RN"]/e2*100,
                   "bn": (bd2["votants"]-e2)/bd2["votants"]*100}

# === PEARSON ===
def pearson(x, y):
    n = len(x)
    if n < 3: return 0.0
    mx, my = sum(x)/n, sum(y)/n
    sxy = sum((a-mx)*(b-my) for a,b in zip(x,y))
    sx = math.sqrt(max(0, sum((a-mx)**2 for a in x)))
    sy = math.sqrt(max(0, sum((b-my)**2 for b in y)))
    return sxy/(sx*sy) if sx*sy > 0 else 0.0

# ============================================================
print("=" * 80)
print("ANALYSE A : CORRELATIONS CROSS-BUREAUX (17 BV)")
print("  Question: quels blocs nationaux correlent avec Da Silva ?")
print("=" * 80)
print()

for ek in ["europeennes2024", "legislatives2024t1", "presidentielle2022t1"]:
    print(f"--- {ek} ---")
    for bloc in ["RN", "Gauche", "Macron", "LR", "Reconquete"]:
        x = [nat[ek][bv].get(bloc, 0) for bv in BV]
        rD = pearson(x, [muni[bv]["pD"] for bv in BV])
        rL = pearson(x, [muni[bv]["pL"] for bv in BV])
        rG = pearson(x, [muni[bv]["pG"] for bv in BV])
        print(f"  {bloc:15s} -> DaSilva r={rD:+.3f}  Lemoigne r={rL:+.3f}  Grelet r={rG:+.3f}")
    print()

# ============================================================
print("=" * 80)
print("ANALYSE B : REGRESSION BIVARIEE Da Silva = f(bloc)")
print("=" * 80)
print()

for ek in ["europeennes2024", "legislatives2024t1", "presidentielle2022t1"]:
    print(f"--- {ek} ---")
    for bloc in ["Macron", "LR", "RN", "Gauche", "Reconquete"]:
        x = [nat[ek][bv].get(bloc, 0) for bv in BV]
        y = [muni[bv]["pD"] for bv in BV]
        n = len(x)
        mx, my = sum(x)/n, sum(y)/n
        sxy = sum((a-mx)*(b-my) for a,b in zip(x,y))
        sxx = sum((a-mx)**2 for a in x)
        if sxx > 0:
            beta = sxy/sxx
            alpha = my - beta*mx
            r = pearson(x, y)
            print(f"  DaSilva = {alpha:.2f} {beta:+.3f}*{bloc:12s}  R={r:+.3f}  R2={r**2:.3f}")
    print()

# ============================================================
print("=" * 80)
print("ANALYSE C : ANALOGIE T2 NATIONAUX")
print("  Si les electeurs Da Silva sont 'macronistes', ils ont vote comment en T2 ?")
print("=" * 80)
print()

xD = [muni[bv]["pD"] for bv in BV]
xL = [muni[bv]["pL"] for bv in BV]
xG = [muni[bv]["pG"] for bv in BV]

print("Presidentielle T2 2022 (Macron vs Le Pen) :")
yMac = [pres_t2[bv]["Mac"] for bv in BV]
yLP  = [pres_t2[bv]["LP"]  for bv in BV]
print(f"  DaSilva  vs Macron_T2: r = {pearson(xD, yMac):+.3f}")
print(f"  DaSilva  vs LePen_T2:  r = {pearson(xD, yLP):+.3f}")
print(f"  Lemoigne vs LePen_T2:  r = {pearson(xL, yLP):+.3f}")
print(f"  Lemoigne vs Macron_T2: r = {pearson(xL, yMac):+.3f}")
print(f"  Grelet   vs Macron_T2: r = {pearson(xG, yMac):+.3f}")
print(f"  Grelet   vs LePen_T2:  r = {pearson(xG, yLP):+.3f}")
print()

print("Legislatives T2 2022 (Ensemble vs RN) :")
yE = [leg_t2[bv]["ENS"] for bv in BV]
yR = [leg_t2[bv]["RN"]  for bv in BV]
print(f"  DaSilva  vs ENS_T2:    r = {pearson(xD, yE):+.3f}")
print(f"  DaSilva  vs RN_T2:     r = {pearson(xD, yR):+.3f}")
print(f"  Lemoigne vs RN_T2:     r = {pearson(xL, yR):+.3f}")
print(f"  Grelet   vs ENS_T2:    r = {pearson(xG, yE):+.3f}")
print()

# ============================================================
print("=" * 80)
print("ANALYSE D : BUREAUX FORTS/FAIBLES DA SILVA")
print("=" * 80)
print()

ranked = sorted(BV, key=lambda bv: muni[bv]["pD"], reverse=True)
top5 = ranked[:5]
bot5 = ranked[-5:]

print("Top-5 bureaux Da Silva :")
for bv in top5:
    print(f"  BV{bv:>2}: D={muni[bv]['pD']:.1f}%  L={muni[bv]['pL']:.1f}%  G={muni[bv]['pG']:.1f}%"
          f"  | MacT2={pres_t2[bv]['Mac']:.1f}% LPT2={pres_t2[bv]['LP']:.1f}%")

print()
print("Bottom-5 bureaux Da Silva :")
for bv in bot5:
    print(f"  BV{bv:>2}: D={muni[bv]['pD']:.1f}%  L={muni[bv]['pL']:.1f}%  G={muni[bv]['pG']:.1f}%"
          f"  | MacT2={pres_t2[bv]['Mac']:.1f}% LPT2={pres_t2[bv]['LP']:.1f}%")

print()
aLt = sum(muni[bv]["pL"] for bv in top5)/5
aGt = sum(muni[bv]["pG"] for bv in top5)/5
aLb = sum(muni[bv]["pL"] for bv in bot5)/5
aGb = sum(muni[bv]["pG"] for bv in bot5)/5
print(f"Moyennes top-5:  L={aLt:.1f}%  G={aGt:.1f}%  ecart L-G = {aLt-aGt:+.1f}")
print(f"Moyennes bot-5:  L={aLb:.1f}%  G={aGb:.1f}%  ecart L-G = {aLb-aGb:+.1f}")
print(f"Delta (top-bot): L={aLt-aLb:+.1f}pts  G={aGt-aGb:+.1f}pts")
print()

# Municipales 2020 (Grelet vs Beaupere) - dans les fiefs Da Silva?
print("Municipales 2020 dans les fiefs Da Silva :")
muni2020 = hist["elections"]["municipales2020"]["bureaux"]
for bv in top5:
    g20 = muni2020[bv]["voix"]["GRELET-CERTENAIS"]/muni2020[bv]["exprimes"]*100
    b20 = muni2020[bv]["voix"]["BEAUP\u00c8RE"]/muni2020[bv]["exprimes"]*100
    print(f"  BV{bv:>2}: Grelet2020={g20:.1f}%  Beaupere2020={b20:.1f}%  |  DaSilva2026={muni[bv]['pD']:.1f}%")

print()

# ============================================================
print("=" * 80)
print("ANALYSE E : CONTRAINTE MATHEMATIQUE DE VICTOIRE")
print("=" * 80)
print()

L_base = 3014 * 0.95 + 2724 * 0.03  # loyaute L + fuite G->L
G_base = 2724 * 0.95 + 3014 * 0.03  # loyaute G + fuite L->G
gap = L_base - G_base
print(f"Base apres loyaute 95%/fuite 3% : Lemoigne={L_base:.0f}  Grelet={G_base:.0f}  Gap={gap:.0f} voix")
print()

print("Report necessaire pour egalite :")
for abst in [30, 35, 40, 45, 50, 55, 60]:
    dav = 1161 * (1 - abst/100)
    if dav > 0:
        pg = gap/(2*dav) + 0.5  # part Grelet pour egaliser
        print(f"  Abst={abst}%: {dav:.0f} votants -> Grelet doit capter {pg*100:.1f}% "
              f"(soit {pg*dav:.0f}/{dav:.0f}) pour egaliser")

print()
print("Projections selon differentes hypotheses de report :")
for abst in [35, 40, 45, 50]:
    for pL in [0.40, 0.45, 0.50, 0.55, 0.60]:
        dav = 1161 * (1 - abst/100)
        tL = L_base + dav * pL
        tG = G_base + dav * (1 - pL)
        tot = tL + tG
        print(f"  Abst={abst}% pL={pL*100:.0f}%: Lemoigne={tL/tot*100:.1f}% Grelet={tG/tot*100:.1f}%"
              f"  ecart={((tL-tG)/tot*100):.1f}pts")
    print()

# ============================================================
print("=" * 80)
print("SYNTHESE : ESTIMATION CENTRALE")
print("=" * 80)
print()

# Toutes les donnees convergent vers:
# 1. Da Silva = electorat Macron/LR (correle positivement avec Macron, LR)
# 2. Cet electorat a vote Macron au T2 presidentiel (anti-RN)
# 3. Mais municipalement, Lemoigne n'est PAS Le Pen - c'est un candidat local
# 4. Grelet a des LFI -> repoussoir pour les macronistes
# 5. Forte abstention car candidat orphelin

print("Les donnees montrent :")
print("  - Da Silva correle avec Macron/LR aux nationales")
print("  - Dans les fiefs Da Silva, l'ecart L-G est plus faible")
print("  - Au T2 national, ces electeurs votent Macron (anti-RN)")
print("  - MAIS au municipal, pas de transposition directe national->local")
print("  - Facteur cle: presence LFI chez Grelet = repoussoir centriste")
print()
print("Estimation centrale (notre meilleure inference) :")
print("  Abstention Da Silva : 40-50% (orphelins sans consigne)")
print("  Report parmi votants : ~50/50 a ~55/45 vers Lemoigne")
print("  (l'effet anti-LFI penche legerement Lemoigne)")
print()

# Calcul final
for scenario, abst, pL in [
    ("Bas (Grelet optimiste)", 35, 0.45),
    ("Central (notre best guess)", 45, 0.52),
    ("Haut (Lemoigne optimiste)", 50, 0.58),
]:
    dav = 1161 * (1 - abst/100)
    tL = L_base + dav * pL
    tG = G_base + dav * (1 - pL)
    tot = tL + tG
    print(f"  {scenario:35s}: Lemoigne={tL/tot*100:.1f}%  Grelet={tG/tot*100:.1f}%  ecart={((tL-tG)/tot*100):.1f}pts")
