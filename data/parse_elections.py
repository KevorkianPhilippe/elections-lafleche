"""Parse raw election data files and generate historique_bv.json for La Fleche"""
import json
import csv
import io

def parse_europeennes_2024():
    """Parse européennes 2024 CSV (semicolon-separated, with quotes)"""
    # Mapping des numéros de panneau vers les blocs politiques
    # On regroupe les 38 listes en 6 blocs + abstention
    bloc_mapping = {
        # Gauche: PS/PP (Réveiller l'Europe #27) + LFI (#4) + EELV (#6) + PCF/Gauche Unie (#33) + LO (#19) + autres gauche
        4: 'Gauche',   # LFI
        6: 'Gauche',   # EELV
        19: 'Gauche',  # Lutte Ouvrière
        20: 'Gauche',  # Changer l'Europe (DVG)
        27: 'Gauche',  # Réveiller l'Europe (PS/PP Glucksmann)
        28: 'Gauche',  # Communistes pour la paix
        31: 'Gauche',  # Europe Territoires Écologie (DVG)
        33: 'Gauche',  # Gauche Unie (PCF Roussel)
        # Macron
        11: 'Macron',  # Besoin d'Europe (Renaissance)
        # LR
        18: 'LR',      # La Droite (Bellamy)
        # RN
        5: 'RN',       # Bardella
        # Reconquête
        3: 'Reconquete',  # Maréchal
        # Écologie (hors EELV, petits partis écolos)
        13: 'Autres',  # Équinoxe
        14: 'Autres',  # Écologie Positive
        35: 'Autres',  # Écologie au Centre
        # Extrême gauche (hors LFI/LO)
        9: 'Autres',   # Parti Révolutionnaire Communistes
        16: 'Autres',  # Paix et Décroissance
        22: 'Autres',  # Urgence Révolution
        23: 'Autres',  # PPL - Parti des Travailleurs
        # Extrême droite (hors RN/Reconquête)
        24: 'Autres',  # L'Europe ça suffit
        26: 'Autres',  # Forteresse Europe
        # Divers
        29: 'Autres',  # Alliance Rurale
    }
    # Tout ce qui n'est pas mappé = Autres

    bureaux = {}
    with open('data/raw/europeennes2024_lafleche.csv', 'r', encoding='utf-8') as f:
        for line in f:
            # Parse semicolon-separated, some fields quoted
            reader = csv.reader(io.StringIO(line), delimiter=';')
            fields = next(reader)

            bv = fields[6].strip('"').lstrip('0')  # "0001" -> "1"
            inscrits = int(fields[7])
            votants = int(fields[8])
            exprimes = int(fields[12])
            blancs = int(fields[15])
            nuls = int(fields[18])

            blocs = {'Gauche': 0, 'Macron': 0, 'LR': 0, 'RN': 0, 'Reconquete': 0, 'Autres': 0}

            # Parse each list (4 fields per list: numéro, nuance, abrégé, libellé, voix, %ins, %exp, sièges)
            # Starting at index 21, each list has 7 fields (8 with seats)
            idx = 21
            while idx + 6 < len(fields):
                try:
                    panneau = int(fields[idx])
                    voix = int(fields[idx + 4])
                    bloc = bloc_mapping.get(panneau, 'Autres')
                    blocs[bloc] += voix
                    idx += 7  # 7 fields per list (numéro, nuance, abrégé, libellé, voix, %ins, %exp)
                    # Check if there's a "Sièges" field
                    if idx < len(fields):
                        try:
                            int(fields[idx])
                            # This could be seats or next panneau number
                            # Seats are 0-based small numbers, panneau starts at 1
                            # If next field after this is a nuance code, then this is seats
                            if idx + 1 < len(fields) and fields[idx + 1] in ('LDIV', 'LFI', 'LRN', 'LVEC', 'LENS', 'LLR', 'LREC', 'LEXG', 'LDVG', 'LECO', 'LCOM', 'LEXD', 'LUG', 'LDVD'):
                                pass  # This is the next panneau, don't skip
                            else:
                                idx += 1  # Skip seats field
                        except ValueError:
                            pass
                except (ValueError, IndexError):
                    break

            bureaux[bv] = {
                'inscrits': inscrits,
                'votants': votants,
                'exprimes': exprimes,
                'blancs': blancs,
                'nuls': nuls,
                'blocs': blocs
            }

    return bureaux


