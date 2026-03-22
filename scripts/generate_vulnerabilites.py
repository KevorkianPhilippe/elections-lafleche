#!/usr/bin/env python3
"""
Génère un PDF autonome avec les sections 5.2, 5.3 et 5.4
de la note de projection T2 — Vulnérabilités électorales.
Format élégant pour envoi par email.
"""

import os
import sys
from datetime import datetime

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, Flowable
)

# ── Couleurs ──
DARK_NAVY = HexColor('#1B2A4A')
BLUE_ACCENT = HexColor('#2196F3')
RED = HexColor('#E53935')
RED_LIGHT = HexColor('#FFEBEE')
ORANGE = HexColor('#FF9800')
GREEN = HexColor('#43A047')
GREY_DARK = HexColor('#333333')
GREY_LIGHT = HexColor('#E0E0E0')
GREY_BG = HexColor('#F5F5F5')
WHITE = white

# ── Dimensions ──
PAGE_W, PAGE_H = A4
MARGIN = 15 * mm


class ColorBar(Flowable):
    """Barre horizontale colorée."""
    def __init__(self, width, height, color):
        super().__init__()
        self.width = width
        self.height = height
        self.color = color

    def draw(self):
        self.canv.setFillColor(self.color)
        self.canv.rect(0, 0, self.width, self.height, fill=1, stroke=0)


def header_footer(canvas, doc):
    """En-tête et pied de page."""
    canvas.saveState()
    w, h = A4

    # En-tête
    canvas.setFont('Helvetica', 7)
    canvas.setFillColor(GREY_DARK)
    canvas.drawString(MARGIN, h - 10 * mm,
                      "ÉLECTIONS MUNICIPALES LA FLÈCHE 2026")
    canvas.drawRightString(w - MARGIN, h - 10 * mm,
                           "EXTRAIT — ANALYSE DES VULNÉRABILITÉS")

    # Ligne bleue sous en-tête
    canvas.setStrokeColor(BLUE_ACCENT)
    canvas.setLineWidth(1.5)
    canvas.line(MARGIN, h - 12 * mm, w - MARGIN, h - 12 * mm)

    # Pied de page
    canvas.setFont('Helvetica', 7)
    canvas.setFillColor(GREY_DARK)
    canvas.drawString(MARGIN, 8 * mm,
                      "Méthodologie : inférence écologique (17 BV × 4 scrutins) • "
                      "simulation stochastique (50 000 tirages) • matrices de Dirichlet")
    canvas.drawRightString(w - MARGIN, 8 * mm,
                           f"Page {doc.page}")

    canvas.restoreState()


