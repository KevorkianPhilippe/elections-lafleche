#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Fiche pratique anti-bourrage d'urne — PDF ReportLab
Elections municipales La Fleche 2026
"""
import os
import sys
import math
from datetime import datetime

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    KeepTogether, HRFlowable
)
from reportlab.platypus.flowables import Flowable

# ── COULEURS ──
DARK_NAVY = HexColor("#1B2A4A")
NAVY = HexColor("#243B5E")
BLUE_ACCENT = HexColor("#4FC3F7")
LIGHT_BLUE = HexColor("#E3F2FD")
RED = HexColor("#E53935")
RED_LIGHT = HexColor("#FFEBEE")
GREEN = HexColor("#43A047")
GREEN_LIGHT = HexColor("#E8F5E9")
ORANGE = HexColor("#FF9800")
ORANGE_LIGHT = HexColor("#FFF3E0")
GREY_DARK = HexColor("#37474F")
GREY_MED = HexColor("#607D8B")
GREY_LIGHT = HexColor("#ECEFF1")
GREY_BG = HexColor("#F5F7FA")
WHITE = HexColor("#FFFFFF")
AMBER = HexColor("#FFC107")
AMBER_LIGHT = HexColor("#FFF8E1")

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "output")


# ── STYLES ──
def make_styles():
    s = {}
    s['title'] = ParagraphStyle(
        'Title', fontName='Helvetica-Bold', fontSize=20,
        textColor=DARK_NAVY, leading=26, alignment=TA_LEFT,
        spaceAfter=2*mm
    )
    s['subtitle'] = ParagraphStyle(
        'Subtitle', fontName='Helvetica', fontSize=10,
        textColor=GREY_MED, leading=14, alignment=TA_LEFT,
        spaceAfter=6*mm
    )
    s['h1'] = ParagraphStyle(
        'H1', fontName='Helvetica-Bold', fontSize=14,
        textColor=DARK_NAVY, leading=20, spaceBefore=7*mm,
        spaceAfter=4*mm
    )
    s['h2'] = ParagraphStyle(
        'H2', fontName='Helvetica-Bold', fontSize=11,
        textColor=NAVY, leading=15, spaceBefore=5*mm,
        spaceAfter=3*mm
    )
    s['h3'] = ParagraphStyle(
        'H3', fontName='Helvetica-Bold', fontSize=9.5,
        textColor=GREY_DARK, leading=13, spaceBefore=3*mm,
        spaceAfter=2*mm
    )
    s['body'] = ParagraphStyle(
        'Body', fontName='Helvetica', fontSize=9,
        textColor=GREY_DARK, leading=13, alignment=TA_JUSTIFY,
        spaceAfter=2.5*mm
    )
    s['body_bold'] = ParagraphStyle(
        'BodyBold', fontName='Helvetica-Bold', fontSize=9,
        textColor=GREY_DARK, leading=13, alignment=TA_JUSTIFY,
        spaceAfter=2.5*mm
    )
    s['bullet'] = ParagraphStyle(
        'Bullet', fontName='Helvetica', fontSize=9,
        textColor=GREY_DARK, leading=13, alignment=TA_LEFT,
        leftIndent=8*mm, bulletIndent=3*mm, spaceAfter=1.5*mm
    )
    s['bullet_bold'] = ParagraphStyle(
        'BulletBold', fontName='Helvetica-Bold', fontSize=9,
        textColor=GREY_DARK, leading=13, alignment=TA_LEFT,
        leftIndent=8*mm, bulletIndent=3*mm, spaceAfter=1.5*mm
    )
    s['small'] = ParagraphStyle(
        'Small', fontName='Helvetica', fontSize=7.5,
        textColor=GREY_MED, leading=10, alignment=TA_LEFT,
        spaceAfter=2*mm
    )
    s['footer'] = ParagraphStyle(
        'Footer', fontName='Helvetica', fontSize=7,
        textColor=GREY_MED, leading=10
    )
    s['alert_text'] = ParagraphStyle(
        'AlertText', fontName='Helvetica-Bold', fontSize=9,
        textColor=RED, leading=13, alignment=TA_LEFT,
        spaceAfter=2*mm
    )
    s['success_text'] = ParagraphStyle(
        'SuccessText', fontName='Helvetica-Bold', fontSize=9,
        textColor=GREEN, leading=13, alignment=TA_LEFT,
        spaceAfter=2*mm
    )
    s['memento'] = ParagraphStyle(
        'Memento', fontName='Courier', fontSize=8.5,
        textColor=DARK_NAVY, leading=13, alignment=TA_LEFT,
        spaceAfter=1.5*mm
    )
    return s


# ── ELEMENTS GRAPHIQUES ──

class ColorBar(Flowable):
    """Barre coloree horizontale (separateur)"""
    def __init__(self, width, height=1.5*mm, color=BLUE_ACCENT):
        super().__init__()
        self.width = width
        self.height = height
        self.color = color

    def draw(self):
        self.canv.setFillColor(self.color)
        self.canv.roundRect(0, 0, self.width, self.height, 0.5*mm, fill=1, stroke=0)


class AlertBox(Flowable):
    """Boite d'alerte coloree avec texte"""
    def __init__(self, text, width=170*mm, bg_color=RED_LIGHT, border_color=RED,
                 text_color=GREY_DARK, font='Helvetica', fontsize=9):
        super().__init__()
        self.text = text
        self.w = width
        self.bg_color = bg_color
        self.border_color = border_color
        self.text_color = text_color
        self.font = font
        self.fontsize = fontsize
        # Calculer la hauteur necessaire
        lines = text.split('\n')
        self.h = max(len(lines) * (fontsize + 4) + 8*mm, 14*mm)

    def draw(self):
        c = self.canv
        c.setFillColor(self.bg_color)
        c.roundRect(0, 0, self.w, self.h, 2*mm, fill=1, stroke=0)
        c.setFillColor(self.border_color)
        c.roundRect(0, 0, 1.5*mm, self.h, 0.75*mm, fill=1, stroke=0)
        c.setFont(self.font, self.fontsize)
        c.setFillColor(self.text_color)
        lines = self.text.split('\n')
        y = self.h - 5*mm
        for line in lines:
            c.drawString(5*mm, y, line)
            y -= (self.fontsize + 4)