def parse_europeennes_2024_v2():
    """Version 2: parse by nuance code instead of panneau number"""
    nuance_to_bloc = {
        'LFI': 'Gauche', 'LVEC': 'Gauche', 'LUG': 'Gauche', 'LCOM': 'Gauche',
        'LDVG': 'Gauche',
        'LENS': 'Macron',
        'LLR': 'LR',
        'LRN': 'RN',
        'LREC': 'Reconquete',
        'LEXG': 'Autres', 'LECO': 'Autres', 'LDIV': 'Autres',
        'LEXD': 'Autres', 'LDVD': 'Autres',
    }

    bureaux = {}
    with open('data/raw/europeennes2024_lafleche.csv', 'r', encoding='utf-8') as f:
        for line in f:
            reader = csv.reader(io.StringIO(line), delimiter=';')
            fields = next(reader)

            bv = fields[6].strip('"').lstrip('0')
            inscrits = int(fields[7])
            votants = int(fields[8])
            exprimes = int(fields[12])
            blancs = int(fields[15])
            nuls = int(fields[18])

            blocs = {'Gauche': 0, 'Macron': 0, 'LR': 0, 'RN': 0, 'Reconquete': 0, 'Autres': 0}

            # Each list block: panneau, nuance, abrégé, libellé, voix, %ins, %exp, sièges (8 fields)
            idx = 21
            while idx + 7 < len(fields):
                try:
                    nuance = fields[idx + 1]
                    voix = int(fields[idx + 4])
                    bloc = nuance_to_bloc.get(nuance, 'Autres')
                    blocs[bloc] += voix
                    idx += 8  # panneau, nuance, abrégé, libellé, voix, %ins, %exp, sièges
                except (ValueError, IndexError):
                    break

            bureaux[bv] = {
                'inscrits': inscrits,
                'votants': votants,
                'exprimes': exprimes,
                'blancs': blancs,
                'nuls': nuls,
                'blocs': blocs
            }

    return bureaux


def parse_legislatives_2024():
    """Parse législatives 2024 T1 CSV (semicolon-separated)"""
    # Candidats: 1=JACK(UG), 2=MARTINEAU(ENS), 3=TROCHON(DSV),
    #            4=LEMOIGNE(RN), 5=BRUTOUT(EXG), 6=GRUAU(LR), 7=DE MALHERBE(REC)
    nuance_to_bloc = {
        'UG': 'Gauche',
        'ENS': 'Macron',
        'DSV': 'Autres',
        'RN': 'RN',
        'EXG': 'Gauche',  # Extrême gauche -> Gauche pour simplifier
        'LR': 'LR',
        'REC': 'Reconquete',
    }

    bureaux = {}
    with open('data/raw/legislatives2024_lafleche_full.csv', 'r', encoding='utf-8') as f:
        reader = csv.reader(f, delimiter=';')
        header = next(reader)  # Skip header

        for row in reader:
            if not row or len(row) < 20:
                continue
            bv = row[4].lstrip('0') or '1'
            inscrits = int(row[5])
            votants = int(row[6])
            exprimes = int(row[10])
            blancs = int(row[13])
            nuls = int(row[16])

            blocs = {'Gauche': 0, 'Macron': 0, 'LR': 0, 'RN': 0, 'Reconquete': 0, 'Autres': 0}
            candidats = {}

            # Each candidate: panneau, nuance, nom, prénom, sexe, voix, %ins, %exp, élu (9 fields)
            idx = 19
            while idx + 7 < len(row):
                try:
                    if not row[idx]:
                        break
                    nuance = row[idx + 1]
                    nom = row[idx + 2]
                    voix = int(row[idx + 5])
                    bloc = nuance_to_bloc.get(nuance, 'Autres')
                    blocs[bloc] += voix
                    candidats[nom] = voix
                    idx += 9  # 9 fields per candidate
                except (ValueError, IndexError):
                    break

            bureaux[bv] = {
                'inscrits': inscrits,
                'votants': votants,
                'exprimes': exprimes,
                'blancs': blancs,
                'nuls': nuls,
                'blocs': blocs,
                'candidats': candidats
            }

    return bureaux


def parse_municipales_2020():
    """Parse municipales 2020 T1 TXT (tab-separated, was latin-1)"""
    bureaux = {}
    with open('data/raw/municipales2020_lafleche.txt', 'r', encoding='utf-8') as f:
        for line in f:
            parts = line.strip().split('\t')
            if len(parts) < 25:
                continue

            bv = parts[4].lstrip('0') or '1'
            inscrits = int(parts[5])
            # Municipales format: inscrits, abstentions, %abs, votants, %vot, blancs, %bl/ins, %bl/vot, nuls, %nu/ins, %nu/vot, exprimes, %exp/ins, %exp/vot
            abstentions = int(parts[6])
            votants = int(parts[8])
            blancs = int(parts[10])
            nuls = int(parts[13])
            exprimes = int(parts[16])

            listes = {}
            # Each list: N.Pan, Code Nuance, Sexe, Nom, Prénom, Liste, Voix, %Voix/Ins, %Voix/Exp
            idx = 19
            while idx + 8 < len(parts):
                try:
                    if not parts[idx]:
                        break
                    nom = parts[idx + 3]
                    liste_nom = parts[idx + 5]
                    voix = int(parts[idx + 6])
                    listes[nom] = {'liste': liste_nom, 'voix': voix}
                    idx += 9
                except (ValueError, IndexError):
                    break

            bureaux[bv] = {
                'inscrits': inscrits,
                'votants': votants,
                'exprimes': exprimes,
                'blancs': blancs,
                'nuls': nuls,
                'listes': listes
            }

    return bureaux