def build_pdf():
    output_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'output')
    output_path = os.path.join(output_dir, 'extrait_vulnerabilites_electorales.pdf')

    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=MARGIN,
        rightMargin=MARGIN,
        topMargin=18 * mm,
        bottomMargin=15 * mm,
    )

    page_w = PAGE_W - 2 * MARGIN

    # ── Styles ──
    styles = {
        'title': ParagraphStyle(
            'Title', fontName='Helvetica-Bold', fontSize=18,
            textColor=DARK_NAVY, spaceAfter=2 * mm, leading=22,
        ),
        'subtitle': ParagraphStyle(
            'Subtitle', fontName='Helvetica', fontSize=11,
            textColor=BLUE_ACCENT, spaceAfter=6 * mm, leading=14,
        ),
        'h1': ParagraphStyle(
            'H1', fontName='Helvetica-Bold', fontSize=14,
            textColor=DARK_NAVY, spaceBefore=6 * mm, spaceAfter=4 * mm,
            leading=18,
        ),
        'h2': ParagraphStyle(
            'H2', fontName='Helvetica-Bold', fontSize=11,
            textColor=DARK_NAVY, spaceBefore=5 * mm, spaceAfter=3 * mm,
            leading=14,
        ),
        'body': ParagraphStyle(
            'Body', fontName='Helvetica', fontSize=9,
            textColor=GREY_DARK, spaceBefore=2 * mm, spaceAfter=2 * mm,
            leading=13, alignment=TA_JUSTIFY,
        ),
        'caption': ParagraphStyle(
            'Caption', fontName='Helvetica-Oblique', fontSize=7.5,
            textColor=GREY_DARK, alignment=TA_CENTER, spaceAfter=3 * mm,
        ),
    }

    story = []

    # ══════════════════════════════════════════════
    # TITRE
    # ══════════════════════════════════════════════

    story.append(ColorBar(page_w, 3 * mm, DARK_NAVY))
    story.append(Spacer(1, 1 * mm))
    story.append(ColorBar(page_w, 1 * mm, BLUE_ACCENT))
    story.append(Spacer(1, 5 * mm))

    story.append(Paragraph("Analyse des vulnérabilités électorales", styles['title']))
    story.append(Paragraph(
        "Extrait de la note de projection T2 — Élections municipales La Flèche 2026<br/>"
        "Publication : 21 mars 2026 (J-1) — Scrutin : 22 mars 2026",
        styles['subtitle']))

    # Encadré contexte
    ctx_text = (
        "<b>Contexte</b> : notre modèle projette une victoire de Romain Lemoigne avec une marge "
        "d'environ <b>250 voix</b> (3,8 points sur ~6 500 exprimés). Cette marge, bien que robuste "
        "statistiquement, n'est pas hors de portée d'irrégularités électorales. Dans un contexte où "
        "la majorité sortante organise les opérations de vote (locaux, listes, procurations) "
        "depuis <b>plus de 80 ans</b>, une analyse de vulnérabilité s'impose."
    )
    ctx_data = [[Paragraph(ctx_text,
        ParagraphStyle('', fontSize=9.5, textColor=GREY_DARK, leading=14))]]
    ctx_table = Table(ctx_data, colWidths=[page_w])
    ctx_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), HexColor('#FFF3E0')),
        ('ROUNDEDCORNERS', [4, 4, 4, 4]),
        ('TOPPADDING', (0, 0), (-1, -1), 4 * mm),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4 * mm),
        ('LEFTPADDING', (0, 0), (-1, -1), 5 * mm),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5 * mm),
        ('BOX', (0, 0), (-1, -1), 1, ORANGE),
    ]))
    story.append(ctx_table)
    story.append(Spacer(1, 5 * mm))

    # ══════════════════════════════════════════════
    # 5.2 VECTEURS DE RISQUE
    # ══════════════════════════════════════════════

    story.append(Paragraph("Vecteurs de risque et chiffrage d'impact", styles['h1']))

    fraud_header_style = ParagraphStyle('', fontSize=7.5, textColor=WHITE,
                                        fontName='Helvetica-Bold', alignment=TA_CENTER)
    fraud_cell = ParagraphStyle('', fontSize=7.5, textColor=GREY_DARK,
                                 leading=10, alignment=TA_LEFT)
    fraud_cell_c = ParagraphStyle('', fontSize=7.5, textColor=GREY_DARK,
                                   leading=10, alignment=TA_CENTER)

    fraud_data = [
        [Paragraph('<b>Vecteur</b>', fraud_header_style),
         Paragraph('<b>Mécanisme</b>', fraud_header_style),
         Paragraph('<b>Impact<br/>max. estimé</b>', fraud_header_style),
         Paragraph('<b>Détectabilité</b>', fraud_header_style),
         Paragraph('<b>Risque</b>', fraud_header_style)],

        [Paragraph('<b>Procurations<br/>abusives</b>',
            ParagraphStyle('', fontSize=7.5, fontName='Helvetica-Bold',
                           textColor=GREY_DARK, leading=10)),
         Paragraph("Établissement de procurations de complaisance par la mairie "
                   "(personnes âgées, EHPAD, absents non consultés). Le maire signe les attestations.",
                   fraud_cell),
         Paragraph('<b>50 à 150<br/>voix</b>', fraud_cell_c),
         Paragraph("Moyenne : vérifiable par recoupement des registres et contestation individuelle",
                   fraud_cell),
         Paragraph('<font color="#E53935"><b>ÉLEVÉ</b></font>', fraud_cell_c)],

        [Paragraph('<b>Manipulation<br/>des listes</b>',
            ParagraphStyle('', fontSize=7.5, fontName='Helvetica-Bold',
                           textColor=GREY_DARK, leading=10)),
         Paragraph("Inscriptions fictives (résidences secondaires, anciens habitants), "
                   "ou radiations ciblées d'électeurs identifiés comme pro-Lemoigne.",
                   fraud_cell),
         Paragraph('<b>30 à 80<br/>voix</b>', fraud_cell_c),
         Paragraph("Faible avant le vote, forte après (recours administratif, vérification INSEE)",
                   fraud_cell),
         Paragraph('<font color="#FF9800"><b>MODÉRÉ</b></font>', fraud_cell_c)],

        [Paragraph('<b>Dépouillement<br/>biaisé</b>',
            ParagraphStyle('', fontSize=7.5, fontName='Helvetica-Bold',
                           textColor=GREY_DARK, leading=10)),
         Paragraph("Bulletins Lemoigne déclarés nuls abusivement, erreurs de comptage orientées, "
                   "requalification de bulletins litigieux.",
                   fraud_cell),
         Paragraph('<b>20 à 60<br/>voix</b>', fraud_cell_c),
         Paragraph("Élevée si assesseurs de toutes les listes présents dans chaque bureau",
                   fraud_cell),
         Paragraph('<font color="#FF9800"><b>MODÉRÉ</b></font>', fraud_cell_c)],

        [Paragraph('<b>Bourrage<br/>d\'urnes</b>',
            ParagraphStyle('', fontSize=7.5, fontName='Helvetica-Bold',
                           textColor=GREY_DARK, leading=10)),
         Paragraph("Ajout de bulletins supplémentaires dans l'urne. Très risqué : "
                   "le nombre d'émargements doit correspondre au nombre de bulletins.",
                   fraud_cell),
         Paragraph('<b>10 à 30<br/>voix</b>', fraud_cell_c),
         Paragraph("Très élevée : écart émargements/bulletins immédiatement visible",
                   fraud_cell),
         Paragraph('<font color="#43A047"><b>FAIBLE</b></font>', fraud_cell_c)],

        [Paragraph('<b>Pression sur<br/>les électeurs</b>',
            ParagraphStyle('', fontSize=7.5, fontName='Helvetica-Bold',
                           textColor=GREY_DARK, leading=10)),
         Paragraph("Intimidation d'électeurs (employés municipaux, associations subventionnées, "
                   "commerçants dépendants de la mairie). Pression indirecte via le tissu associatif.",
                   fraud_cell),
         Paragraph('<b>30 à 100<br/>voix</b>', fraud_cell_c),
         Paragraph("Très faible : pas de trace, difficile à prouver",
                   fraud_cell),
         Paragraph('<font color="#E53935"><b>ÉLEVÉ</b></font>', fraud_cell_c)],

        [Paragraph('<b>Intimidation<br/>physique</b>',
            ParagraphStyle('', fontSize=7.5, fontName='Helvetica-Bold',
                           textColor=GREY_DARK, leading=10)),
         Paragraph("Actions violentes visant à décourager les électeurs ou les candidats adverses "
                   "(dégradation de permanences, menaces). Effet sur la mobilisation.",
                   fraud_cell),
         Paragraph('<b>20 à 80<br/>voix</b><br/><font size="6">(démobilisation)</font>',
                   fraud_cell_c),
         Paragraph("Élevée si plainte déposée, mais effet diffus sur le moral des troupes",
                   fraud_cell),
         Paragraph('<font color="#E53935"><b>ÉLEVÉ</b></font><br/>'
                   '<font size="6" color="#E53935">(avéré le 20/03)</font>',
                   fraud_cell_c)],
    ]

    fraud_table = Table(fraud_data, colWidths=[22 * mm, 52 * mm, 22 * mm, 38 * mm, 18 * mm])
    fraud_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), DARK_NAVY),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, GREY_BG]),
        ('GRID', (0, 0), (-1, -1), 0.5, GREY_LIGHT),
        ('ROUNDEDCORNERS', [3, 3, 3, 3]),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 1.5 * mm),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 1.5 * mm),
    ]))
    story.append(fraud_table)
    story.append(Spacer(1, 2 * mm))

    story.append(Paragraph(
        "<i>Les estimations d'impact sont des ordres de grandeur maximaux, "
        "fondés sur la littérature académique et la jurisprudence du Conseil d'État "
        "en matière de contentieux électoraux municipaux.</i>",
        styles['caption']))

    # ══════════════════════════════════════════════
    # 5.3 IMPACT CUMULÉ
    # ══════════════════════════════════════════════

    story.append(Paragraph("Impact cumulé et seuil de basculement", styles['h1']))

    story.append(Paragraph(
        "La marge projetée est d'environ <b>250 voix</b>. Pour inverser le résultat, "
        "il faudrait soit soustraire 125 voix à Lemoigne, soit en ajouter 125 à Grelet, "
        "soit une combinaison des deux. Le tableau ci-dessus montre que :",
        styles['body']))

    impact_items = [
        "<b>Un seul vecteur ne suffit probablement pas</b> : même le levier le plus puissant "
        "(procurations) plafonne à ~150 voix dans le scénario extrême. Il faudrait la combinaison "
        "de plusieurs vecteurs pour atteindre le seuil de 250 voix.",

        "<b>L'impact cumulé théorique maximal est de 160 à 500 voix</b> en additionnant tous "
        "les vecteurs. Mais cette addition suppose une coordination délibérée sur tous les fronts "
        "simultanément, ce qui multiplie le risque de détection.",

        "<b>Le seuil de basculement est à la limite du faisable</b> : il se situe dans la "
        "fourchette haute de l'impact cumulé. Cela signifie qu'une fraude « artisanale » "
        "(quelques procurations, quelques pressions) ne suffirait pas. Il faudrait une "
        "opération systématique, avec les risques juridiques et pénaux que cela comporte."
    ]
    for item in impact_items:
        num_style = ParagraphStyle('Num', parent=styles['body'],
            leftIndent=8 * mm, bulletIndent=0, spaceBefore=1 * mm)
        story.append(Paragraph(f"<font color='#E53935'>&#8226;</font> {item}", num_style))

    story.append(Spacer(1, 3 * mm))

    # Encadré visuel seuil
    seuil_data = [[
        Paragraph(
            '<font size="11" color="#1B2A4A"><b>Seuil de basculement : ~250 voix</b></font><br/><br/>'
            '<font size="9" color="#333333">'
            'Impact cumulé maximal tous vecteurs : <b>160 à 500 voix</b><br/>'
            'Probabilité d\'une opération coordonnée réussie : <b>faible</b><br/>'
            'Probabilité de détection en cas de tentative : <b>élevée</b> (si assesseurs présents)'
            '</font>',
            ParagraphStyle('', fontSize=9, textColor=GREY_DARK, leading=14, alignment=TA_CENTER)),
    ]]
    seuil_table = Table(seuil_data, colWidths=[page_w])
    seuil_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), RED_LIGHT),
        ('ROUNDEDCORNERS', [4, 4, 4, 4]),
        ('TOPPADDING', (0, 0), (-1, -1), 5 * mm),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5 * mm),
        ('LEFTPADDING', (0, 0), (-1, -1), 5 * mm),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5 * mm),
        ('BOX', (0, 0), (-1, -1), 1.5, RED),
    ]))
    story.append(seuil_table)

    # ══════════════════════════════════════════════
    # 5.4 RECOMMANDATIONS
    # ══════════════════════════════════════════════

    story.append(Spacer(1, 5 * mm))
    story.append(Paragraph("Recommandations de vigilance", styles['h1']))

    vigil_items = [
        ("<b>Assesseurs dans chaque bureau</b>", "la liste Lemoigne doit impérativement placer "
         "un assesseur titulaire et un suppléant dans chacun des 17 bureaux de vote. C'est la "
         "première ligne de défense contre les irrégularités au dépouillement."),

        ("<b>Délégués de liste</b>", "nommer des délégués habilités à contester les bulletins "
         "déclarés nuls et à exiger un recomptage en cas de doute."),

        ("<b>Suivi des procurations</b>", "surveiller le volume de procurations par bureau "
         "(un pic inhabituel dans certains bureaux est un signal d'alerte). Demander la "
         "communication des registres de procurations."),

        ("<b>Recours juridiques</b>", "en cas d'irrégularité constatée, consigner immédiatement "
         "au procès-verbal du bureau de vote (avec mention des témoins), et préparer un recours "
         "devant le tribunal administratif dans les 5 jours suivant la proclamation des résultats."),

        ("<b>Comptage parallèle</b>", "tenir un décompte indépendant bureau par bureau au fur "
         "et à mesure de la soirée électorale, et comparer avec les chiffres officiels."),
    ]

    for i, (title, desc) in enumerate(vigil_items):
        # Créer une mini-table pour chaque recommandation (numéro + texte)
        num_para = Paragraph(
            f'<font color="#FFFFFF"><b>{i+1}</b></font>',
            ParagraphStyle('', fontSize=10, fontName='Helvetica-Bold',
                           textColor=WHITE, alignment=TA_CENTER))
        text_para = Paragraph(
            f"{title} : {desc}",
            ParagraphStyle('', fontSize=9, textColor=GREY_DARK, leading=13))

        rec_data = [[num_para, text_para]]
        rec_table = Table(rec_data, colWidths=[10 * mm, page_w - 14 * mm])
        rec_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, 0), BLUE_ACCENT),
            ('BACKGROUND', (1, 0), (1, 0), HexColor('#E3F2FD')),
            ('ROUNDEDCORNERS', [3, 3, 3, 3]),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 2.5 * mm),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 2.5 * mm),
            ('LEFTPADDING', (0, 0), (0, 0), 2 * mm),
            ('LEFTPADDING', (1, 0), (1, 0), 4 * mm),
            ('RIGHTPADDING', (1, 0), (1, 0), 4 * mm),
        ]))
        story.append(rec_table)
        story.append(Spacer(1, 1.5 * mm))

    story.append(Spacer(1, 5 * mm))

    # ══════════════════════════════════════════════
    # SYNTHÈSE FINALE
    # ══════════════════════════════════════════════

    synth_text = (
        "<b>Synthèse du risque</b> : la probabilité d'une inversion du résultat par irrégularités "
        "est estimée <b>faible mais non négligeable</b>. Elle nécessiterait la mobilisation "
        "simultanée de plusieurs vecteurs (procurations + pression + dépouillement) pour un "
        "impact cumulé d'au moins 250 voix. Le risque est d'autant plus réel que la majorité "
        "sortante contrôle l'appareil administratif depuis 80 ans et que des actes d'intimidation "
        "physique ont déjà été constatés (attaque de la permanence Lemoigne dans la nuit du 20 mars). "
        "<br/><br/>"
        "La présence d'assesseurs dans chaque bureau et la tenue d'un comptage parallèle "
        "sont les <b>contre-mesures essentielles</b>."
    )
    synth_data = [[Paragraph(synth_text,
        ParagraphStyle('', fontSize=9.5, textColor=GREY_DARK, leading=14))]]
    synth_table = Table(synth_data, colWidths=[page_w])
    synth_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), RED_LIGHT),
        ('ROUNDEDCORNERS', [4, 4, 4, 4]),
        ('TOPPADDING', (0, 0), (-1, -1), 5 * mm),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5 * mm),
        ('LEFTPADDING', (0, 0), (-1, -1), 5 * mm),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5 * mm),
        ('BOX', (0, 0), (-1, -1), 2, RED),
    ]))
    story.append(synth_table)

    story.append(Spacer(1, 8 * mm))

    # Signature
    story.append(Paragraph(
        "<b>Auteur</b> : Philippe KEVORKIAN<br/>"
        "Membre diplômé de la Société Française des Analystes Financiers (SFAF)<br/>"
        "Ingénieur SupAéro (ISAE-SUPAERO)<br/><br/>"
        "<i>Extrait de la note de projection T2 complète (20 pages) — 21 mars 2026</i>",
        ParagraphStyle('', fontSize=8, textColor=GREY_DARK, leading=11,
                        alignment=TA_CENTER)))

    # ── Build ──
    doc.build(story, onFirstPage=header_footer, onLaterPages=header_footer)
    print(f"\n{'='*60}")
    print(f"PDF généré : {output_path}")
    print(f"{'='*60}")

    return output_path


if __name__ == '__main__':
    build_pdf()