class NumberedStep(Flowable):
    """Etape numerotee avec cercle colore"""
    def __init__(self, number, text, width=170*mm, color=DARK_NAVY):
        super().__init__()
        self.number = str(number)
        self.text = text
        self.w = width
        self.color = color
        # Calculer hauteur selon longueur texte
        font_size = 9
        max_text_w = width - 12*mm
        # Estimation nombre de lignes
        approx_char_w = font_size * 0.5
        chars_per_line = max_text_w / approx_char_w
        n_lines = max(1, math.ceil(len(text) / chars_per_line))
        self.h = max(10*mm, n_lines * (font_size + 3) + 4*mm)

    def draw(self):
        c = self.canv
        # Cercle numerote
        cx, cy_circle = 4*mm, self.h - 5.5*mm
        c.setFillColor(self.color)
        c.circle(cx, cy_circle, 3.5*mm, fill=1, stroke=0)
        c.setFont('Helvetica-Bold', 9)
        c.setFillColor(WHITE)
        c.drawCentredString(cx, cy_circle - 2.5, self.number)
        # Texte (multi-ligne si besoin)
        c.setFont('Helvetica', 9)
        c.setFillColor(GREY_DARK)
        text_x = 10*mm
        max_text_w = self.w - 12*mm
        # Decoupage mot par mot
        words = self.text.split()
        lines = []
        current = ""
        for w in words:
            test = current + (" " if current else "") + w
            if c.stringWidth(test, 'Helvetica', 9) <= max_text_w:
                current = test
            else:
                if current:
                    lines.append(current)
                current = w
        if current:
            lines.append(current)
        y = self.h - 6*mm
        for line in lines:
            c.drawString(text_x, y, line)
            y -= 12