def main():
    print("Parsing européennes 2024...")
    euro = parse_europeennes_2024_v2()
    print(f"  {len(euro)} bureaux")
    # Verify totals
    total_exp = sum(b['exprimes'] for b in euro.values())
    total_rn = sum(b['blocs']['RN'] for b in euro.values())
    print(f"  Total exprimés: {total_exp}, RN: {total_rn} ({total_rn/total_exp*100:.1f}%)")
    total_gauche = sum(b['blocs']['Gauche'] for b in euro.values())
    total_macron = sum(b['blocs']['Macron'] for b in euro.values())
    print(f"  Gauche: {total_gauche} ({total_gauche/total_exp*100:.1f}%), Macron: {total_macron} ({total_macron/total_exp*100:.1f}%)")

    print("\nParsing législatives 2024 T1...")
    legis = parse_legislatives_2024()
    print(f"  {len(legis)} bureaux")
    total_exp = sum(b['exprimes'] for b in legis.values())
    for bloc in ['Gauche', 'Macron', 'LR', 'RN', 'Reconquete', 'Autres']:
        total = sum(b['blocs'][bloc] for b in legis.values())
        print(f"  {bloc}: {total} ({total/total_exp*100:.1f}%)")

    print("\nParsing municipales 2020 T1...")
    muni = parse_municipales_2020()
    print(f"  {len(muni)} bureaux")
    total_exp = sum(b['exprimes'] for b in muni.values())
    for bv in sorted(muni.keys(), key=int):
        data = muni[bv]
        listes_str = ", ".join(f"{k}: {v['voix']}" for k, v in data['listes'].items())
        print(f"  BV {bv}: {listes_str}")

    # Generate JSON
    result = {
        'commune': 'La Flèche',
        'codeInsee': '72154',
        'codePostal': '72200',
        'nbBureaux': 17,
        'europeennes2024': {
            'date': '2024-06-09',
            'type': 'Européennes',
            'blocs': ['Gauche', 'Macron', 'LR', 'RN', 'Reconquete', 'Autres'],
            'bureaux': {}
        },
        'legislatives2024': {
            'date': '2024-06-30',
            'type': 'Législatives T1',
            'blocs': ['Gauche', 'Macron', 'LR', 'RN', 'Reconquete', 'Autres'],
            'candidats': {
                'Gauche': 'JACK Mathilde (UG) + BRUTOUT Maryse (EXG)',
                'Macron': 'MARTINEAU Eric (ENS)',
                'LR': 'GRUAU Vincent',
                'RN': 'LEMOIGNE Romain',
                'Reconquete': 'DE MALHERBE Raymond',
                'Autres': 'TROCHON Éric (DSV)'
            },
            'bureaux': {}
        },
        'municipales2020': {
            'date': '2020-03-15',
            'type': 'Municipales T1',
            'listes': {
                'BEAUPERE': 'ENSEMBLE POUR LE RENOUVEAU DE LA FLECHE',
                'GRELET-CERTENAIS': 'La Flèche Territoire de Projets'
            },
            'bureaux': {}
        }
    }

    for bv, data in sorted(euro.items(), key=lambda x: int(x[0])):
        result['europeennes2024']['bureaux'][bv] = {
            'inscrits': data['inscrits'],
            'votants': data['votants'],
            'exprimes': data['exprimes'],
            'blancs': data['blancs'],
            'nuls': data['nuls'],
            'voix': data['blocs']
        }

    for bv, data in sorted(legis.items(), key=lambda x: int(x[0])):
        result['legislatives2024']['bureaux'][bv] = {
            'inscrits': data['inscrits'],
            'votants': data['votants'],
            'exprimes': data['exprimes'],
            'blancs': data['blancs'],
            'nuls': data['nuls'],
            'voix': data['blocs']
        }

    for bv, data in sorted(muni.items(), key=lambda x: int(x[0])):
        listes_voix = {}
        for nom, info in data['listes'].items():
            listes_voix[nom] = info['voix']
        result['municipales2020']['bureaux'][bv] = {
            'inscrits': data['inscrits'],
            'votants': data['votants'],
            'exprimes': data['exprimes'],
            'blancs': data['blancs'],
            'nuls': data['nuls'],
            'voix': listes_voix
        }

    with open('data/historique_bv.json', 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f"\nJSON generated: data/historique_bv.json")
    print(f"File size: {len(json.dumps(result, ensure_ascii=False, indent=2))} bytes")


if __name__ == '__main__':
    main()