def draw_header(c, doc):
    """En-tete de page"""
    w, h = A4
    # Bande navy en haut
    c.setFillColor(DARK_NAVY)
    c.rect(0, h - 12*mm, w, 12*mm, fill=1, stroke=0)
    # Drapeau
    flag_x, flag_y = 15*mm, h - 9*mm
    third = 4*mm / 3
    c.setFillColor(HexColor("#002395"))
    c.rect(flag_x, flag_y, third, 2.8*mm, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.rect(flag_x + third, flag_y, third, 2.8*mm, fill=1, stroke=0)
    c.setFillColor(HexColor("#ED2939"))
    c.rect(flag_x + 2*third, flag_y, third, 2.8*mm, fill=1, stroke=0)
    # Titre header
    c.setFont('Helvetica-Bold', 8)
    c.setFillColor(WHITE)
    c.drawString(flag_x + 6*mm, h - 8.5*mm, "FICHE PRATIQUE — INTEGRITE DU SCRUTIN")
    c.setFont('Helvetica', 7)
    c.setFillColor(BLUE_ACCENT)
    c.drawRightString(w - 15*mm, h - 8.5*mm, "Elections municipales — La Fleche 2026")
    # Ligne bleue sous header
    c.setFillColor(BLUE_ACCENT)
    c.rect(0, h - 13*mm, w, 1*mm, fill=1, stroke=0)


def draw_footer(c, doc):
    """Pied de page"""
    w, h = A4
    c.setFont('Helvetica', 6.5)
    c.setFillColor(GREY_MED)
    c.drawString(15*mm, 8*mm,
        f"Fiche anti-bourrage — Code electoral (Legifrance) — {datetime.now().strftime('%d/%m/%Y')}")
    c.drawRightString(w - 15*mm, 8*mm, f"Page {doc.page}")


def on_page(c, doc):
    draw_header(c, doc)
    draw_footer(c, doc)


# ── CONSTRUCTION DU PDF ──

def build_pdf():
    output_path = os.path.join(OUTPUT_DIR, "fiche_anti_bourrage_urne.pdf")
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    doc = SimpleDocTemplate(
        output_path, pagesize=A4,
        leftMargin=15*mm, rightMargin=15*mm,
        topMargin=20*mm, bottomMargin=15*mm
    )
    s = make_styles()
    W = doc.width
    story = []

    # ═══════════════════════════════════════════════
    # TITRE
    # ═══════════════════════════════════════════════
    story.append(Spacer(1, 2*mm))
    story.append(Paragraph(
        "Prevenir le bourrage d'urne<br/>par emargements fictifs", s['title']))
    story.append(Paragraph(
        "Fiche pratique a destination des <b>assesseurs</b> et <b>delegues de candidats</b>",
        s['subtitle']))
    story.append(ColorBar(W, 2*mm, BLUE_ACCENT))
    story.append(Spacer(1, 4*mm))

    # ═══════════════════════════════════════════════
    # 1. LA TECHNIQUE DE FRAUDE
    # ═══════════════════════════════════════════════
    story.append(Paragraph("1. La technique de fraude", s['h1']))
    story.append(ColorBar(30*mm, 1*mm, RED))
    story.append(Spacer(1, 2*mm))

    story.append(Paragraph(
        "Le bourrage d'urne par emargement fictif consiste a :", s['body']))

    steps_fraude = [
        ("1", "Reperer sur la liste d'emargement un electeur inscrit mais absent"),
        ("2", "Imiter sa signature sur la liste d'emargement"),
        ("3", "Glisser un bulletin supplementaire dans l'urne"),
    ]
    for num, txt in steps_fraude:
        story.append(NumberedStep(num, txt, W, RED))

    story.append(Spacer(1, 2*mm))
    story.append(AlertBox(
        "Le nombre de bulletins correspond au nombre de signatures :\n"
        "la fraude est indetectable au depouillement si le compteur\n"
        "de l'urne n'est pas controle independamment.",
        W, RED_LIGHT, RED, GREY_DARK, 'Helvetica-Bold', 9
    ))
    story.append(Spacer(1, 2*mm))
    story.append(Paragraph(
        "Elle necessite un moment d'inattention des autres membres du bureau "
        "(registre non surveille, urne accessible sans temoin).", s['body']))

    # ═══════════════════════════════════════════════
    # 2. LA PARADE
    # ═══════════════════════════════════════════════
    story.append(Paragraph("2. La parade : controle compteur / emargements", s['h1']))
    story.append(ColorBar(30*mm, 1*mm, GREEN))
    story.append(Spacer(1, 2*mm))

    story.append(AlertBox(
        "PRINCIPE : Relever simultanement et a l'improviste, 2 a 3 fois\n"
        "dans la journee, le compteur de l'urne ET le nombre de signatures\n"
        "sur la liste d'emargement. S'ils concordent : RAS.",
        W, GREEN_LIGHT, GREEN, GREY_DARK, 'Helvetica-Bold', 9
    ))
    story.append(Spacer(1, 3*mm))

    # Mode operatoire — tableau
    story.append(Paragraph("Mode operatoire", s['h2']))

    steps_data = [
        ["Etape", "Action"],
        ["1", "Choisir un moment calme (eviter ouverture, midi, 17h-18h)"],
        ["2", "Sans prevenir, relever le chiffre du compteur de l'urne"],
        ["3", "Compter les signatures sur la liste d'emargement (seul ou a deux)"],
        ["4", "Noter l'heure, le chiffre du compteur et le nombre de signatures"],
        ["5", "Comparer les deux chiffres"],
    ]
    t = Table(steps_data, colWidths=[15*mm, W - 15*mm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), DARK_NAVY),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8.5),
        ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),
        ('BACKGROUND', (0, 1), (-1, -1), GREY_BG),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [GREY_BG, WHITE]),
        ('ALIGN', (0, 0), (0, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.3, GREY_LIGHT),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (1, 0), (1, -1), 3*mm),
    ]))
    story.append(t)
    story.append(Spacer(1, 3*mm))

    # Frequence
    story.append(Paragraph("Frequence recommandee", s['h2']))
    story.append(Paragraph(
        "<bullet>&bull;</bullet> <b>3 controles minimum</b> : ~10h30, ~14h30, ~17h00",
        s['bullet']))
    story.append(Paragraph(
        "<bullet>&bull;</bullet> Le simple fait que ces controles soient <b>connus</b> "
        "des membres du bureau suffit a dissuader la fraude", s['bullet']))

    # En cas d'ecart
    story.append(Spacer(1, 2*mm))
    story.append(Paragraph("En cas d'ecart constate", s['h2']))

    ecart_steps = [
        ("1", "Informer le president calmement et factuellement"),
        ("2", "Demander une explication (erreur de comptage, compteur defaillant...)"),
        ("3", "S'il minimise : annoncer la consignation au PV (droit absolu, art. L.67)"),
        ("4", 'Rediger : "A [heure], compteur = [X], signatures = [Y]. Ecart = [N]."'),
    ]
    for num, txt in ecart_steps:
        story.append(NumberedStep(num, txt, W, ORANGE))

    story.append(Spacer(1, 2*mm))
    story.append(AlertBox(
        "L'inscription au PV rend la fraude juridiquement exploitable\n"
        "en cas de contentieux devant le tribunal administratif.",
        W, ORANGE_LIGHT, ORANGE, GREY_DARK, 'Helvetica-Bold', 9
    ))

    # ═══════════════════════════════════════════════
    # 3. QUI PEUT EFFECTUER CE CONTROLE ?
    # ═══════════════════════════════════════════════
    story.append(Paragraph("3. Qui peut effectuer ce controle ?", s['h1']))
    story.append(ColorBar(30*mm, 1*mm, BLUE_ACCENT))
    story.append(Spacer(1, 2*mm))

    story.append(Paragraph(
        "Assesseurs ET delegues : memes droits, positions differentes", s['h2']))

    comp_data = [
        ["", "Assesseur", "Delegue"],
        ["Statut", "Membre du bureau de vote", "Observateur habilite"],
        ["Acces emargement", "Permanent (tient la liste)", "Consultation sur place"],
        ["Cle de l'urne", "Peut detenir 1 des 2 cles", "Non"],
        ["Droit de controle", "Plein (co-responsable)", "Plein (art. L.67, R.47)"],
        ["Inscription au PV", "Oui", "Oui (art. L.67)"],
        ["Signe le PV", "Obligatoire", "Peut signer"],
    ]
    t2 = Table(comp_data, colWidths=[35*mm, (W-35*mm)/2, (W-35*mm)/2])
    t2.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), DARK_NAVY),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),
        ('BACKGROUND', (1, 1), (1, -1), LIGHT_BLUE),
        ('BACKGROUND', (2, 1), (2, -1), GREY_BG),
        ('BACKGROUND', (0, 1), (0, -1), WHITE),
        ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.3, GREY_LIGHT),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    story.append(t2)
    story.append(Spacer(1, 3*mm))

    story.append(AlertBox(
        "L'assesseur est le mieux place : il siege a la table, a la liste\n"
        "sous les yeux, et est co-garant de la sincerite du scrutin.\n"
        "Le president a encore moins de motifs de s'opposer a un controle\n"
        "realise par un membre de son propre bureau.",
        W, LIGHT_BLUE, BLUE_ACCENT, GREY_DARK, 'Helvetica', 9
    ))

    # ═══════════════════════════════════════════════
    # 4. CADRE JURIDIQUE
    # ═══════════════════════════════════════════════
    story.append(Paragraph("4. Cadre juridique", s['h1']))
    story.append(ColorBar(30*mm, 1*mm, DARK_NAVY))
    story.append(Spacer(1, 2*mm))

    story.append(Paragraph("Vos droits (assesseurs et delegues)", s['h2']))

    loi_data = [
        ["Article", "Contenu"],
        ["Art. L.62-1", "La liste d'emargement reste sur la table pendant toute la duree des operations"],
        ["Art. L.63", "Urne transparente, compteur mecanique. Une des 2 cles revient a un assesseur"],
        ["Art. L.65", "Toute divergence emargements / bulletins = mention obligatoire au PV"],
        ["Art. L.67,\nR.46, R.47", "Assesseurs et delegues controlent toutes les operations et peuvent exiger l'inscription au PV"],
        ["Art. R.49", "Le president ne peut pas empecher un delegue/assesseur d'exercer ses prerogatives"],
    ]
    t3 = Table(loi_data, colWidths=[22*mm, W - 22*mm])
    t3.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), DARK_NAVY),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),
        ('TEXTCOLOR', (0, 1), (0, -1), NAVY),
        ('BACKGROUND', (0, 1), (-1, -1), WHITE),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, GREY_BG]),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.3, GREY_LIGHT),
        ('TOPPADDING', (0, 0), (-1, -1), 2.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2.5),
        ('LEFTPADDING', (1, 0), (1, -1), 3*mm),
    ]))
    story.append(t3)
    story.append(Spacer(1, 4*mm))

    # Question juridique — tout le bloc dans un KeepTogether pour eviter le split
    question_box = AlertBox(
        "Le president du bureau de vote peut-il s'opposer\n"
        "au comptage des signatures du registre d'emargement ?",
        W, LIGHT_BLUE, DARK_NAVY, DARK_NAVY, 'Helvetica-Bold', 11
    )
    reponse_box = AlertBox(
        "NON — ni pour un assesseur, ni pour un delegue.",
        W, GREEN_LIGHT, GREEN, GREEN, 'Helvetica-Bold', 11
    )

    raisons_paragraphs = []
    raisons = [
        ("<b>Droit general de controle</b> : l'assesseur est co-responsable de la regularite ; "
         "le delegue controle toutes les operations (art. L.67, R.47)."),
        ("<b>Interdiction d'empecher le controle</b> (art. R.49) : la requisition du president "
         "ne peut empecher un delegue d'exercer ses prerogatives. A fortiori pour un assesseur."),
        ("<b>Argument pratique imparable</b> : le comptage des signatures est deja realise en cours "
         "de journee par le bureau lui-meme pour transmettre la participation a la prefecture (12h et 17h)."),
    ]
    for i, r in enumerate(raisons, 1):
        raisons_paragraphs.append(Paragraph(f"<bullet>{i}.</bullet> {r}", s['bullet']))

    refus_paragraph = Paragraph(
        "En cas de refus du president, <b>faites inscrire ce refus au PV</b> — "
        "cela constitue en soi une irregularite exploitable en contentieux.", s['body_bold'])

    story.append(KeepTogether([
        question_box,
        Spacer(1, 1.5*mm),
        reponse_box,
        Spacer(1, 2*mm),
    ] + raisons_paragraphs + [
        Spacer(1, 2*mm),
        refus_paragraph,
    ]))

    # ═══════════════════════════════════════════════
    # 5. CONDITIONS PRATIQUES
    # ═══════════════════════════════════════════════
    story.append(Paragraph("5. Conditions pratiques", s['h1']))
    story.append(ColorBar(30*mm, 1*mm, AMBER))
    story.append(Spacer(1, 2*mm))

    story.append(Paragraph("Prerequis", s['h2']))
    story.append(Paragraph(
        "<bullet>&bull;</bullet> <b>Verifier que le compteur fonctionne</b> des l'ouverture (8h). "
        "S'il ne marche pas, le signaler et le faire consigner au PV.", s['bullet']))
    story.append(Paragraph(
        "<bullet>&bull;</bullet> <b>Une seule personne suffit</b> pour effectuer le controle. "
        "A deux c'est plus rapide (un releve le compteur, l'autre compte les signatures) "
        "mais ce n'est pas obligatoire.", s['bullet']))

    story.append(Paragraph("Precautions", s['h2']))
    precautions = [
        "Ne pas bloquer le bureau : proceder pendant les creux d'affluence",
        "Rester factuel et courtois : vous exercez un droit, pas une accusation",
        "Ne jamais deplacer la liste d'emargement — compter sur place",
        "Noter systematiquement heure + compteur + signatures sur un carnet",
    ]
    for p in precautions:
        story.append(Paragraph(f"<bullet>&bull;</bullet> {p}", s['bullet']))

    story.append(Paragraph("Effet dissuasif", s['h2']))
    story.append(Paragraph(
        "Meme sans ecart, le fait de realiser ces controles a un <b>puissant effet dissuasif</b> : "
        "le tricheur sait que chaque bulletin frauduleux cree un ecart detectable. "
        "Il devrait repeter la fraude de nombreuses fois pour peser sur le resultat, "
        "ce qui multiplie le risque de detection.", s['body']))

    # ═══════════════════════════════════════════════
    # 6. MEMENTO DE POCHE
    # ═══════════════════════════════════════════════
    story.append(Spacer(1, 2*mm))
    story.append(Paragraph("Memento de poche", s['h1']))
    story.append(ColorBar(W, 1.5*mm, DARK_NAVY))
    story.append(Spacer(1, 2*mm))

    # Titre du memento comme Paragraph
    memento_title = Paragraph(
        '<font color="#FFFFFF"><b>CONTROLE ANTI-BOURRAGE — A remplir 3 fois dans la journee</b></font>',
        ParagraphStyle('MementoTitle', fontName='Helvetica-Bold', fontSize=9,
                       textColor=WHITE, leading=13, alignment=TA_CENTER,
                       backColor=DARK_NAVY, spaceBefore=0, spaceAfter=0,
                       borderPadding=(2*mm, 2*mm, 2*mm, 2*mm))
    )

    # Tableau simplifie sans SPAN — juste header + 3 lignes
    memento_rows = [
        ["Horaire", "Compteur urne", "Signatures", "Ecart"],
        ["~10h30", "............", "............", "............"],
        ["~14h30", "............", "............", "............"],
        ["~17h00", "............", "............", "............"],
    ]
    t4 = Table(memento_rows, colWidths=[W/4]*4)
    t4.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), GREY_LIGHT),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOX', (0, 0), (-1, -1), 1, DARK_NAVY),
        ('GRID', (0, 0), (-1, -1), 0.5, GREY_MED),
        ('TOPPADDING', (0, 0), (-1, -1), 3*mm),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3*mm),
        ('BACKGROUND', (0, 1), (-1, -1), WHITE),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, GREY_BG]),
    ]))

    # Rappel sous le tableau
    rappel_lines = [
        Paragraph("<b>Si ecart :</b> informer le president + consigner au PV", s['body']),
        Paragraph("<b>Droit :</b> assesseurs ET delegues", s['body']),
        Paragraph("<b>Textes :</b> art. L.62-1, L.63, L.65, L.67, R.46, R.47, R.49", s['body']),
    ]

    # Tout dans un KeepTogether
    story.append(KeepTogether([
        memento_title,
        t4,
        Spacer(1, 3*mm),
    ] + rappel_lines))

    # ═══════════════════════════════════════════════
    # FOOTER LEGAL
    # ═══════════════════════════════════════════════
    story.append(Spacer(1, 6*mm))
    story.append(HRFlowable(width=W, thickness=0.5, color=GREY_LIGHT))
    story.append(Spacer(1, 2*mm))
    story.append(Paragraph(
        f"Fiche etablie a partir du Code electoral (Legifrance) — "
        f"{datetime.now().strftime('%d/%m/%Y')} — Elections municipales La Fleche 2026",
        s['small']))

    # ── BUILD ──
    doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
    print(f"PDF genere : {output_path}")
    return output_path


if __name__ == "__main__":
    build_pdf()
