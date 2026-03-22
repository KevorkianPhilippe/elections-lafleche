#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Note de synthèse T2 — Élections municipales La Flèche 2026
Format institut de sondage (IFOP/OpinionWay)
Simulation : 50 000 tirages
"""
import os
import sys
import math
from datetime import datetime

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.lib.colors import HexColor, white, black, Color
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether, HRFlowable, Image
)
from reportlab.pdfgen import canvas
from reportlab.graphics.shapes import Drawing, Rect, String, Line, Circle, Wedge
from reportlab.graphics import renderPDF
from reportlab.platypus.flowables import Flowable

# ── COULEURS ──
DARK_NAVY = HexColor("#1B2A4A")
NAVY = HexColor("#243B5E")
BLUE_ACCENT = HexColor("#4FC3F7")
LIGHT_BLUE = HexColor("#E3F2FD")
SOFT_BLUE = HexColor("#B3E5FC")
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

# Couleurs candidats
COL_LEMOIGNE = HexColor("#1565C0")  # Bleu foncé (RN)
COL_GRELET = HexColor("#C62828")    # Rouge (PS)
COL_DASILVA = HexColor("#F9A825")   # Jaune/Or (DVD)

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "output")

NB_TIRAGES = 50_000
NB_TIRAGES_TXT = "50 000"

# ── STYLES ──
def make_styles():
    s = {}
    s['title'] = ParagraphStyle(
        'Title', fontName='Helvetica-Bold', fontSize=22,
        textColor=DARK_NAVY, leading=28, alignment=TA_LEFT,
        spaceAfter=4*mm
    )
    s['subtitle'] = ParagraphStyle(
        'Subtitle', fontName='Helvetica', fontSize=11,
        textColor=GREY_MED, leading=15, alignment=TA_LEFT,
        spaceAfter=8*mm
    )
    s['h1'] = ParagraphStyle(
        'H1', fontName='Helvetica-Bold', fontSize=16,
        textColor=DARK_NAVY, leading=22, spaceBefore=10*mm,
        spaceAfter=5*mm, borderPadding=(0, 0, 2*mm, 0)
    )
    s['h2'] = ParagraphStyle(
        'H2', fontName='Helvetica-Bold', fontSize=12,
        textColor=NAVY, leading=16, spaceBefore=6*mm,
        spaceAfter=3*mm
    )
    s['h3'] = ParagraphStyle(
        'H3', fontName='Helvetica-Bold', fontSize=10,
        textColor=GREY_DARK, leading=14, spaceBefore=4*mm,
        spaceAfter=2*mm
    )
    s['body'] = ParagraphStyle(
        'Body', fontName='Helvetica', fontSize=9.5,
        textColor=GREY_DARK, leading=14, alignment=TA_JUSTIFY,
        spaceAfter=3*mm
    )
    s['body_bold'] = ParagraphStyle(
        'BodyBold', fontName='Helvetica-Bold', fontSize=9.5,
        textColor=GREY_DARK, leading=14, alignment=TA_JUSTIFY,
        spaceAfter=3*mm
    )
    s['small'] = ParagraphStyle(
        'Small', fontName='Helvetica', fontSize=8,
        textColor=GREY_MED, leading=11, alignment=TA_LEFT,
        spaceAfter=2*mm
    )
    s['caption'] = ParagraphStyle(
        'Caption', fontName='Helvetica-Oblique', fontSize=8,
        textColor=GREY_MED, leading=11, alignment=TA_CENTER,
        spaceAfter=4*mm
    )
    s['quote'] = ParagraphStyle(
        'Quote', fontName='Helvetica-Oblique', fontSize=9,
        textColor=GREY_DARK, leading=13, alignment=TA_LEFT,
        leftIndent=10*mm, rightIndent=5*mm, spaceAfter=3*mm,
        borderPadding=(2*mm, 2*mm, 2*mm, 2*mm)
    )
    s['big_number'] = ParagraphStyle(
        'BigNumber', fontName='Helvetica-Bold', fontSize=36,
        textColor=DARK_NAVY, leading=42, alignment=TA_CENTER
    )
    s['big_label'] = ParagraphStyle(
        'BigLabel', fontName='Helvetica', fontSize=10,
        textColor=GREY_MED, leading=14, alignment=TA_CENTER,
        spaceAfter=4*mm
    )
    s['footer'] = ParagraphStyle(
        'Footer', fontName='Helvetica', fontSize=7,
        textColor=GREY_MED, leading=10
    )
    return s


# ── ÉLÉMENTS GRAPHIQUES PERSONNALISÉS ──

def draw_french_flag(c, x, y, w=4*mm, h=2.8*mm):
    """Dessine un mini drapeau français (bleu-blanc-rouge) sur le canevas."""
    third = w / 3
    c.setFillColor(HexColor("#002395"))
    c.rect(x, y, third, h, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.rect(x + third, y, third, h, fill=1, stroke=0)
    c.setFillColor(HexColor("#ED2939"))
    c.rect(x + 2 * third, y, third, h, fill=1, stroke=0)
    # Fin contour
    c.setStrokeColor(HexColor("#455A64"))
    c.setLineWidth(0.3)
    c.rect(x, y, w, h, fill=0, stroke=1)


class ColorBar(Flowable):
    """Barre colorée horizontale (séparateur de section)"""
    def __init__(self, width, height=1.5*mm, color=BLUE_ACCENT):
        super().__init__()
        self.width = width
        self.height = height
        self.color = color

    def draw(self):
        self.canv.setFillColor(self.color)
        self.canv.roundRect(0, 0, self.width, self.height, 0.5*mm, fill=1, stroke=0)


class BigStatBox(Flowable):
    """Boîte de statistique majeure (chiffre + libellé)"""
    def __init__(self, value, label, color=DARK_NAVY, width=50*mm, height=35*mm):
        super().__init__()
        self.value = value
        self.label = label
        self.color = color
        self.width = width
        self.height = height

    def draw(self):
        c = self.canv
        c.setFillColor(GREY_BG)
        c.roundRect(0, 0, self.width, self.height, 3*mm, fill=1, stroke=0)
        c.setFillColor(self.color)
        c.roundRect(0, self.height - 2*mm, self.width, 2*mm, 1*mm, fill=1, stroke=0)
        c.setFont('Helvetica-Bold', 24)
        c.setFillColor(self.color)
        c.drawCentredString(self.width/2, self.height/2 - 2*mm, self.value)
        c.setFont('Helvetica', 8)
        c.setFillColor(GREY_MED)
        c.drawCentredString(self.width/2, 4*mm, self.label)


class HorizontalBar(Flowable):
    """Barre horizontale pour résultats (type barre de sondage)"""
    def __init__(self, data, width=170*mm, bar_height=10*mm, spacing=3*mm):
        """data = [(libellé, pct, couleur, ic_bas, ic_haut), ...]"""
        super().__init__()
        self.data = data
        self.width = width
        self.bar_height = bar_height
        self.spacing = spacing
        self.height = len(data) * (bar_height + spacing) + spacing

    def draw(self):
        c = self.canv
        y = self.height - self.spacing - self.bar_height
        max_bar = self.width - 55*mm

        for label, pct, color, ci_low, ci_high in self.data:
            c.setFont('Helvetica-Bold', 9)
            c.setFillColor(GREY_DARK)
            c.drawString(0, y + self.bar_height/2 - 3, label)

            bar_x = 42*mm
            c.setFillColor(GREY_LIGHT)
            c.roundRect(bar_x, y, max_bar, self.bar_height, 2*mm, fill=1, stroke=0)

            bar_w = max_bar * (pct / 60.0)
            c.setFillColor(color)
            c.roundRect(bar_x, y, bar_w, self.bar_height, 2*mm, fill=1, stroke=0)

            # Pourcentage juste après la barre
            c.setFont('Helvetica-Bold', 10)
            c.setFillColor(GREY_DARK)
            pct_text = f"{pct:.1f}%"
            pct_x = bar_x + bar_w + 2*mm
            c.drawString(pct_x, y + self.bar_height/2 - 3, pct_text)

            # Intervalle de confiance (texte uniquement, après le pourcentage)
            if ci_low is not None:
                pct_text_w = c.stringWidth(pct_text, 'Helvetica-Bold', 10)
                c.setFont('Helvetica', 7)
                c.setFillColor(GREY_MED)
                c.drawString(pct_x + pct_text_w + 2*mm, y + self.bar_height/2 - 3,
                    f"[{ci_low:.1f} - {ci_high:.1f}]")

            y -= (self.bar_height + self.spacing)


class ProbabilityGauge(Flowable):
    """Jauge de probabilité style institut"""
    def __init__(self, prob, label, color, width=55*mm, height=55*mm):
        super().__init__()
        self.prob = prob
        self.label = label
        self.color = color
        self.width = width
        self.height = height

    def draw(self):
        c = self.canv
        cx = self.width / 2
        cy = self.height / 2 + 5*mm
        r = 22*mm

        c.setStrokeColor(GREY_LIGHT)
        c.setLineWidth(8)
        for i in range(181):
            angle = math.radians(180 - i)
            x1 = cx + r * math.cos(angle)
            y1 = cy + r * math.sin(angle)
            if i > 0:
                c.line(prev_x, prev_y, x1, y1)
            prev_x, prev_y = x1, y1

        c.setStrokeColor(self.color)
        c.setLineWidth(8)
        fill_degrees = int(180 * self.prob / 100)
        for i in range(fill_degrees + 1):
            angle = math.radians(180 - i)
            x1 = cx + r * math.cos(angle)
            y1 = cy + r * math.sin(angle)
            if i > 0:
                c.line(prev_x, prev_y, x1, y1)
            prev_x, prev_y = x1, y1

        c.setFont('Helvetica-Bold', 28)
        c.setFillColor(self.color)
        c.drawCentredString(cx, cy - 6*mm, f"{self.prob}%")

        c.setFont('Helvetica-Bold', 9)
        c.setFillColor(GREY_DARK)
        c.drawCentredString(cx, 2*mm, self.label)

        # Drapeaux français si c'est Lemoigne
        if 'LEMOIGNE' in self.label.upper():
            label_w = c.stringWidth(self.label, 'Helvetica-Bold', 9)
            flag_w = 3.5*mm
            flag_h = 2.2*mm
            draw_french_flag(c, cx - label_w/2 - flag_w - 1.5*mm, 1.5*mm, flag_w, flag_h)
            draw_french_flag(c, cx + label_w/2 + 1.5*mm, 1.5*mm, flag_w, flag_h)


class VerdictBox(Flowable):
    """Encart verdict percutant avec drapeaux français autour de Lemoigne"""
    def __init__(self, width):
        super().__init__()
        self.width = width
        self.height = 72*mm

    def draw(self):
        c = self.canv
        w = self.width
        h = self.height

        # Fond principal bleu marine
        c.setFillColor(DARK_NAVY)
        c.roundRect(0, 0, w, h, 4*mm, fill=1, stroke=0)

        # Barre accent supérieure
        c.setFillColor(BLUE_ACCENT)
        c.roundRect(0, h - 3*mm, w, 3*mm, 1.5*mm, fill=1, stroke=0)

        # Titre
        c.setFont('Helvetica-Bold', 11)
        c.setFillColor(WHITE)
        c.drawCentredString(w/2, h - 12*mm, "PROJECTION SECOND TOUR — ESTIMATION CENTRALE")

        # ── LEMOIGNE (centre, grand, avec drapeaux) ──
        lem_y = h - 30*mm
        c.setFont('Helvetica-Bold', 36)
        c.setFillColor(BLUE_ACCENT)
        c.drawCentredString(w/2, lem_y, "45,2%")

        # Nom Lemoigne
        name_y = lem_y - 10*mm
        c.setFont('Helvetica-Bold', 14)
        c.setFillColor(WHITE)
        label_text = "ROMAIN LEMOIGNE"
        label_w = c.stringWidth(label_text, 'Helvetica-Bold', 14)
        c.drawCentredString(w/2, name_y, label_text)

        # Grands drapeaux français de chaque côté
        flag_w = 8*mm
        flag_h = 5.5*mm
        flag_y = name_y - 0.5*mm

        # Drapeau gauche
        draw_french_flag(c, w/2 - label_w/2 - flag_w - 3*mm, flag_y, flag_w, flag_h)
        # Petit drapeau gauche supplémentaire
        draw_french_flag(c, w/2 - label_w/2 - flag_w - 3*mm - flag_w - 2*mm, flag_y + 0.5*mm, flag_w * 0.7, flag_h * 0.7)
        # Drapeau droit
        draw_french_flag(c, w/2 + label_w/2 + 3*mm, flag_y, flag_w, flag_h)
        # Petit drapeau droit supplémentaire
        draw_french_flag(c, w/2 + label_w/2 + 3*mm + flag_w + 2*mm, flag_y + 0.5*mm, flag_w * 0.7, flag_h * 0.7)

        # Probabilité de victoire (gros)
        prob_y = name_y - 14*mm
        c.setFont('Helvetica-Bold', 12)
        c.setFillColor(HexColor("#66BB6A"))
        c.drawCentredString(w/2, prob_y, "Probabilité de victoire : 90 à 95%")

        # Ligne séparatrice
        sep_y = prob_y - 5*mm
        c.setStrokeColor(HexColor("#37474F"))
        c.setLineWidth(0.5)
        c.line(w * 0.1, sep_y, w * 0.9, sep_y)

        # ── GRELET et DA SILVA (en bas, plus petits) ──
        bottom_y = sep_y - 9*mm

        # Grelet à gauche
        c.setFont('Helvetica-Bold', 20)
        c.setFillColor(HexColor("#EF5350"))
        c.drawCentredString(w * 0.3, bottom_y, "41,4%")
        c.setFont('Helvetica', 8)
        c.setFillColor(HexColor("#B0BEC5"))
        c.drawCentredString(w * 0.3, bottom_y - 5*mm, "GRELET-CERTENAIS")
        c.setFont('Helvetica', 7)
        c.drawCentredString(w * 0.3, bottom_y - 9*mm, "P(victoire) = 7%")

        # Da Silva à droite
        c.setFont('Helvetica-Bold', 20)
        c.setFillColor(HexColor("#FDD835"))
        c.drawCentredString(w * 0.7, bottom_y, "13,4%")
        c.setFont('Helvetica', 8)
        c.setFillColor(HexColor("#B0BEC5"))
        c.drawCentredString(w * 0.7, bottom_y - 5*mm, "DA SILVA")
        c.setFont('Helvetica', 7)
        c.drawCentredString(w * 0.7, bottom_y - 9*mm, "P(victoire) < 1%")

        # Méthodologie en bas
        c.setFont('Helvetica-Oblique', 6.5)
        c.setFillColor(HexColor("#78909C"))
        c.drawCentredString(w/2, 2*mm,
            f"Simulation stochastique — {NB_TIRAGES_TXT} scénarios — Inférence écologique 17 BV × 4 scrutins")


class ScenarioTable(Flowable):
    """Tableau de scénarios élégant"""
    def __init__(self, width=170*mm):
        super().__init__()
        self.width = width
        self.height = 50*mm

    def draw(self):
        c = self.canv
        scenarios = [
            ("Grelet optimiste", "55%", "25/75", "45,5%", "43,0%", "11,5%", "+2,5 pts"),
            ("Central", "70%", "40/60", "45,2%", "41,4%", "13,4%", "+3,8 pts"),
            ("Lemoigne optimiste", "80%", "50/50", "44,9%", "40,7%", "14,4%", "+4,2 pts"),
        ]
        headers = [
            "Scénario",
            "Rétention\nDa Silva",
            "Répart.\nfuite",
            "Lemoigne",
            "Grelet",
            "Da Silva",
            "Écart"
        ]
        col_w = [32*mm, 22*mm, 18*mm, 22*mm, 22*mm, 22*mm, 22*mm]

        y = self.height - 8*mm
        x = 5*mm

        c.setFillColor(DARK_NAVY)
        c.roundRect(x, y - 2*mm, self.width - 10*mm, 10*mm, 1.5*mm, fill=1, stroke=0)
        c.setFont('Helvetica-Bold', 7.5)
        c.setFillColor(WHITE)
        cx = x
        for i, h in enumerate(headers):
            lines = h.split('\n')
            for li, line in enumerate(lines):
                c.drawCentredString(cx + col_w[i]/2, y + 2 - li*7, line)
            cx += col_w[i]

        row_colors = [ORANGE_LIGHT, GREEN_LIGHT, HexColor("#E3F2FD")]
        accent_colors = [ORANGE, GREEN, COL_LEMOIGNE]
        for ri, row in enumerate(scenarios):
            ry = y - 12*mm - ri * 10*mm
            c.setFillColor(row_colors[ri])
            c.roundRect(x, ry - 2*mm, self.width - 10*mm, 9*mm, 1*mm, fill=1, stroke=0)
            c.setFillColor(accent_colors[ri])
            c.roundRect(x, ry - 2*mm, 2*mm, 9*mm, 1*mm, fill=1, stroke=0)

            c.setFont('Helvetica-Bold' if ri == 1 else 'Helvetica', 8)
            c.setFillColor(GREY_DARK)
            cx = x
            for ci, cell in enumerate(row):
                if ci == 0:
                    c.drawString(cx + 4*mm, ry + 1, cell)
                else:
                    c.drawCentredString(cx + col_w[ci]/2, ry + 1, cell)
                cx += col_w[ci]

        ry_central = y - 12*mm - 1 * 10*mm
        c.setStrokeColor(GREEN)
        c.setLineWidth(1.5)
        c.roundRect(x, ry_central - 2*mm, self.width - 10*mm, 9*mm, 1*mm, fill=0, stroke=1)


# ── EN-TÊTE ET PIED DE PAGE ──

def header_footer(canvas_obj, doc):
    c = canvas_obj
    w, h = A4

    c.setStrokeColor(BLUE_ACCENT)
    c.setLineWidth(2)
    c.line(15*mm, h - 15*mm, w - 15*mm, h - 15*mm)

    c.setFont('Helvetica', 7)
    c.setFillColor(GREY_MED)
    c.drawString(15*mm, h - 13*mm, "ÉLECTIONS MUNICIPALES LA FLÈCHE 2026")
    c.drawRightString(w - 15*mm, h - 13*mm, "NOTE DE PROJECTION T2 — TRIANGULAIRE")

    c.setStrokeColor(GREY_LIGHT)
    c.setLineWidth(0.5)
    c.line(15*mm, 12*mm, w - 15*mm, 12*mm)

    c.setFont('Helvetica', 6.5)
    c.setFillColor(GREY_MED)
    c.drawString(15*mm, 8*mm,
        f"Méthodologie : inférence écologique (17 BV x 4 scrutins) + simulation stochastique ({NB_TIRAGES_TXT} tirages) + matrices de Dirichlet")
    c.drawRightString(w - 15*mm, 8*mm, f"Page {doc.page}")


# ── CONSTRUCTION DU DOCUMENT ──

def build_pdf():
    styles = make_styles()
    output_path = os.path.join(OUTPUT_DIR, "note_synthese_t2.pdf")

    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        topMargin=20*mm,
        bottomMargin=18*mm,
        leftMargin=15*mm,
        rightMargin=15*mm,
        title="Élections La Flèche 2026 — Projection T2",
        author="Philippe KEVORKIAN"
    )

    story = []
    page_w = A4[0] - 30*mm

    # ══════════════════════════════════════════════
    # PAGE 1 : COUVERTURE PERCUTANTE
    # ══════════════════════════════════════════════

    story.append(Spacer(1, 8*mm))
    story.append(ColorBar(page_w, 3*mm, DARK_NAVY))
    story.append(Spacer(1, 5*mm))

    story.append(Paragraph("Élections municipales", styles['subtitle']))
    story.append(Paragraph("La Flèche 2026", styles['title']))

    cover_sub = ParagraphStyle('CoverSub', parent=styles['subtitle'],
        fontSize=13, textColor=NAVY, fontName='Helvetica-Bold', spaceAfter=2*mm)
    story.append(Paragraph("Note de projection — Second tour (triangulaire)", cover_sub))

    story.append(ColorBar(page_w, 1*mm, BLUE_ACCENT))
    story.append(Spacer(1, 5*mm))

    # ── VERDICT PRINCIPAL (immédiatement visible) ──
    verdict_box = VerdictBox(page_w)
    story.append(verdict_box)
    story.append(Spacer(1, 5*mm))

    # ── RAPPEL : projection pré-T1 confirmée ──
    pret1_text = (
        "<b>Confirmation d'une projection antérieure au T1</b> : dès avant le premier tour, "
        "notre modèle projetait une victoire de Lemoigne avec un score estimé entre <b>42 et 45%</b> "
        "des suffrages exprimés et une probabilité de victoire de <b>85 à 90%</b>. "
        "Le résultat réel du T1 (<b>43,7%</b>, en tête avec 4,2 points d'avance) est tombé "
        "en plein cœur de notre intervalle de confiance, validant la robustesse du modèle. "
        "La présente note actualise cette projection en intégrant les données réelles du T1."
    )
    pret1_data = [[Paragraph(pret1_text,
        ParagraphStyle('', fontSize=8.5, textColor=GREY_DARK, leading=12))]]
    pret1_table = Table(pret1_data, colWidths=[page_w - 10*mm])
    pret1_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), GREEN_LIGHT),
        ('ROUNDEDCORNERS', [4, 4, 4, 4]),
        ('TOPPADDING', (0, 0), (-1, -1), 3*mm),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3*mm),
        ('LEFTPADDING', (0, 0), (-1, -1), 4*mm),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4*mm),
        ('BOX', (0, 0), (-1, -1), 0.5, GREEN),
    ]))
    story.append(pret1_table)
    story.append(Spacer(1, 4*mm))

    # ── INFOS CONTEXTUELLES (compact) ──
    ctx_style = ParagraphStyle('Ctx', parent=styles['body'], fontSize=9, leading=13)
    ctx_data = [[
        Paragraph(
            "<b>Auteur</b> : Philippe KEVORKIAN<br/>"
            "<font size='7' color='#607D8B'>Membre diplômé de la Société Française<br/>"
            "des Analystes Financiers (SFAF)<br/>"
            "Ingénieur SupAéro (ISAE-SUPAERO)</font>",
            ctx_style),
        Paragraph(
            "<b>Publication</b> : 21 mars 2026 (J-1)<br/>"
            "<b>Scrutin</b> : 22 mars 2026<br/>"
            "<b>Configuration</b> : Triangulaire<br/>"
            "<b>Commune</b> : La Flèche (72200)<br/>"
            "<b>Inscrits</b> : 10 330 — 17 bureaux de vote",
            ctx_style),
    ]]
    ctx_table = Table(ctx_data, colWidths=[page_w/2]*2)
    ctx_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), GREY_BG),
        ('ROUNDEDCORNERS', [4, 4, 4, 4]),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 3*mm),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3*mm),
        ('LEFTPADDING', (0, 0), (-1, -1), 4*mm),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4*mm),
    ]))
    story.append(ctx_table)
    story.append(Spacer(1, 4*mm))

    # ── MINI SOMMAIRE ──
    toc_style = ParagraphStyle('TOC', fontName='Helvetica', fontSize=8,
        textColor=GREY_DARK, leading=12, leftIndent=5*mm)
    toc_bold = ParagraphStyle('TOCBold', fontName='Helvetica-Bold', fontSize=9,
        textColor=DARK_NAVY, leading=14, leftIndent=0)

    story.append(Paragraph("<b>Sommaire</b>", toc_bold))
    story.append(Spacer(1, 1*mm))
    toc_items = [
        ("1.", "Probabilité de victoire"),
        ("2.", "Scores attendus et intervalles de confiance"),
        ("3.", "Le paradoxe de la triangulaire"),
        ("4.", "Les facteurs structurels"),
        ("5.", "Analyse des vulnérabilités électorales"),
        ("6.", "Limites méthodologiques"),
        ("", "<b>Conclusion</b>"),
        ("A.", "Annexe — Résultats détaillés du T1 par bureau de vote"),
        ("B.", "Annexe — Méthodologie : comment lire nos projections"),
        ("C.", "Annexe — Mise à jour bayésienne le soir du scrutin"),
    ]
    for num, title in toc_items:
        prefix = f"<font color='#1565C0'><b>{num}</b></font> " if num else ""
        story.append(Paragraph(f"{prefix}{title}", toc_style))

    story.append(Spacer(1, 4*mm))

    story.append(Paragraph(
        f"<b>Méthodologie</b> : Inférence écologique croisée sur 4 scrutins nationaux (2022-2024), "
        f"17 bureaux de vote. Simulation stochastique ({NB_TIRAGES_TXT} tirages) avec matrices "
        "de reports modélisées par lois de Dirichlet. Mise à jour bayésienne en temps réel.",
        styles['small']))
    story.append(Paragraph(
        "<b>Avertissement</b> : Cette note présente des projections fondées sur des modèles statistiques, "
        "pas un sondage d'opinion. Les résultats réels peuvent différer en raison de facteurs non "
        "modélisés (dynamique de campagne, mobilisation différentielle, événements imprévus).",
        styles['small']))

    story.append(PageBreak())

    # ══════════════════════════════════════════════
    # PAGE 2 : PROBABILITÉ DE VICTOIRE
    # ══════════════════════════════════════════════

    story.append(ColorBar(page_w, 2*mm, DARK_NAVY))
    story.append(Spacer(1, 2*mm))
    story.append(Paragraph("1. Probabilité de victoire", styles['h1']))

    story.append(Paragraph(
        "La question centrale pour un décideur : <b>qui va gagner et avec quel degré de certitude ?</b> "
        "Notre modèle répond par une approche probabiliste, et non par une estimation ponctuelle unique.",
        styles['body']))

    # 3 jauges
    gauge_data = [
        [ProbabilityGauge(93, "LEMOIGNE", COL_LEMOIGNE),
         ProbabilityGauge(7, "GRELET-CERTENAIS", COL_GRELET),
         ProbabilityGauge(0, "DA SILVA", COL_DASILVA)]
    ]
    gauge_table = Table(gauge_data, colWidths=[page_w/3]*3)
    gauge_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(gauge_table)

    story.append(Paragraph(
        f"Lecture : sur {NB_TIRAGES_TXT} scénarios simulés en faisant varier les paramètres d'incertitude, "
        "Romain Lemoigne arrive en tête dans environ <b>93% des cas</b>. Nadine Grelet-Certenais "
        "ne l'emporte que dans <b>7% des configurations</b>, correspondant aux hypothèses les plus "
        "favorables à son camp (effondrement Da Silva + report massif en sa faveur).",
        styles['body']))

    story.append(Paragraph("1.1 Comment lire ces probabilités", styles['h2']))

    story.append(Paragraph(
        "Une probabilité de victoire de 93% ne signifie pas que Lemoigne obtiendra 93% des voix. "
        "Elle signifie que, <b>compte tenu de toutes les incertitudes</b> sur les reports de voix, "
        "la participation et la dynamique de campagne, Lemoigne l'emporte dans la très grande "
        "majorité des configurations plausibles.",
        styles['body']))

    story.append(Paragraph(
        "À titre de comparaison, les grands modèles prédictifs américains donnaient à Hillary Clinton "
        "environ 71% de chances en 2016 et à Emmanuel Macron 97% en 2022. Notre intervalle de 90-95% "
        "indique une victoire <b>très probable mais pas certaine</b>.",
        styles['body']))

    story.append(Paragraph("1.2 La méthode scientifique", styles['h2']))

    story.append(Paragraph(
        "Notre modèle repose sur trois piliers complémentaires :",
        styles['body']))

    method_items = [
        ("<b>Inférence écologique</b> : nous analysons les corrélations bureau par bureau (17 BV) "
         "entre les votes aux 4 derniers scrutins nationaux (présidentielle 2022, législatives 2022 et 2024, "
         "européennes 2024) et les votes municipaux de 2026. Cela permet d'identifier <i>d'où viennent</i> "
         "les électeurs de chaque candidat avec une précision statistique (R<super>2</super> de 0,38 à 0,92)."),
        ("<b>Matrices de reports stochastiques</b> : plutôt qu'une hypothèse unique de report des voix, "
         "nous modélisons chaque ligne de la matrice de transfert par une <b>loi de Dirichlet</b>, "
         "ce qui génère des milliers de scénarios possibles respectant les contraintes arithmétiques "
         "(les reports totalisent toujours 100%)."),
        (f"<b>Simulation stochastique</b> : {NB_TIRAGES_TXT} tirages aléatoires dans ces distributions produisent "
         f"{NB_TIRAGES_TXT} résultats possibles du T2. La proportion de victoires de chaque candidat donne "
         "directement sa probabilité de victoire. La dispersion donne les intervalles de confiance.")
    ]
    for i, item in enumerate(method_items):
        num_style = ParagraphStyle('Num', parent=styles['body'],
            leftIndent=8*mm, bulletIndent=0, spaceBefore=2*mm)
        story.append(Paragraph(f"<font color='#1565C0'><b>{i+1}.</b></font> {item}", num_style))

    story.append(Spacer(1, 3*mm))
    story.append(Paragraph(
        f"<i>Cette approche est analogue à celle utilisée par les grands modèles prédictifs "
        "électoraux, adaptée au contexte d'une élection municipale "
        "française avec 17 bureaux de vote. Le nombre élevé de tirages ({NB_TIRAGES_TXT}) garantit "
        "une précision quasi parfaite sur les probabilités et les intervalles de confiance.</i>",
        styles['small']))

    story.append(PageBreak())

    # ══════════════════════════════════════════════
    # PAGE 3 : SCORES ATTENDUS
    # ══════════════════════════════════════════════

    story.append(ColorBar(page_w, 2*mm, DARK_NAVY))
    story.append(Spacer(1, 2*mm))
    story.append(Paragraph("2. Scores attendus et intervalles de confiance", styles['h1']))

    story.append(Paragraph("2.1 Estimation centrale", styles['h2']))

    bars = HorizontalBar([
        ("Lemoigne", 45.2, COL_LEMOIGNE, 44.0, 47.0),
        ("Grelet-C.", 41.4, COL_GRELET, 40.0, 44.0),
        ("Da Silva", 13.4, COL_DASILVA, 10.0, 15.0),
    ], width=page_w)
    story.append(bars)

    story.append(Paragraph(
        "Les barres pleines représentent l'estimation centrale. Les chiffres entre "
        "crochets donnent les bornes de la fourchette à 80%.",
        styles['caption']))

    cell_style = ParagraphStyle('Cell', fontSize=8, textColor=GREY_DARK, alignment=TA_CENTER)

    story.append(PageBreak())

    # Tableau IC 80% / IC 95%
    story.append(ColorBar(page_w, 2*mm, DARK_NAVY))
    story.append(Spacer(1, 2*mm))
    story.append(Paragraph("2.2 Intervalles de confiance comparés", styles['h2']))

    story.append(Paragraph(
        "Le tableau ci-dessous compare les fourchettes à 80% (scénario raisonnablement attendu) "
        "et à 95% (incluant les cas extrêmes). La zone de chevauchement entre Lemoigne et Grelet "
        "à 95% est le <b>risque résiduel d'inversion</b>.",
        styles['body']))

    ic_header_style = ParagraphStyle('', fontSize=8, textColor=WHITE, fontName='Helvetica-Bold', alignment=TA_CENTER)
    ic_data = [
        [Paragraph('<b>Candidat</b>', ic_header_style),
         Paragraph('<b>Estimation<br/>centrale</b>', ic_header_style),
         Paragraph('<b>IC 80%</b><br/><font size="6">(10e-90e centile)</font>', ic_header_style),
         Paragraph('<b>IC 95%</b><br/><font size="6">(2,5e-97,5e centile)</font>', ic_header_style),
         Paragraph('<b>Largeur<br/>IC 95%</b>', ic_header_style)],
        [Paragraph('<b>Lemoigne</b>', ParagraphStyle('', fontSize=8, textColor=COL_LEMOIGNE, fontName='Helvetica-Bold', alignment=TA_CENTER)),
         Paragraph('<b>45,2%</b>', cell_style),
         Paragraph('44,0 — 46,5%', cell_style),
         Paragraph('43,0 — 48,0%', cell_style),
         Paragraph('5,0 pts', cell_style)],
        [Paragraph('<b>Grelet-C.</b>', ParagraphStyle('', fontSize=8, textColor=COL_GRELET, fontName='Helvetica-Bold', alignment=TA_CENTER)),
         Paragraph('<b>41,4%</b>', cell_style),
         Paragraph('40,0 — 43,0%', cell_style),
         Paragraph('38,5 — 44,5%', cell_style),
         Paragraph('6,0 pts', cell_style)],
        [Paragraph('<b>Da Silva</b>', ParagraphStyle('', fontSize=8, textColor=COL_DASILVA, fontName='Helvetica-Bold', alignment=TA_CENTER)),
         Paragraph('<b>13,4%</b>', cell_style),
         Paragraph('11,0 — 15,5%', cell_style),
         Paragraph('8,5 — 17,0%', cell_style),
         Paragraph('8,5 pts', cell_style)],
    ]
    ic_table = Table(ic_data, colWidths=[28*mm, 22*mm, 35*mm, 38*mm, 20*mm])
    ic_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), DARK_NAVY),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, GREY_BG]),
        ('GRID', (0, 0), (-1, -1), 0.5, GREY_LIGHT),
        ('ROUNDEDCORNERS', [3, 3, 3, 3]),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 2*mm),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2*mm),
    ]))
    story.append(ic_table)
    story.append(Spacer(1, 3*mm))

    # Encadré chevauchement
    overlap_text = (
        "<b>Zone de chevauchement IC 95%</b> : la borne haute de Grelet (44,5%) dépasse la borne basse "
        "de Lemoigne (43,0%) de <b>1,5 point</b>. Cela signifie qu'il existe une fenêtre étroite "
        "où une inversion est théoriquement possible. Cette zone correspond aux ~7% de scénarios "
        "où Grelet l'emporte dans la simulation. En revanche, à IC 80%, les intervalles ne se "
        "chevauchent pas (borne haute Grelet 43,0% = borne basse Lemoigne 44,0%), ce qui confirme "
        "que le résultat le plus probable est bien une victoire Lemoigne."
    )
    overlap_data = [[Paragraph(overlap_text,
        ParagraphStyle('', fontSize=9, textColor=GREY_DARK, leading=13))]]
    overlap_table = Table(overlap_data, colWidths=[page_w - 10*mm])
    overlap_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), ORANGE_LIGHT),
        ('ROUNDEDCORNERS', [4, 4, 4, 4]),
        ('TOPPADDING', (0, 0), (-1, -1), 4*mm),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4*mm),
        ('LEFTPADDING', (0, 0), (-1, -1), 5*mm),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5*mm),
        ('BOX', (0, 0), (-1, -1), 0.5, ORANGE),
    ]))
    story.append(overlap_table)

    story.append(PageBreak())

    story.append(ColorBar(page_w, 2*mm, DARK_NAVY))
    story.append(Spacer(1, 2*mm))
    story.append(Paragraph("2.3 Trois scénarios de référence", styles['h2']))

    story.append(Paragraph(
        "Le résultat dépend principalement de deux paramètres : le <b>taux de rétention</b> des électeurs "
        "Da Silva (combien restent fidèles au T2) et la <b>répartition de fuite</b> (parmi ceux qui quittent "
        "Da Silva, quelle proportion va vers Lemoigne ou vers Grelet).",
        styles['body']))

    story.append(ScenarioTable(width=page_w))

    story.append(Spacer(1, 5*mm))

    story.append(Paragraph(
        "<b>Observation majeure</b> : Lemoigne l'emporte dans les trois scénarios. L'écart varie "
        "de +2,5 à +4,2 points, mais la hiérarchie ne change jamais. Même dans le scénario le plus "
        "favorable à Grelet, Lemoigne conserve 2,5 points d'avance.",
        styles['body_bold']))

    story.append(Paragraph("2.4 Sensibilité à la répartition de fuite", styles['h2']))

    split_data = [
        [Paragraph('<b>Répartition fuite L/G</b>', ParagraphStyle('', fontSize=8, textColor=WHITE, fontName='Helvetica-Bold', alignment=TA_CENTER)),
         Paragraph('<b>Lemoigne</b>', ParagraphStyle('', fontSize=8, textColor=WHITE, fontName='Helvetica-Bold', alignment=TA_CENTER)),
         Paragraph('<b>Grelet</b>', ParagraphStyle('', fontSize=8, textColor=WHITE, fontName='Helvetica-Bold', alignment=TA_CENTER)),
         Paragraph('<b>Écart</b>', ParagraphStyle('', fontSize=8, textColor=WHITE, fontName='Helvetica-Bold', alignment=TA_CENTER))],
    ]
    split_rows = [
        ("20/80 (très pro-Grelet)", "45,7%", "42,8%", "+2,9"),
        ("30/70", "46,0%", "42,5%", "+3,5"),
        ("40/60 (central)", "46,4%", "42,1%", "+4,3"),
        ("50/50", "46,7%", "41,8%", "+4,9"),
        ("60/40 (pro-Lemoigne)", "47,0%", "41,5%", "+5,5"),
    ]
    for row in split_rows:
        split_data.append([Paragraph(c, cell_style) for c in row])

    split_table = Table(split_data, colWidths=[45*mm, 30*mm, 30*mm, 25*mm])
    split_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), DARK_NAVY),
        ('BACKGROUND', (0, 1), (-1, -1), GREY_BG),
        ('BACKGROUND', (0, 3), (-1, 3), GREEN_LIGHT),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, GREY_BG]),
        ('GRID', (0, 0), (-1, -1), 0.5, GREY_LIGHT),
        ('ROUNDEDCORNERS', [3, 3, 3, 3]),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 2*mm),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2*mm),
    ]))
    story.append(split_table)
    story.append(Spacer(1, 3*mm))

    story.append(Paragraph(
        "<i>Hypothèses : rétention Da Silva 65%, abstention Da Silva 10%. "
        "Quelle que soit la répartition de fuite, Lemoigne conserve l'avance.</i>",
        styles['caption']))

    story.append(PageBreak())

    # ══════════════════════════════════════════════
    # PAGE 4 : LE PARADOXE DE LA TRIANGULAIRE
    # ══════════════════════════════════════════════

    story.append(ColorBar(page_w, 2*mm, DARK_NAVY))
    story.append(Spacer(1, 2*mm))
    story.append(Paragraph("3. Le paradoxe de la triangulaire", styles['h1']))

    story.append(Paragraph(
        "Le maintien de Michel Da Silva au second tour est généralement perçu comme défavorable "
        "à Romain Lemoigne, puisque Da Silva se positionne contre le RN. <b>Nos données montrent "
        "l'inverse.</b>",
        styles['body']))

    comp_header = ParagraphStyle('', fontSize=8, textColor=WHITE, fontName='Helvetica-Bold', alignment=TA_CENTER)
    comp_explain = ParagraphStyle('', fontSize=7.5, textColor=GREY_DARK, leading=10, alignment=TA_CENTER)

    comp_data = [
        [Paragraph('<b>CONFIGURATION</b>', comp_header),
         Paragraph('<b>LEMOIGNE</b>', comp_header),
         Paragraph('<b>GRELET</b>', comp_header),
         Paragraph('<b>ÉCART<br/>LEMOIGNE - GRELET</b>', comp_header),
         Paragraph('<b>COMBIEN DE VOIX<br/>GRELET DOIT RATTRAPER<br/>POUR GAGNER ?</b>', comp_header)],
        [Paragraph('Duel (hypothétique)', cell_style),
         Paragraph('<b>52,8%</b>', ParagraphStyle('', fontSize=8, textColor=COL_LEMOIGNE, fontName='Helvetica-Bold', alignment=TA_CENTER)),
         Paragraph('47,2%', cell_style),
         Paragraph('+5,6 pts', cell_style),
         Paragraph('<font color="#FF9800"><b>~180 voix</b></font><br/><font size="6">sur ~6 500 exprimés</font>', comp_explain)],
        [Paragraph('<b>Triangulaire<br/>(réelle)</b>', ParagraphStyle('', fontSize=8, fontName='Helvetica-Bold', textColor=GREY_DARK, alignment=TA_CENTER)),
         Paragraph('<b>45,2%</b>', ParagraphStyle('', fontSize=8, textColor=COL_LEMOIGNE, fontName='Helvetica-Bold', alignment=TA_CENTER)),
         Paragraph('41,4%', cell_style),
         Paragraph('<b>+3,8 pts</b>', ParagraphStyle('', fontSize=8, fontName='Helvetica-Bold', textColor=GREEN, alignment=TA_CENTER)),
         Paragraph('<font color="#43A047"><b>~250 voix</b></font><br/><font size="6">sur ~6 500 exprimés</font>', comp_explain)],
    ]
    comp_table = Table(comp_data, colWidths=[30*mm, 25*mm, 25*mm, 25*mm, 45*mm])
    comp_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), DARK_NAVY),
        ('BACKGROUND', (0, 1), (-1, 1), WHITE),
        ('BACKGROUND', (0, 2), (-1, 2), GREEN_LIGHT),
        ('GRID', (0, 0), (-1, -1), 0.5, GREY_LIGHT),
        ('ROUNDEDCORNERS', [3, 3, 3, 3]),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 2.5*mm),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2.5*mm),
    ]))
    story.append(comp_table)
    story.append(Spacer(1, 3*mm))

    # Note pédagogique
    pedagogy_text = (
        "<b>Comment lire ce tableau ?</b> En duel, Grelet aurait eu besoin de rattraper "
        "seulement ~180 voix pour passer devant Lemoigne — un écart franchissable par un "
        "front républicain efficace. En triangulaire, le fossé se creuse à ~250 voix car "
        "Da Silva retient les électeurs centristes qui, autrement, auraient pu basculer "
        "vers Grelet. <b>Paradoxalement, plus Da Silva résiste, plus Grelet est loin de la victoire.</b>"
    )
    pedagogy_data = [[Paragraph(pedagogy_text,
        ParagraphStyle('', fontSize=8.5, textColor=GREY_DARK, leading=12))]]
    pedagogy_table = Table(pedagogy_data, colWidths=[page_w - 10*mm])
    pedagogy_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), LIGHT_BLUE),
        ('ROUNDEDCORNERS', [4, 4, 4, 4]),
        ('TOPPADDING', (0, 0), (-1, -1), 3*mm),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3*mm),
        ('LEFTPADDING', (0, 0), (-1, -1), 4*mm),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4*mm),
    ]))
    story.append(pedagogy_table)
    story.append(Spacer(1, 5*mm))

    story.append(Paragraph("3.1 Trois mécanismes expliquent ce paradoxe", styles['h2']))

    paradox_items = [
        ("<b>Da Silva est un « piège à voix » anti-Grelet.</b> En duel, les électeurs Da Silva "
         "auraient dû choisir entre Lemoigne et Grelet. Même avec un report légèrement favorable "
         "à Lemoigne (55/45), une part significative aurait rejoint Grelet. En triangulaire, "
         "la majorité reste sur Da Silva, privant Grelet de ces reports."),
        ("<b>La triangulaire neutralise le front républicain.</b> Le front républicain fonctionne "
         "quand les électeurs sont <i>forcés</i> de choisir entre deux camps. En triangulaire, "
         "l'option Da Silva offre une « sortie » aux électeurs centristes qui refusent la "
         "polarisation RN contre PS. Le barrage ne cristallise pas."),
        ("<b>Le précédent législatif 2024 ne s'applique plus.</b> Aux législatives, le front "
         "républicain (gauche votant centriste) avait fonctionné. Mais la situation municipale "
         "est inversée : il faudrait que des centristes votent à gauche, ce qui est plus "
         "difficile. En triangulaire, la question ne se pose même plus.")
    ]
    for i, item in enumerate(paradox_items):
        num_style = ParagraphStyle('Num', parent=styles['body'],
            leftIndent=8*mm, bulletIndent=0, spaceBefore=2*mm)
        story.append(Paragraph(f"<font color='#1565C0'><b>{i+1}.</b></font> {item}", num_style))

    story.append(Spacer(1, 5*mm))

    story.append(Paragraph(
        "La déclaration de Da Silva confirme cette analyse :", styles['h3']))
    story.append(Paragraph(
        "« Je me maintiens pour respecter la parole de mes électeurs [...] "
        "il n'est pas question de faire barrage ou non au RN, j'ai ma place ! »",
        styles['quote']))
    story.append(Paragraph(
        "<i>Michel Da Silva, France Bleu Maine, 16 mars 2026</i>",
        ParagraphStyle('', parent=styles['small'], alignment=TA_RIGHT)))

    story.append(Spacer(1, 3*mm))
    story.append(Paragraph(
        "En refusant explicitement le cadrage « barrage républicain », Da Silva torpille "
        "le principal levier stratégique de Grelet-Certenais et conforte la rétention de son "
        "électorat centriste.",
        styles['body']))

    story.append(PageBreak())

    # ══════════════════════════════════════════════
    # PAGE 5 : FACTEURS STRUCTURELS
    # ══════════════════════════════════════════════

    story.append(ColorBar(page_w, 2*mm, DARK_NAVY))
    story.append(Spacer(1, 2*mm))
    story.append(Paragraph("4. Les facteurs structurels", styles['h1']))

    story.append(Paragraph("4.1 Qui vote pour qui ? L'inférence écologique", styles['h2']))

    story.append(Paragraph(
        "L'analyse des corrélations entre votes municipaux et votes nationaux sur les 17 bureaux "
        "de vote révèle des profils électoraux très distincts :",
        styles['body']))

    corr_headers = [
        Paragraph('<b>Bloc national</b>', ParagraphStyle('', fontSize=8, textColor=WHITE, fontName='Helvetica-Bold')),
        Paragraph('<b>Lemoigne</b>', ParagraphStyle('', fontSize=8, textColor=WHITE, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        Paragraph('<b>Grelet-C.</b>', ParagraphStyle('', fontSize=8, textColor=WHITE, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        Paragraph('<b>Da Silva</b>', ParagraphStyle('', fontSize=8, textColor=WHITE, fontName='Helvetica-Bold', alignment=TA_CENTER)),
    ]
    corr_rows_data = [
        ("RN", "+0,86 à +0,92", "-0,68 à -0,75", "-0,70 à -0,74"),
        ("Gauche (PS/LFI)", "-0,55 à -0,65", "+0,61 à +0,70", "+0,17 à +0,26"),
        ("Macron (Ensemble)", "-0,40 à -0,60", "+0,13 à +0,49", "+0,46 à +0,74"),
        ("LR (Droite)", "-0,46 à -0,58", "+0,15 à +0,33", "+0,67 à +0,70"),
    ]

    corr_data = [corr_headers]
    for row in corr_rows_data:
        cells = [Paragraph(row[0], ParagraphStyle('', fontSize=8, fontName='Helvetica-Bold', textColor=GREY_DARK))]
        for val in row[1:]:
            if val.startswith('+0,6') or val.startswith('+0,7') or val.startswith('+0,8') or val.startswith('+0,9'):
                color = GREEN
            elif val.startswith('-0,6') or val.startswith('-0,7') or val.startswith('-0,8') or val.startswith('-0,9'):
                color = RED
            else:
                color = GREY_MED
            cells.append(Paragraph(val, ParagraphStyle('', fontSize=8, textColor=color, alignment=TA_CENTER)))
        corr_data.append(cells)

    corr_table = Table(corr_data, colWidths=[35*mm, 40*mm, 40*mm, 40*mm])
    corr_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), DARK_NAVY),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, GREY_BG]),
        ('GRID', (0, 0), (-1, -1), 0.5, GREY_LIGHT),
        ('ROUNDEDCORNERS', [3, 3, 3, 3]),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 2*mm),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2*mm),
    ]))
    story.append(corr_table)

    story.append(Spacer(1, 3*mm))
    story.append(Paragraph(
        "<i>Corrélations calculées sur 17 BV x 3 scrutins. Vert = affinité forte, Rouge = opposition forte.</i>",
        styles['caption']))

    interp_data = [[Paragraph(
        "<b>Synthèse</b> : Les trois électorats sont nettement différenciés. "
        "L'électorat <font color='#1565C0'>Lemoigne</font> est presque exclusivement "
        "composé d'électeurs RN aux scrutins nationaux (r &gt; 0,86). "
        "L'électorat <font color='#C62828'>Grelet</font> est celui de la gauche (r ~ 0,65). "
        "L'électorat <font color='#F9A825'>Da Silva</font> est celui du bloc Macron + LR "
        "(r ~ 0,60-0,74), nettement anti-RN. "
        "<b>Da Silva et Lemoigne sont sur des bases électorales opposées.</b>",
        ParagraphStyle('', fontSize=9, textColor=GREY_DARK, leading=14)
    )]]
    interp_table = Table(interp_data, colWidths=[page_w - 10*mm])
    interp_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), LIGHT_BLUE),
        ('ROUNDEDCORNERS', [4, 4, 4, 4]),
        ('TOPPADDING', (0, 0), (-1, -1), 4*mm),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4*mm),
        ('LEFTPADDING', (0, 0), (-1, -1), 5*mm),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5*mm),
    ]))
    story.append(interp_table)

    story.append(Paragraph("4.2 L'effondrement du bloc centriste", styles['h2']))

    eff_rows = [
        [Paragraph('<b>Élection</b>', ParagraphStyle('', fontSize=8, textColor=WHITE, fontName='Helvetica-Bold')),
         Paragraph('<b>Bloc Macron + LR</b>', ParagraphStyle('', fontSize=8, textColor=WHITE, fontName='Helvetica-Bold', alignment=TA_CENTER)),
         Paragraph('<b>Tendance</b>', ParagraphStyle('', fontSize=8, textColor=WHITE, fontName='Helvetica-Bold', alignment=TA_CENTER))],
    ]
    eff_data = [
        ("Présidentielle 2022 T1", "37,4%", ""),
        ("Législatives 2024 T1", "35,3%", "-2,1 pts"),
        ("Européennes 2024", "23,4%", "-11,9 pts"),
        ("Municipales 2026 T1 (Da Silva)", "16,8%", "-6,6 pts"),
    ]
    for row in eff_data:
        trend_color = RED if row[2].startswith("-") else GREY_MED
        eff_rows.append([
            Paragraph(row[0], ParagraphStyle('', fontSize=8, textColor=GREY_DARK)),
            Paragraph(f'<b>{row[1]}</b>', ParagraphStyle('', fontSize=8, textColor=GREY_DARK, fontName='Helvetica-Bold', alignment=TA_CENTER)),
            Paragraph(row[2], ParagraphStyle('', fontSize=8, textColor=trend_color, alignment=TA_CENTER))
        ])

    eff_table = Table(eff_rows, colWidths=[55*mm, 40*mm, 30*mm])
    eff_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), DARK_NAVY),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, GREY_BG]),
        ('GRID', (0, 0), (-1, -1), 0.5, GREY_LIGHT),
        ('ROUNDEDCORNERS', [3, 3, 3, 3]),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 2*mm),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2*mm),
    ]))
    story.append(eff_table)

    story.append(Spacer(1, 3*mm))
    story.append(Paragraph(
        "Le bloc centriste (Macron + LR) a perdu plus de 20 points en 4 ans à La Flèche. "
        "Les 1 161 électeurs de Da Silva représentent le <b>noyau dur irréductible</b> — ceux "
        "qui ont résisté à la polarisation droite/gauche. En triangulaire, ce noyau reste "
        "mobilisé sous sa bannière au lieu d'être forcé de choisir un camp.",
        styles['body']))

    story.append(Paragraph("4.3 La variable clé : la rétention Da Silva", styles['h2']))

    story.append(Paragraph(
        "C'est le paramètre qui détermine l'écart final. Trois facteurs plaident pour "
        "une rétention élevée (65-80%) :",
        styles['body']))

    retention_items = [
        "<b>Maintien actif et combatif</b> : Da Silva fait campagne, ne donne aucune consigne "
        "de report, refuse le cadrage « barrage ». Ses électeurs n'ont pas de signal de départ.",
        "<b>Rejet préalable de Grelet</b> : ces électeurs ont déjà quitté le camp Grelet au T1. "
        "Le report vers elle supposerait qu'ils reviennent sur leur choix, ce qui est psychologiquement "
        "coûteux et électoralement rare.",
        "<b>Profil anti-LFI</b> : la présence de sensibilités LFI sur la liste Grelet (soutien "
        "public de la maire à une candidate LFI en 2022) est un repoussoir pour les centristes Da Silva."
    ]
    for i, item in enumerate(retention_items):
        num_style = ParagraphStyle('Num', parent=styles['body'],
            leftIndent=8*mm, bulletIndent=0, spaceBefore=1*mm)
        story.append(Paragraph(f"<font color='#1565C0'>&#8226;</font> {item}", num_style))

    story.append(PageBreak())

    # ══════════════════════════════════════════════
    # PAGE 6 : ANALYSE DES VULNÉRABILITÉS ÉLECTORALES
    # ══════════════════════════════════════════════

    story.append(ColorBar(page_w, 2*mm, RED))
    story.append(Spacer(1, 2*mm))
    story.append(Paragraph("5. Analyse des vulnérabilités électorales", styles['h1']))

    story.append(Paragraph(
        "Notre modèle projette une victoire Lemoigne avec une marge d'environ <b>250 voix</b> "
        "(3,8 points sur ~6 500 exprimés). Cette marge, bien que robuste statistiquement, "
        "n'est pas hors de portée d'irrégularités électorales. Dans un contexte où la majorité "
        "sortante organise les opérations de vote (locaux, listes, procurations), une analyse "
        "de vulnérabilité s'impose.",
        styles['body']))

    story.append(Paragraph("5.1 Contexte : le contrôle administratif du scrutin", styles['h2']))

    story.append(Paragraph(
        "En France, les élections municipales sont organisées par la mairie sortante. "
        "Le maire contrôle : la composition des bureaux de vote (président, secrétaire), "
        "la gestion des listes électorales (inscriptions, radiations), le traitement des "
        "procurations, et la logistique du scrutin (locaux, isoloirs, urnes). Ce cadre "
        "institutionnel crée une <b>asymétrie structurelle</b> en faveur du sortant, "
        "qui peut être exploitée — volontairement ou non — pour influencer le résultat.",
        styles['body']))

    story.append(Paragraph(
        "À La Flèche, la majorité PS est en place depuis plus de 80 ans (depuis 1945). "
        "Le T1 a révélé un écart de 4,2 points en faveur de Lemoigne, un résultat que la "
        "sortante a publiquement qualifié d'inattendu. Cette situation inédite pourrait "
        "créer des incitations à maximiser tous les leviers disponibles.",
        styles['body']))

    story.append(Paragraph("5.2 Vecteurs de risque et chiffrage d'impact", styles['h2']))

    # Tableau des vecteurs de fraude
    fraud_header_style = ParagraphStyle('', fontSize=7.5, textColor=WHITE, fontName='Helvetica-Bold', alignment=TA_CENTER)
    fraud_cell = ParagraphStyle('', fontSize=7.5, textColor=GREY_DARK, leading=10, alignment=TA_LEFT)
    fraud_cell_c = ParagraphStyle('', fontSize=7.5, textColor=GREY_DARK, leading=10, alignment=TA_CENTER)

    fraud_data = [
        [Paragraph('<b>Vecteur</b>', fraud_header_style),
         Paragraph('<b>Mécanisme</b>', fraud_header_style),
         Paragraph('<b>Impact<br/>max. estimé</b>', fraud_header_style),
         Paragraph('<b>Détectabilité</b>', fraud_header_style),
         Paragraph('<b>Risque</b>', fraud_header_style)],

        [Paragraph('<b>Procurations<br/>abusives</b>', ParagraphStyle('', fontSize=7.5, fontName='Helvetica-Bold', textColor=GREY_DARK, leading=10)),
         Paragraph("Établissement de procurations de complaisance par la mairie "
                   "(personnes âgées, EHPAD, absents non consultés). Le maire signe les attestations.", fraud_cell),
         Paragraph('<b>50 à 150<br/>voix</b>', fraud_cell_c),
         Paragraph('Moyenne : vérifiable par recoupement des registres et contestation individuelle', fraud_cell),
         Paragraph('<font color="#E53935"><b>ÉLEVÉ</b></font>', fraud_cell_c)],

        [Paragraph('<b>Manipulation<br/>des listes</b>', ParagraphStyle('', fontSize=7.5, fontName='Helvetica-Bold', textColor=GREY_DARK, leading=10)),
         Paragraph("Inscriptions fictives (résidences secondaires, anciens habitants), "
                   "ou radiations ciblées d'électeurs identifiés comme pro-Lemoigne.", fraud_cell),
         Paragraph('<b>30 à 80<br/>voix</b>', fraud_cell_c),
         Paragraph("Faible avant le vote, forte après (recours administratif, vérification INSEE)", fraud_cell),
         Paragraph('<font color="#FF9800"><b>MODÉRÉ</b></font>', fraud_cell_c)],

        [Paragraph('<b>Dépouillement<br/>biaisé</b>', ParagraphStyle('', fontSize=7.5, fontName='Helvetica-Bold', textColor=GREY_DARK, leading=10)),
         Paragraph("Bulletins Lemoigne déclarés nuls abusivement, erreurs de comptage orientées, "
                   "requalification de bulletins litigieux.", fraud_cell),
         Paragraph('<b>20 à 60<br/>voix</b>', fraud_cell_c),
         Paragraph("Élevée si assesseurs de toutes les listes présents dans chaque bureau", fraud_cell),
         Paragraph('<font color="#FF9800"><b>MODÉRÉ</b></font>', fraud_cell_c)],

        [Paragraph('<b>Bourrage<br/>d\'urnes</b>', ParagraphStyle('', fontSize=7.5, fontName='Helvetica-Bold', textColor=GREY_DARK, leading=10)),
         Paragraph("Ajout de bulletins supplémentaires dans l'urne. Très risqué : "
                   "le nombre d'émargements doit correspondre au nombre de bulletins.", fraud_cell),
         Paragraph('<b>10 à 30<br/>voix</b>', fraud_cell_c),
         Paragraph("Très élevée : écart émargements/bulletins immédiatement visible", fraud_cell),
         Paragraph('<font color="#43A047"><b>FAIBLE</b></font>', fraud_cell_c)],

        [Paragraph('<b>Pression sur<br/>les électeurs</b>', ParagraphStyle('', fontSize=7.5, fontName='Helvetica-Bold', textColor=GREY_DARK, leading=10)),
         Paragraph("Intimidation d'électeurs (employés municipaux, associations subventionnées, "
                   "commerçants dépendants de la mairie). Pression indirecte via le tissu associatif.", fraud_cell),
         Paragraph('<b>30 à 100<br/>voix</b>', fraud_cell_c),
         Paragraph("Très faible : pas de trace, difficile à prouver", fraud_cell),
         Paragraph('<font color="#E53935"><b>ÉLEVÉ</b></font>', fraud_cell_c)],

        [Paragraph('<b>Intimidation<br/>physique</b>', ParagraphStyle('', fontSize=7.5, fontName='Helvetica-Bold', textColor=GREY_DARK, leading=10)),
         Paragraph("Actions violentes visant à décourager les électeurs ou les candidats adverses "
                   "(dégradation de permanences, menaces). Effet sur la mobilisation.", fraud_cell),
         Paragraph('<b>20 à 80<br/>voix</b><br/><font size="6">(démobilisation)</font>', fraud_cell_c),
         Paragraph("Élevée si plainte déposée, mais effet diffus sur le moral des troupes", fraud_cell),
         Paragraph('<font color="#E53935"><b>ÉLEVÉ</b></font><br/><font size="6" color="#E53935">(avéré)</font>', fraud_cell_c)],
    ]

    fraud_table = Table(fraud_data, colWidths=[22*mm, 52*mm, 22*mm, 38*mm, 18*mm])
    fraud_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), DARK_NAVY),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, GREY_BG]),
        ('GRID', (0, 0), (-1, -1), 0.5, GREY_LIGHT),
        ('ROUNDEDCORNERS', [3, 3, 3, 3]),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 1.5*mm),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 1.5*mm),
    ]))
    story.append(fraud_table)
    story.append(Spacer(1, 3*mm))

    story.append(Paragraph("5.3 Impact cumulé et seuil de basculement", styles['h2']))

    story.append(Paragraph(
        "La marge projetée est d'environ <b>250 voix</b>. Pour inverser le résultat, il faudrait "
        "soit soustraire 125 voix à Lemoigne, soit en ajouter 125 à Grelet, soit une combinaison "
        "des deux. Le tableau ci-dessus montre que :",
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
    for i, item in enumerate(impact_items):
        num_style = ParagraphStyle('Num', parent=styles['body'],
            leftIndent=8*mm, bulletIndent=0, spaceBefore=1*mm)
        story.append(Paragraph(f"<font color='#E53935'>&#8226;</font> {item}", num_style))

    story.append(Paragraph("5.4 Recommandations de vigilance", styles['h2']))

    vigil_items = [
        "<b>Assesseurs dans chaque bureau</b> : la liste Lemoigne doit impérativement placer "
        "un assesseur titulaire et un suppléant dans chacun des 17 bureaux de vote. C'est la "
        "première ligne de défense contre les irrégularités au dépouillement.",
        "<b>Délégués de liste</b> : nommer des délégués habilités à contester les bulletins "
        "déclarés nuls et à exiger un recomptage en cas de doute.",
        "<b>Suivi des procurations</b> : surveiller le volume de procurations par bureau "
        "(un pic inhabituel dans certains bureaux est un signal d'alerte). Demander la "
        "communication des registres de procurations.",
        "<b>Recours juridiques</b> : en cas d'irrégularité constatée, consigner immédiatement "
        "au procès-verbal du bureau de vote (avec mention des témoins), et préparer un recours "
        "devant le tribunal administratif dans les 5 jours suivant la proclamation des résultats.",
        "<b>Comptage parallèle</b> : tenir un décompte indépendant bureau par bureau au fur "
        "et à mesure de la soirée électorale, et comparer avec les chiffres officiels."
    ]
    for item in vigil_items:
        num_style = ParagraphStyle('Num', parent=styles['body'],
            leftIndent=8*mm, bulletIndent=0, spaceBefore=1*mm)
        story.append(Paragraph(f"<font color='#1565C0'>&#8226;</font> {item}", num_style))

    story.append(Spacer(1, 5*mm))

    # Encadré synthèse risque
    risk_text = (
        "<b>Synthèse du risque</b> : la probabilité d'une inversion du résultat par irrégularités "
        "est estimée <b>faible mais non négligeable</b>. Elle nécessiterait la mobilisation "
        "simultanée de plusieurs vecteurs (procurations + pression + dépouillement) pour un "
        "impact cumulé d'au moins 250 voix. Le risque est d'autant plus réel que la majorité "
        "sortante contrôle l'appareil administratif depuis 80 ans. "
        "La présence d'assesseurs dans chaque bureau et la tenue d'un comptage parallèle "
        "sont les contre-mesures essentielles."
    )
    risk_data = [[Paragraph(risk_text,
        ParagraphStyle('', fontSize=9, textColor=GREY_DARK, leading=13))]]
    risk_table = Table(risk_data, colWidths=[page_w - 10*mm])
    risk_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), RED_LIGHT),
        ('ROUNDEDCORNERS', [4, 4, 4, 4]),
        ('TOPPADDING', (0, 0), (-1, -1), 4*mm),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4*mm),
        ('LEFTPADDING', (0, 0), (-1, -1), 5*mm),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5*mm),
        ('BOX', (0, 0), (-1, -1), 1, RED),
    ]))
    story.append(risk_table)

    story.append(PageBreak())

    # ══════════════════════════════════════════════
    # PAGE : LIMITES + CONCLUSION
    # ══════════════════════════════════════════════

    story.append(ColorBar(page_w, 2*mm, DARK_NAVY))
    story.append(Spacer(1, 2*mm))
    story.append(Paragraph("6. Limites méthodologiques", styles['h1']))

    story.append(Paragraph(
        "Toute projection rigoureuse doit expliciter ses limites. Nous identifions cinq "
        "sources d'incertitude non entièrement captées par le modèle :",
        styles['body']))

    limits = [
        ("<b>Erreur écologique</b> : les corrélations au niveau des bureaux "
         "de vote ne prouvent pas le comportement individuel. Avec 17 points d'observation, "
         "la puissance statistique reste limitée (R<super>2</super> max = 0,92, mais certaines "
         "corrélations n'atteignent que 0,38)."),
        ("<b>Dynamique de campagne T2</b> : notre modèle est essentiellement statique. "
         "Il ne capte pas les effets d'un débat télévisé, d'un soutien médiatique de dernière "
         "minute, ou d'un événement imprévu entre le T1 et le T2."),
        ("<b>Mobilisation différentielle</b> : nous supposons une loyauté symétrique entre les "
         "camps Lemoigne et Grelet (~97%). Un front républicain structuré pourrait mobiliser "
         "davantage le camp anti-Lemoigne, mais la déclaration Da Silva limite fortement ce risque."),
        ("<b>Effet « vote utile »</b> : la pression au vote utile pourrait éroder le score "
         "Da Silva plus que prévu. Cependant, le maintien actif et la posture combative "
         "du candidat limitent cet effet (pas de signal de retrait)."),
        ("<b>Facteurs non modélisés</b> : procurations, nouveaux inscrits, météo le jour du vote, "
         "et tout événement de dernière minute susceptible de modifier la participation ou les "
         "équilibres entre les trois listes.")
    ]
    for i, item in enumerate(limits):
        num_style = ParagraphStyle('Num', parent=styles['body'],
            leftIndent=8*mm, bulletIndent=0, spaceBefore=2*mm)
        story.append(Paragraph(f"<font color='#E53935'><b>{i+1}.</b></font> {item}", num_style))

    story.append(Spacer(1, 8*mm))

    story.append(ColorBar(page_w, 2*mm, DARK_NAVY))
    story.append(Spacer(1, 2*mm))
    story.append(Paragraph("Conclusion", styles['h1']))

    concl_text = (
        "<b>L'ensemble des données converge vers une victoire de Romain Lemoigne le 22 mars 2026.</b>"
        "<br/><br/>"
        "Avec une probabilité estimée entre 90 et 95%, une estimation centrale à 45,2% des voix "
        "(fourchette 44-47%), et un avantage de 3 à 5 points sur Nadine Grelet-Certenais, "
        "le candidat arrivé en tête du T1 dispose d'une avance structurelle robuste."
        "<br/><br/>"
        "Le paradoxe central de cette élection est que la triangulaire, généralement perçue comme "
        "défavorable au candidat RN, le protège en réalité en neutralisant le front républicain "
        "et en maintenant l'électorat centriste dans un « sas de décompression » (la liste Da Silva) "
        "plutôt que de le forcer à rejoindre le camp Grelet."
        "<br/><br/>"
        "Le seul scénario de victoire pour Grelet-Certenais supposerait la conjonction simultanée "
        "de trois événements improbables : effondrement Da Silva sous 8%, report massif vers Grelet "
        "(&gt;65% des fuyards), et aucune démobilisation de la base sortante. Cette conjonction "
        "est estimée à moins de 7% de probabilité."
        "<br/><br/>"
        "<i>Si La Flèche bascule, ce sera la première victoire du RN dans cette ville "
        "historiquement socialiste depuis 1945.</i>"
    )
    concl_data = [[Paragraph(concl_text,
        ParagraphStyle('', fontSize=9.5, textColor=GREY_DARK, leading=15, alignment=TA_JUSTIFY))]]
    concl_table = Table(concl_data, colWidths=[page_w - 10*mm])
    concl_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), GREY_BG),
        ('ROUNDEDCORNERS', [4, 4, 4, 4]),
        ('TOPPADDING', (0, 0), (-1, -1), 5*mm),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5*mm),
        ('LEFTPADDING', (0, 0), (-1, -1), 6*mm),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6*mm),
        ('BOX', (0, 0), (-1, -1), 1, DARK_NAVY),
    ]))
    story.append(concl_table)

    story.append(PageBreak())

    # ══════════════════════════════════════════════
    # ANNEXE A : RÉSULTATS DÉTAILLÉS T1 PAR BV
    # ══════════════════════════════════════════════

    story.append(ColorBar(page_w, 2*mm, GREY_MED))
    story.append(Spacer(1, 2*mm))
    story.append(Paragraph("Annexe A — Résultats détaillés du T1 par bureau de vote", styles['h1']))

    story.append(Paragraph(
        "Le tableau ci-dessous présente les résultats complets du premier tour (15 mars 2026) "
        "dans chacun des 17 bureaux de vote de La Flèche. Ces données bureau par bureau sont "
        "le socle de notre modèle de projection : c'est en analysant les variations d'un bureau "
        "à l'autre que nous identifions les profils électoraux et estimons les reports de voix.",
        styles['body']))

    # Résumé global
    story.append(Paragraph("A.1 Résultat global", styles['h2']))

    t1_global_data = [
        [Paragraph('<b>Candidat</b>', ParagraphStyle('', fontSize=8, textColor=WHITE, fontName='Helvetica-Bold')),
         Paragraph('<b>Voix</b>', ParagraphStyle('', fontSize=8, textColor=WHITE, fontName='Helvetica-Bold', alignment=TA_CENTER)),
         Paragraph('<b>% exprimés</b>', ParagraphStyle('', fontSize=8, textColor=WHITE, fontName='Helvetica-Bold', alignment=TA_CENTER)),
         Paragraph('<b>% inscrits</b>', ParagraphStyle('', fontSize=8, textColor=WHITE, fontName='Helvetica-Bold', alignment=TA_CENTER)),
         Paragraph('<b>Qualifié T2 ?</b>', ParagraphStyle('', fontSize=8, textColor=WHITE, fontName='Helvetica-Bold', alignment=TA_CENTER))],
        [Paragraph('🇫🇷 Romain Lemoigne (RN)', ParagraphStyle('', fontSize=8, textColor=COL_LEMOIGNE, fontName='Helvetica-Bold')),
         Paragraph('<b>3 014</b>', cell_style), Paragraph('<b>43,68%</b>', cell_style), Paragraph('29,18%', cell_style),
         Paragraph('<font color="#43A047"><b>OUI</b></font>', cell_style)],
        [Paragraph('Nadine Grelet-Certenais (PS)', ParagraphStyle('', fontSize=8, textColor=COL_GRELET, fontName='Helvetica-Bold')),
         Paragraph('2 724', cell_style), Paragraph('39,48%', cell_style), Paragraph('26,37%', cell_style),
         Paragraph('<font color="#43A047"><b>OUI</b></font>', cell_style)],
        [Paragraph('Michel Da Silva (DVD)', ParagraphStyle('', fontSize=8, textColor=COL_DASILVA, fontName='Helvetica-Bold')),
         Paragraph('1 161', cell_style), Paragraph('16,83%', cell_style), Paragraph('11,24%', cell_style),
         Paragraph('<font color="#43A047"><b>OUI</b></font> <font size="6">(>10%)</font>', cell_style)],
    ]
    t1_global_table = Table(t1_global_data, colWidths=[50*mm, 20*mm, 25*mm, 22*mm, 28*mm])
    t1_global_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), DARK_NAVY),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, GREY_BG]),
        ('GRID', (0, 0), (-1, -1), 0.5, GREY_LIGHT),
        ('ROUNDEDCORNERS', [3, 3, 3, 3]),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 2*mm),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2*mm),
    ]))
    story.append(t1_global_table)
    story.append(Spacer(1, 2*mm))

    # Encadré participation
    part_text = (
        "<b>Participation</b> : Inscrits : 10 330 | Votants : 7 114 (<b>68,87%</b>) | "
        "Blancs : 130 (1,83%) | Nuls : 84 (1,18%) | Exprimés : 6 900 (97,0% des votants)"
    )
    part_data = [[Paragraph(part_text, ParagraphStyle('', fontSize=8.5, textColor=GREY_DARK, leading=12))]]
    part_table = Table(part_data, colWidths=[page_w - 10*mm])
    part_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), LIGHT_BLUE),
        ('ROUNDEDCORNERS', [4, 4, 4, 4]),
        ('TOPPADDING', (0, 0), (-1, -1), 3*mm),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3*mm),
        ('LEFTPADDING', (0, 0), (-1, -1), 4*mm),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4*mm),
    ]))
    story.append(part_table)
    story.append(Spacer(1, 4*mm))

    # Tableau détaillé par BV
    story.append(Paragraph("A.2 Détail par bureau de vote", styles['h2']))

    # Données T1 par bureau
    bv_results = [
        ("01", 495, 332, 145, 53, 127),
        ("02", 744, 538, 258, 91, 170),
        ("03", 667, 453, 186, 66, 186),
        ("04", 573, 402, 148, 91, 156),
        ("05", 664, 464, 210, 70, 165),
        ("06", 616, 410, 195, 60, 144),
        ("07", 664, 469, 191, 80, 183),
        ("08", 486, 331, 164, 46, 106),
        ("09", 547, 358, 167, 56, 124),
        ("10", 507, 368, 114, 65, 183),
        ("11", 538, 360, 127, 74, 151),
        ("12", 519, 356, 130, 68, 149),
        ("13", 518, 293, 124, 43, 120),
        ("14", 653, 460, 211, 50, 186),
        ("15", 839, 574, 272, 79, 196),
        ("16", 754, 537, 207, 94, 217),
        ("17", 546, 409, 165, 75, 161),
    ]

    bv_header_style = ParagraphStyle('', fontSize=7, textColor=WHITE, fontName='Helvetica-Bold', alignment=TA_CENTER)
    bv_cell = ParagraphStyle('', fontSize=7, textColor=GREY_DARK, alignment=TA_CENTER)
    bv_cell_bold = ParagraphStyle('', fontSize=7, textColor=GREY_DARK, fontName='Helvetica-Bold', alignment=TA_CENTER)

    bv_table_data = [[
        Paragraph('<b>BV</b>', bv_header_style),
        Paragraph('<b>Inscrits</b>', bv_header_style),
        Paragraph('<b>Votants</b>', bv_header_style),
        Paragraph('<b>Particip.</b>', bv_header_style),
        Paragraph('<b>Lemoigne</b>', bv_header_style),
        Paragraph('<b>%</b>', bv_header_style),
        Paragraph('<b>Da Silva</b>', bv_header_style),
        Paragraph('<b>%</b>', bv_header_style),
        Paragraph('<b>Grelet</b>', bv_header_style),
        Paragraph('<b>%</b>', bv_header_style),
        Paragraph('<b>En tête</b>', bv_header_style),
    ]]

    for bv_num, inscrits, votants, lem, das, gre in bv_results:
        expr = lem + das + gre  # approximation (blancs/nuls non séparés)
        particip = votants / inscrits * 100
        lem_pct = lem / expr * 100
        das_pct = das / expr * 100
        gre_pct = gre / expr * 100
        # Qui est en tête ?
        if lem >= gre and lem >= das:
            leader = f'<font color="#1565C0"><b>L</b></font>'
        elif gre >= lem and gre >= das:
            leader = f'<font color="#C62828"><b>G</b></font>'
        else:
            leader = f'<font color="#F9A825"><b>D</b></font>'
        # Couleur du % Lemoigne
        lem_color = COL_LEMOIGNE if lem >= gre else GREY_DARK

        bv_table_data.append([
            Paragraph(f'<b>{bv_num}</b>', bv_cell_bold),
            Paragraph(f'{inscrits}', bv_cell),
            Paragraph(f'{votants}', bv_cell),
            Paragraph(f'{particip:.1f}%', bv_cell),
            Paragraph(f'<b>{lem}</b>', ParagraphStyle('', fontSize=7, textColor=COL_LEMOIGNE, fontName='Helvetica-Bold', alignment=TA_CENTER)),
            Paragraph(f'{lem_pct:.1f}%', bv_cell),
            Paragraph(f'{das}', ParagraphStyle('', fontSize=7, textColor=COL_DASILVA, alignment=TA_CENTER)),
            Paragraph(f'{das_pct:.1f}%', bv_cell),
            Paragraph(f'{gre}', ParagraphStyle('', fontSize=7, textColor=COL_GRELET, alignment=TA_CENTER)),
            Paragraph(f'{gre_pct:.1f}%', bv_cell),
            Paragraph(leader, bv_cell),
        ])

    # Ligne totaux
    tot_lem = sum(r[3] for r in bv_results)
    tot_das = sum(r[4] for r in bv_results)
    tot_gre = sum(r[5] for r in bv_results)
    tot_expr = tot_lem + tot_das + tot_gre
    tot_ins = sum(r[1] for r in bv_results)
    tot_vot = sum(r[2] for r in bv_results)
    bv_table_data.append([
        Paragraph('<b>TOTAL</b>', bv_cell_bold),
        Paragraph(f'<b>{tot_ins:,}</b>'.replace(',', ' '), bv_cell_bold),
        Paragraph(f'<b>{tot_vot:,}</b>'.replace(',', ' '), bv_cell_bold),
        Paragraph(f'<b>{tot_vot/tot_ins*100:.1f}%</b>', bv_cell_bold),
        Paragraph(f'<b>{tot_lem:,}</b>'.replace(',', ' '), ParagraphStyle('', fontSize=7, textColor=COL_LEMOIGNE, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        Paragraph(f'<b>{tot_lem/tot_expr*100:.1f}%</b>', bv_cell_bold),
        Paragraph(f'<b>{tot_das:,}</b>'.replace(',', ' '), ParagraphStyle('', fontSize=7, textColor=COL_DASILVA, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        Paragraph(f'<b>{tot_das/tot_expr*100:.1f}%</b>', bv_cell_bold),
        Paragraph(f'<b>{tot_gre:,}</b>'.replace(',', ' '), ParagraphStyle('', fontSize=7, textColor=COL_GRELET, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        Paragraph(f'<b>{tot_gre/tot_expr*100:.1f}%</b>', bv_cell_bold),
        Paragraph('<font color="#1565C0"><b>L</b></font>', bv_cell),
    ])

    bv_col_widths = [10*mm, 15*mm, 15*mm, 15*mm, 15*mm, 12*mm, 14*mm, 12*mm, 14*mm, 12*mm, 12*mm]
    bv_table = Table(bv_table_data, colWidths=bv_col_widths)
    bv_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), DARK_NAVY),
        ('BACKGROUND', (0, -1), (-1, -1), GREY_LIGHT),
        ('ROWBACKGROUNDS', (0, 1), (-1, -2), [WHITE, GREY_BG]),
        ('GRID', (0, 0), (-1, -1), 0.3, GREY_LIGHT),
        ('ROUNDEDCORNERS', [3, 3, 3, 3]),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 1.2*mm),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 1.2*mm),
    ]))
    story.append(bv_table)
    story.append(Spacer(1, 3*mm))

    # Légende
    bv_legend = (
        "<b>L</b> = Lemoigne en tête, <b>G</b> = Grelet en tête, <b>D</b> = Da Silva en tête. "
        "Les pourcentages sont calculés sur les suffrages exprimés (voix Lemoigne + Da Silva + Grelet). "
        "Lemoigne arrive en tête dans <b>11 bureaux sur 17</b>, Grelet dans 6. "
        "Da Silva n'est en tête dans aucun bureau."
    )
    story.append(Paragraph(bv_legend, styles['caption']))

    story.append(PageBreak())

    # ══════════════════════════════════════════════
    # ANNEXE B : MÉTHODOLOGIE PÉDAGOGIQUE
    # ══════════════════════════════════════════════

    story.append(ColorBar(page_w, 2*mm, GREY_MED))
    story.append(Spacer(1, 2*mm))
    story.append(Paragraph("Annexe B — Méthodologie : comment lire nos projections", styles['h1']))

    story.append(Paragraph(
        "Cette annexe explique, de manière accessible, les méthodes statistiques utilisées pour "
        "produire les projections présentées dans cette note. L'objectif est de permettre au lecteur "
        "de comprendre <b>d'où viennent les chiffres</b> et <b>pourquoi on peut leur accorder un "
        "degré de confiance élevé</b>.",
        styles['body']))

    # B.1 Point de départ : les bureaux de vote
    story.append(Paragraph("B.1 Le point de départ : 17 bureaux de vote × 4 scrutins", styles['h2']))

    story.append(Paragraph(
        "La Flèche est divisée en <b>17 bureaux de vote</b>. Chacun a son propre profil sociologique : "
        "certains penchent à droite, d'autres à gauche, d'autres sont centristes. En comparant "
        "comment chaque bureau a voté aux 4 dernières élections nationales (présidentielle 2022, "
        "législatives 2022 et 2024, européennes 2024) et au premier tour des municipales 2026, "
        "nous pouvons identifier <b>d'où viennent les électeurs de chaque candidat</b>.",
        styles['body']))

    story.append(Paragraph(
        "Par exemple, si les bureaux où Lemoigne fait ses meilleurs scores au T1 sont aussi "
        "ceux où le RN obtient ses meilleurs résultats aux élections nationales, on en déduit "
        "que l'électorat Lemoigne est principalement issu du bloc RN. Cette méthode s'appelle "
        "l'<b>inférence écologique</b>.",
        styles['body']))

    # Encadré analogie
    analogy1_text = (
        "<b>Analogie</b> : c'est comme analyser 17 quartiers d'une ville. Si dans les quartiers "
        "où il pleut beaucoup, on observe aussi plus de parapluies vendus, on en déduit un lien "
        "pluie → parapluies. De même, si dans les bureaux où le RN est fort nationalement, "
        "Lemoigne est fort localement, on en déduit un lien RN → Lemoigne."
    )
    analogy1_data = [[Paragraph(analogy1_text, ParagraphStyle('', fontSize=8.5, textColor=GREY_DARK, leading=12))]]
    analogy1_table = Table(analogy1_data, colWidths=[page_w - 10*mm])
    analogy1_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), LIGHT_BLUE),
        ('ROUNDEDCORNERS', [4, 4, 4, 4]),
        ('TOPPADDING', (0, 0), (-1, -1), 3*mm),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3*mm),
        ('LEFTPADDING', (0, 0), (-1, -1), 4*mm),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4*mm),
    ]))
    story.append(analogy1_table)
    story.append(Spacer(1, 4*mm))

    # B.2 Matrice de reports
    story.append(Paragraph("B.2 La matrice de reports : qui vote pour qui au second tour ?", styles['h2']))

    story.append(Paragraph(
        "À partir de l'inférence écologique, nous construisons une <b>matrice de reports</b> : "
        "un tableau qui indique, pour chaque bloc d'électeurs du T1, quelle proportion se reportera "
        "sur chaque candidat au T2. Par exemple :",
        styles['body']))

    matrix_text = (
        "• 97% des électeurs Lemoigne au T1 revoteront Lemoigne au T2\n"
        "• 97% des électeurs Grelet au T1 revoteront Grelet au T2\n"
        "• 70% des électeurs Da Silva resteront fidèles au T2\n"
        "• Les 30% restants se répartissent : 40% vers Lemoigne, 60% vers Grelet\n\n"
        "Mais ces pourcentages ne sont pas connus avec certitude ! C'est là qu'intervient "
        "la simulation."
    )
    story.append(Paragraph(matrix_text.replace('\n', '<br/>'),
        ParagraphStyle('', fontSize=9, textColor=GREY_DARK, leading=13, leftIndent=5*mm)))
    story.append(Spacer(1, 3*mm))

    # B.3 Loi de Dirichlet
    story.append(Paragraph("B.3 La loi de Dirichlet : modéliser l'incertitude sur les reports", styles['h2']))

    story.append(Paragraph(
        "Le problème : nous ne savons pas exactement comment les électeurs Da Silva vont se "
        "répartir. Peut-être que 60% resteront fidèles, peut-être 80%. Peut-être que les fuyards "
        "iront 50/50, peut-être 30/70. Comment tenir compte de cette incertitude ?",
        styles['body']))

    story.append(Paragraph(
        "La réponse est la <b>loi de Dirichlet</b>. C'est un outil mathématique qui permet de "
        "générer aléatoirement des répartitions en pourcentages (dont la somme fait toujours 100%). "
        "Pour chaque ligne de la matrice de reports, au lieu de fixer un chiffre unique, "
        "nous définissons une <i>distribution</i> centrée sur notre meilleure estimation, "
        "avec une marge d'incertitude calibrée.",
        styles['body']))

    # Encadré analogie Dirichlet
    analogy2_text = (
        "<b>Analogie</b> : imaginez que vous devez répartir 100 billes entre 3 boîtes. "
        "Vous pensez mettre environ 70 dans la boîte A, 12 dans la B et 18 dans la C. "
        "La loi de Dirichlet est comme un mécanisme qui « secoue » cette répartition : "
        "à chaque tirage, vous obtenez une répartition légèrement différente "
        "(par exemple 68-14-18, ou 73-10-17), mais toujours centrée autour de votre "
        "estimation initiale. Les 100 billes restent 100 billes — seule la répartition varie."
    )
    analogy2_data = [[Paragraph(analogy2_text, ParagraphStyle('', fontSize=8.5, textColor=GREY_DARK, leading=12))]]
    analogy2_table = Table(analogy2_data, colWidths=[page_w - 10*mm])
    analogy2_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), LIGHT_BLUE),
        ('ROUNDEDCORNERS', [4, 4, 4, 4]),
        ('TOPPADDING', (0, 0), (-1, -1), 3*mm),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3*mm),
        ('LEFTPADDING', (0, 0), (-1, -1), 4*mm),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4*mm),
    ]))
    story.append(analogy2_table)
    story.append(Spacer(1, 4*mm))

    # B.4 Monte Carlo
    story.append(Paragraph(f"B.4 La simulation de Monte Carlo : {NB_TIRAGES_TXT} scénarios possibles", styles['h2']))

    story.append(Paragraph(
        f"La méthode de <b>Monte Carlo</b> consiste à répéter une expérience aléatoire un très "
        f"grand nombre de fois ({NB_TIRAGES_TXT} dans notre cas) pour en déduire des probabilités. "
        "Le principe est simple :",
        styles['body']))

    mc_steps = [
        "<b>Tirage aléatoire</b> : on tire une matrice de reports au hasard dans la loi de Dirichlet "
        "(les pourcentages varient d'un tirage à l'autre).",
        "<b>Calcul du résultat</b> : avec cette matrice, on applique les reports aux voix du T1 "
        "dans chacun des 17 bureaux de vote et on obtient un résultat T2 complet.",
        f"<b>Répétition</b> : on recommence {NB_TIRAGES_TXT} fois. Chaque tirage donne un résultat "
        "légèrement différent car les reports changent à chaque fois.",
        "<b>Comptage</b> : on compte dans combien de tirages Lemoigne gagne, dans combien Grelet gagne, "
        "dans combien Da Silva gagne. Le pourcentage de victoires = la probabilité de victoire."
    ]
    for i, item in enumerate(mc_steps):
        num_style = ParagraphStyle('Num', parent=styles['body'],
            leftIndent=8*mm, bulletIndent=0, spaceBefore=1.5*mm)
        story.append(Paragraph(f"<font color='#1565C0'><b>{i+1}.</b></font> {item}", num_style))

    story.append(Spacer(1, 3*mm))

    # Encadré analogie Monte Carlo
    analogy3_text = (
        f"<b>Analogie</b> : imaginez un jeu de fléchettes. Vous lancez {NB_TIRAGES_TXT} fléchettes "
        "sur une cible. Chaque lancer est légèrement différent (votre main tremble un peu), "
        "mais la majorité des fléchettes atterrit près du centre. En comptant où elles "
        "tombent, vous pouvez dire : « 93% de mes fléchettes tombent dans la zone Lemoigne, "
        "7% dans la zone Grelet ». C'est exactement ce que fait notre simulation, mais avec "
        "des paramètres électoraux au lieu de fléchettes."
    )
    analogy3_data = [[Paragraph(analogy3_text, ParagraphStyle('', fontSize=8.5, textColor=GREY_DARK, leading=12))]]
    analogy3_table = Table(analogy3_data, colWidths=[page_w - 10*mm])
    analogy3_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), LIGHT_BLUE),
        ('ROUNDEDCORNERS', [4, 4, 4, 4]),
        ('TOPPADDING', (0, 0), (-1, -1), 3*mm),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3*mm),
        ('LEFTPADDING', (0, 0), (-1, -1), 4*mm),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4*mm),
    ]))
    story.append(analogy3_table)
    story.append(Spacer(1, 4*mm))

    # B.5 Construction du résultat global
    story.append(Paragraph("B.5 Du bureau de vote au résultat global", styles['h2']))

    story.append(Paragraph(
        "Notre modèle ne projette pas un résultat global unique. Il construit le résultat "
        "<b>bureau par bureau</b>, puis additionne. Voici pourquoi c'est important :",
        styles['body']))

    bvglobal_items = [
        "<b>Chaque bureau a son propre profil</b> : le bureau 02 (très pro-Lemoigne à 49,8%) "
        "n'a pas les mêmes reports que le bureau 10 (très pro-Grelet à 50,6%). Les appliquer "
        "uniformément serait une erreur.",
        "<b>L'incertitude se compense entre bureaux</b> : si la simulation surestime Lemoigne "
        "dans un bureau, elle le sous-estime probablement dans un autre. Avec 17 bureaux, "
        "les erreurs tendent à s'annuler — c'est la <i>loi des grands nombres</i>.",
        "<b>Le résultat global est plus stable que chaque bureau</b> : même si les projections "
        "bureau par bureau ont une marge d'erreur de ±3-4 points, le résultat agrégé n'oscille "
        "que de ±2 points grâce à cet effet de compensation."
    ]
    for i, item in enumerate(bvglobal_items):
        num_style = ParagraphStyle('Num', parent=styles['body'],
            leftIndent=8*mm, bulletIndent=0, spaceBefore=1.5*mm)
        story.append(Paragraph(f"<font color='#1565C0'><b>{i+1}.</b></font> {item}", num_style))

    story.append(Spacer(1, 4*mm))

    # B.6 Données sources
    story.append(Paragraph("B.6 Données sources", styles['h2']))
    story.append(Paragraph(
        "Les données électorales proviennent de DataRealis (fichier INSEE 72154) pour les scrutins "
        "nationaux et du Ministère de l'Intérieur pour les municipales 2026. Tous les résultats "
        "sont disponibles au niveau de chacun des 17 bureaux de vote.",
        styles['small']))

    sources_items = [
        "Présidentielle 2022 (T1 et T2) — 17 BV, résultats par candidat",
        "Législatives 2022 (T1 et T2) — 17 BV, résultats par candidat",
        "Européennes 2024 — 17 BV, résultats par liste",
        "Législatives 2024 (T1) — 17 BV, résultats par candidat",
        "Municipales 2020 — résultats par liste (1 seul tour, contexte Covid)",
        "Municipales 2026 T1 — 17 BV, résultats définitifs par liste"
    ]
    for item in sources_items:
        story.append(Paragraph(f"&#8226; {item}",
            ParagraphStyle('', parent=styles['small'], leftIndent=5*mm)))

    story.append(Spacer(1, 4*mm))

    # B.7 Hypothèses centrales
    story.append(Paragraph("B.7 Hypothèses centrales du scénario T2", styles['h2']))

    hyp_items = [
        "Loyauté Lemoigne et Grelet au T2 : 97% (fuite croisée 1,5%, abstention différentielle 1,5%)",
        "Rétention Da Silva : 70% (fourchette testée : 40% à 85%)",
        "Répartition de fuite Da Silva : 40% vers Lemoigne / 60% vers Grelet",
        "Abstention différentielle Da Silva : 10% (ses électeurs qui ne reviennent pas)",
        "Participation globale T2 : stable par rapport au T1 (68-70%)"
    ]
    for item in hyp_items:
        story.append(Paragraph(f"&#8226; {item}",
            ParagraphStyle('', parent=styles['small'], leftIndent=5*mm)))

    story.append(Spacer(1, 5*mm))

    # Encadré final méthodologie
    methodo_final_text = (
        f"<b>En résumé</b> : nous partons des 17 bureaux de vote et de 4 élections nationales "
        "pour identifier les profils électoraux. Nous modélisons les transferts de voix par "
        "des lois de Dirichlet qui captent l'incertitude. Puis nous simulons "
        f"{NB_TIRAGES_TXT} scénarios possibles pour obtenir des probabilités de victoire "
        "et des fourchettes de résultats. Cette approche est analogue à celle des grands "
        "modèles prédictifs électoraux, adaptée au contexte municipal français."
    )
    methodo_final_data = [[Paragraph(methodo_final_text,
        ParagraphStyle('', fontSize=9, textColor=WHITE, leading=13))]]
    methodo_final_table = Table(methodo_final_data, colWidths=[page_w - 10*mm])
    methodo_final_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), DARK_NAVY),
        ('ROUNDEDCORNERS', [4, 4, 4, 4]),
        ('TOPPADDING', (0, 0), (-1, -1), 5*mm),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5*mm),
        ('LEFTPADDING', (0, 0), (-1, -1), 5*mm),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5*mm),
    ]))
    story.append(methodo_final_table)

    story.append(PageBreak())

    # ══════════════════════════════════════════════
    # ANNEXE C : MISE À JOUR BAYÉSIENNE EN TEMPS RÉEL
    # ══════════════════════════════════════════════

    story.append(ColorBar(page_w, 2*mm, GREY_MED))
    story.append(Spacer(1, 2*mm))
    story.append(Paragraph("Annexe C — Mise à jour bayésienne le soir du scrutin", styles['h1']))

    story.append(Paragraph(
        "Le modèle ne s'arrête pas à la projection statique publiée dans cette note. "
        "Une <b>application mobile</b> (progressive web app) permet de mettre à jour la projection "
        "<b>en temps réel</b> le soir du 22 mars, au fur et à mesure que les résultats tombent "
        "bureau par bureau.",
        styles['body']))

    story.append(Paragraph("C.1 Le principe : apprendre des premiers résultats", styles['h2']))

    story.append(Paragraph(
        "Le soir de l'élection, les 17 bureaux de vote ne publient pas leurs résultats "
        "au même moment. Dès qu'un bureau est dépouillé, ses chiffres sont saisis dans "
        "l'application. Le modèle utilise alors la <b>mise à jour bayésienne</b> pour "
        "affiner ses projections :",
        styles['body']))

    bayes_steps = [
        "<b>Avant tout résultat</b> : le modèle utilise les projections de cette note "
        f"({NB_TIRAGES_TXT} scénarios simulés). Probabilité de victoire Lemoigne : 93%.",
        "<b>Premier bureau dépouillé</b> : le résultat réel est comparé à ce que chacun "
        "des {NB_TIRAGES_TXT} scénarios avait prédit pour ce bureau. Les scénarios proches "
        "de la réalité gagnent du poids, les autres en perdent.",
        "<b>Deuxième bureau, troisième…</b> : à chaque nouveau résultat, les poids sont "
        "recalculés. La projection se précise de plus en plus. L'intervalle de confiance "
        "se resserre.",
        "<b>Après 5-6 bureaux</b> : la projection est généralement très fiable. "
        "Après 10 bureaux, elle est quasi certaine."
    ]
    for i, item in enumerate(bayes_steps):
        num_style = ParagraphStyle('Num', parent=styles['body'],
            leftIndent=8*mm, bulletIndent=0, spaceBefore=1.5*mm)
        story.append(Paragraph(f"<font color='#1565C0'><b>{i+1}.</b></font> {item}", num_style))

    story.append(Spacer(1, 3*mm))

    # Encadré analogie
    bayes_analogy = (
        "<b>Analogie</b> : imaginez que vous devinez le contenu d'un sac de billes "
        "sans le voir. Avant de regarder, vous avez une estimation initiale (le « prior »). "
        "Vous tirez une première bille : si elle est bleue, vous augmentez votre estimation "
        "qu'il y a beaucoup de billes bleues. Chaque nouvelle bille tirée affine votre "
        "estimation. C'est exactement ce que fait la mise à jour bayésienne avec les bureaux "
        "de vote : chaque résultat réel est une « bille tirée du sac » qui affine la projection."
    )
    bayes_analogy_data = [[Paragraph(bayes_analogy, ParagraphStyle('', fontSize=8.5, textColor=GREY_DARK, leading=12))]]
    bayes_analogy_table = Table(bayes_analogy_data, colWidths=[page_w - 10*mm])
    bayes_analogy_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), LIGHT_BLUE),
        ('ROUNDEDCORNERS', [4, 4, 4, 4]),
        ('TOPPADDING', (0, 0), (-1, -1), 3*mm),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3*mm),
        ('LEFTPADDING', (0, 0), (-1, -1), 4*mm),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4*mm),
    ]))
    story.append(bayes_analogy_table)
    story.append(Spacer(1, 4*mm))

    story.append(Paragraph("C.2 L'algorithme technique", styles['h2']))

    story.append(Paragraph(
        "Pour les lecteurs souhaitant comprendre le détail technique :",
        styles['body']))

    tech_items = [
        "<b>Vraisemblance gaussienne</b> : pour chaque scénario simulé, on calcule la probabilité "
        "d'observer le résultat réel du bureau, en supposant une erreur de modèle de ±4 points "
        "plus l'erreur d'échantillonnage binomiale.",
        "<b>Pondération</b> : les scénarios cohérents avec les résultats observés reçoivent un "
        "poids fort ; les scénarios incompatibles reçoivent un poids quasi nul. Les nouvelles "
        "probabilités de victoire sont calculées sur les scénarios pondérés.",
        "<b>Rééchantillonnage (SIR)</b> : lorsque trop peu de scénarios concentrent le poids "
        "(taille effective de l'échantillon &lt; N/4), un rééchantillonnage systématique est "
        "effectué pour maintenir la diversité des simulations.",
        "<b>Bureaux sentinelles</b> : l'application identifie 5 bureaux prioritaires "
        "(n° 03, 07, 11, 12 et 17) dont les résultats sont les plus informatifs pour affiner "
        "la projection. Ils sont mis en évidence dans l'interface pour être saisis en priorité."
    ]
    for i, item in enumerate(tech_items):
        num_style = ParagraphStyle('Num', parent=styles['body'],
            leftIndent=8*mm, bulletIndent=0, spaceBefore=1.5*mm)
        story.append(Paragraph(f"<font color='#1565C0'><b>{i+1}.</b></font> {item}", num_style))

    story.append(Spacer(1, 4*mm))

    story.append(Paragraph("C.3 L'application mobile — Captures d'écran", styles['h2']))

    story.append(Paragraph(
        "L'application est accessible sur smartphone (progressive web app, installable "
        "sans téléchargement). Voici les trois écrans principaux utilisés le soir du scrutin :",
        styles['body']))

    # Insérer les images mockup si elles existent
    mockup_paths = [
        os.path.join(OUTPUT_DIR, "mockup_soiree_grid.png"),
        os.path.join(OUTPUT_DIR, "mockup_soiree_saisie.png"),
        os.path.join(OUTPUT_DIR, "mockup_soiree_projection.png"),
    ]
    mockup_labels = [
        "Écran 1 — Grille des 17 bureaux de vote (les bureaux sentinelles sont signalés en priorité)",
        "Écran 2 — Saisie rapide des résultats d'un bureau (votants, blancs, nuls, voix par candidat)",
        "Écran 3 — Projection mise à jour en temps réel (probabilités et courbe de tendance)",
    ]
    for path, label in zip(mockup_paths, mockup_labels):
        if os.path.exists(path):
            try:
                img = Image(path, width=60*mm, height=100*mm)
                img_data = [[img]]
                img_table = Table(img_data, colWidths=[page_w])
                img_table.setStyle(TableStyle([
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ]))
                story.append(img_table)
            except Exception:
                pass
            story.append(Paragraph(f"<i>{label}</i>", styles['caption']))
            story.append(Spacer(1, 3*mm))
        else:
            story.append(Paragraph(f"<i>[{label}]</i>", styles['caption']))
            story.append(Spacer(1, 2*mm))

    # Encadré final
    bayes_final = (
        "<b>Intérêt opérationnel</b> : grâce à la mise à jour bayésienne, l'équipe Lemoigne "
        "peut connaître le résultat probable avec un haut degré de confiance dès que 5 à 6 bureaux "
        "sont dépouillés — soit environ 30 à 45 minutes avant la proclamation officielle. "
        "Ce temps d'avance permet de préparer la communication et d'anticiper les réactions."
    )
    bayes_final_data = [[Paragraph(bayes_final,
        ParagraphStyle('', fontSize=9, textColor=WHITE, leading=13))]]
    bayes_final_table = Table(bayes_final_data, colWidths=[page_w - 10*mm])
    bayes_final_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), DARK_NAVY),
        ('ROUNDEDCORNERS', [4, 4, 4, 4]),
        ('TOPPADDING', (0, 0), (-1, -1), 5*mm),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5*mm),
        ('LEFTPADDING', (0, 0), (-1, -1), 5*mm),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5*mm),
    ]))
    story.append(bayes_final_table)

    # Construction finale
    doc.build(story, onFirstPage=header_footer, onLaterPages=header_footer)
    print(f"PDF généré : {output_path}")
    return output_path


# ══════════════════════════════════════════════
# IMAGES PARTAGEABLES
# ══════════════════════════════════════════════

def generate_images():
    """Génère des images PNG partageables"""
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    from matplotlib.patches import FancyBboxPatch

    plt.rcParams['font.family'] = 'sans-serif'
    plt.rcParams['font.sans-serif'] = ['Segoe UI', 'Arial', 'Helvetica']

    def draw_flag_mpl(ax, cx, cy, w=0.28, h=0.18):
        """Dessine un mini drapeau français dans matplotlib."""
        from matplotlib.patches import Rectangle
        third = w / 3
        ax.add_patch(Rectangle((cx - w/2, cy - h/2), third, h, facecolor='#002395', edgecolor='none', zorder=5))
        ax.add_patch(Rectangle((cx - w/2 + third, cy - h/2), third, h, facecolor='white', edgecolor='none', zorder=5))
        ax.add_patch(Rectangle((cx - w/2 + 2*third, cy - h/2), third, h, facecolor='#ED2939', edgecolor='none', zorder=5))
        ax.add_patch(Rectangle((cx - w/2, cy - h/2), w, h, facecolor='none', edgecolor='#455A64', linewidth=0.5, zorder=6))

    dark_navy = '#1B2A4A'
    blue_accent = '#4FC3F7'
    col_l = '#1565C0'
    col_g = '#C62828'
    col_d = '#F9A825'

    # ── IMAGE 1 : Probabilité de victoire (carré, partage messagerie) ──
    fig, ax = plt.subplots(1, 1, figsize=(8, 8), facecolor=dark_navy)
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 10)
    ax.axis('off')

    ax.text(5, 9.2, 'ÉLECTIONS LA FLÈCHE 2026', ha='center', va='center',
            fontsize=14, color=blue_accent, fontweight='bold', family='sans-serif')
    ax.text(5, 8.6, 'PROBABILITÉ DE VICTOIRE — SECOND TOUR', ha='center', va='center',
            fontsize=11, color='#B0BEC5', family='sans-serif')

    ax.plot([1.5, 8.5], [8.2, 8.2], color=blue_accent, linewidth=2)

    ax.text(5, 6.5, '93%', ha='center', va='center',
            fontsize=90, color='white', fontweight='bold', family='sans-serif')
    ax.text(5, 5.0, 'probabilité de victoire', ha='center', va='center',
            fontsize=16, color='#B0BEC5', family='sans-serif')
    ax.text(5, 4.4, 'ROMAIN LEMOIGNE', ha='center', va='center',
            fontsize=20, color=blue_accent, fontweight='bold', family='sans-serif')
    draw_flag_mpl(ax, 2.55, 4.4, 0.35, 0.22)
    draw_flag_mpl(ax, 7.45, 4.4, 0.35, 0.22)

    ax.plot([2, 8], [3.7, 3.7], color='#37474F', linewidth=1)

    ax.text(3.5, 3.0, '7%', ha='center', va='center',
            fontsize=28, color=col_g, fontweight='bold')
    ax.text(3.5, 2.3, 'Grelet-Certenais', ha='center', va='center',
            fontsize=11, color='#B0BEC5')

    ax.text(6.5, 3.0, '<1%', ha='center', va='center',
            fontsize=28, color=col_d, fontweight='bold')
    ax.text(6.5, 2.3, 'Da Silva', ha='center', va='center',
            fontsize=11, color='#B0BEC5')

    ax.text(5, 1.3, f'Simulation stochastique — {NB_TIRAGES_TXT} scénarios', ha='center', va='center',
            fontsize=9, color='#78909C', style='italic')
    ax.text(5, 0.8, 'Inférence écologique sur 17 bureaux de vote x 4 scrutins nationaux',
            ha='center', va='center', fontsize=8, color='#546E7A', style='italic')

    path1 = os.path.join(OUTPUT_DIR, "img_probabilite_victoire.png")
    fig.savefig(path1, dpi=200, bbox_inches='tight', pad_inches=0.3, facecolor=dark_navy)
    plt.close(fig)
    print(f"Image 1 : {path1}")

    # ── IMAGE 2 : Scores attendus (horizontal) ──
    fig, ax = plt.subplots(1, 1, figsize=(10, 6), facecolor=dark_navy)
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 6)
    ax.axis('off')

    ax.text(5, 5.5, 'PROJECTION T2 — TRIANGULAIRE', ha='center', va='center',
            fontsize=14, color=blue_accent, fontweight='bold')
    ax.text(5, 5.0, 'Estimation centrale et fourchettes de confiance', ha='center', va='center',
            fontsize=10, color='#B0BEC5')

    candidates = [
        ('LEMOIGNE', 45.2, 44.0, 47.0, col_l),
        ('GRELET-C.', 41.4, 40.0, 44.0, col_g),
        ('DA SILVA', 13.4, 10.0, 15.0, col_d),
    ]

    y_positions = [3.8, 2.6, 1.4]
    bar_h = 0.6
    x_start = 2.5
    x_scale = 7.0 / 60.0

    for i, (name, pct, lo, hi, color) in enumerate(candidates):
        y = y_positions[i]
        ax.text(2.3, y, name, ha='right', va='center', fontsize=11, color='white', fontweight='bold')
        bar_bg = FancyBboxPatch((x_start, y - bar_h/2), 7.0, bar_h,
            boxstyle="round,pad=0.05", facecolor='#263238', edgecolor='none')
        ax.add_patch(bar_bg)
        bar_w = pct * x_scale
        bar_fill = FancyBboxPatch((x_start, y - bar_h/2), bar_w, bar_h,
            boxstyle="round,pad=0.05", facecolor=color, edgecolor='none', alpha=0.85)
        ax.add_patch(bar_fill)
        ci_x_lo = x_start + lo * x_scale
        ci_x_hi = x_start + hi * x_scale
        ax.plot([ci_x_lo, ci_x_hi], [y, y], color='white', linewidth=1.5, alpha=0.6)
        ax.plot([ci_x_lo, ci_x_lo], [y - 0.12, y + 0.12], color='white', linewidth=1.5, alpha=0.6)
        ax.plot([ci_x_hi, ci_x_hi], [y - 0.12, y + 0.12], color='white', linewidth=1.5, alpha=0.6)
        ax.text(x_start + bar_w + 0.15, y, f'{pct:.1f}%', ha='left', va='center',
                fontsize=14, color='white', fontweight='bold')
        ax.text(x_start + bar_w + 1.2, y, f'[{lo:.0f}-{hi:.0f}]', ha='left', va='center',
                fontsize=9, color='#90A4AE')

    ax.text(5, 0.5, 'Élections municipales La Flèche — 22 mars 2026',
            ha='center', va='center', fontsize=8, color='#546E7A', style='italic')

    path2 = os.path.join(OUTPUT_DIR, "img_scores_attendus.png")
    fig.savefig(path2, dpi=200, bbox_inches='tight', pad_inches=0.3, facecolor=dark_navy)
    plt.close(fig)
    print(f"Image 2 : {path2}")

    # ── IMAGE 3 : Le paradoxe (carré, pédagogique) ──
    fig, ax = plt.subplots(1, 1, figsize=(8, 8), facecolor=dark_navy)
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 10)
    ax.axis('off')

    ax.text(5, 9.3, 'LE PARADOXE DE LA TRIANGULAIRE', ha='center', va='center',
            fontsize=15, color=blue_accent, fontweight='bold')
    ax.text(5, 8.7, 'Pourquoi le maintien Da Silva favorise Lemoigne', ha='center', va='center',
            fontsize=11, color='#B0BEC5')

    ax.plot([1, 9], [8.3, 8.3], color=blue_accent, linewidth=1.5)

    box1 = FancyBboxPatch((0.5, 5.2), 4.0, 2.8,
        boxstyle="round,pad=0.15", facecolor='#263238', edgecolor='#455A64', linewidth=1)
    ax.add_patch(box1)
    ax.text(2.5, 7.6, 'DUEL (hypothétique)', ha='center', va='center',
            fontsize=10, color='#FF8A65', fontweight='bold')
    ax.text(2.5, 7.0, 'Lemoigne  52,8%', ha='center', va='center',
            fontsize=12, color=col_l, fontweight='bold')
    ax.text(2.5, 6.4, 'Grelet      47,2%', ha='center', va='center',
            fontsize=12, color=col_g, fontweight='bold')
    ax.text(2.5, 5.7, 'Grelet à 2,8 pts de 50%', ha='center', va='center',
            fontsize=9, color='#FF8A65', style='italic')

    box2 = FancyBboxPatch((5.5, 5.2), 4.0, 2.8,
        boxstyle="round,pad=0.15", facecolor='#1B3A2A', edgecolor='#43A047', linewidth=1.5)
    ax.add_patch(box2)
    ax.text(7.5, 7.6, 'TRIANGULAIRE (réelle)', ha='center', va='center',
            fontsize=10, color='#66BB6A', fontweight='bold')
    ax.text(7.5, 7.0, 'Lemoigne  45,2%', ha='center', va='center',
            fontsize=12, color=col_l, fontweight='bold')
    ax.text(7.5, 6.4, 'Grelet      41,4%', ha='center', va='center',
            fontsize=12, color=col_g, fontweight='bold')
    ax.text(7.5, 5.7, 'Grelet à 8,6 pts de 50%', ha='center', va='center',
            fontsize=9, color='#66BB6A', fontweight='bold')

    ax.annotate('', xy=(7.5, 4.9), xytext=(2.5, 4.9),
                arrowprops=dict(arrowstyle='->', color=blue_accent, lw=2))
    ax.text(5, 4.5, 'Plus de marge pour Lemoigne', ha='center', va='center',
            fontsize=10, color=blue_accent, fontweight='bold')

    reasons = [
        '1. Da Silva = « piège à voix » anti-Grelet',
        '2. Le front républicain est neutralisé',
        '3. Les centristes gardent leur candidat'
    ]
    for i, reason in enumerate(reasons):
        ax.text(5, 3.4 - i * 0.7, reason, ha='center', va='center',
                fontsize=11, color='white')

    ax.text(5, 0.8, "« Il n'est pas question de faire barrage ou non au RN »",
            ha='center', va='center', fontsize=9, color='#78909C', style='italic')
    ax.text(5, 0.3, '— Michel Da Silva, France Bleu Maine, 16 mars 2026',
            ha='center', va='center', fontsize=7, color='#546E7A')

    path3 = os.path.join(OUTPUT_DIR, "img_paradoxe_triangulaire.png")
    fig.savefig(path3, dpi=200, bbox_inches='tight', pad_inches=0.3, facecolor=dark_navy)
    plt.close(fig)
    print(f"Image 3 : {path3}")

    # ── IMAGE 4 : Synthèse compacte (format vertical 9:16) ──
    fig, ax = plt.subplots(1, 1, figsize=(6, 10.67), facecolor=dark_navy)
    ax.set_xlim(0, 6)
    ax.set_ylim(0, 10.67)
    ax.axis('off')

    ax.text(3, 10.2, 'LA FLÈCHE 2026', ha='center', va='center',
            fontsize=16, color=blue_accent, fontweight='bold')
    ax.text(3, 9.7, 'SECOND TOUR — 22 MARS', ha='center', va='center',
            fontsize=11, color='#B0BEC5')

    ax.plot([0.5, 5.5], [9.35, 9.35], color=blue_accent, linewidth=2)

    cards = [
        ('LEMOIGNE', '45,2%', '93%', col_l, 'En tête T1 (43,7%)'),
        ('GRELET-C.', '41,4%', '7%', col_g, 'Sortante (39,5%)'),
        ('DA SILVA', '13,4%', '<1%', col_d, 'Maintien (16,8%)'),
    ]

    y_start = 8.5
    for i, (name, score, prob, color, sub) in enumerate(cards):
        y = y_start - i * 2.2
        card = FancyBboxPatch((0.5, y - 0.8), 5.0, 1.8,
            boxstyle="round,pad=0.1", facecolor='#1E3250', edgecolor=color, linewidth=2)
        ax.add_patch(card)
        accent = FancyBboxPatch((0.5, y - 0.8), 0.15, 1.8,
            boxstyle="round,pad=0", facecolor=color, edgecolor='none')
        ax.add_patch(accent)
        ax.text(1.0, y + 0.5, name, ha='left', va='center',
                fontsize=13, color='white', fontweight='bold')
        if 'LEMOIGNE' in name:
            draw_flag_mpl(ax, 2.65, y + 0.5, 0.25, 0.16)
        ax.text(1.0, y - 0.1, sub, ha='left', va='center',
                fontsize=8, color='#90A4AE')
        ax.text(4.2, y + 0.5, score, ha='center', va='center',
                fontsize=22, color='white', fontweight='bold')
        ax.text(4.2, y - 0.15, f'P(victoire) = {prob}', ha='center', va='center',
                fontsize=8, color=color)

    insight_box = FancyBboxPatch((0.5, 0.8), 5.0, 2.2,
        boxstyle="round,pad=0.15", facecolor='#0D2137', edgecolor=blue_accent, linewidth=1)
    ax.add_patch(insight_box)
    ax.text(3, 2.6, 'ENSEIGNEMENT CLÉ', ha='center', va='center',
            fontsize=10, color=blue_accent, fontweight='bold')
    ax.text(3, 2.0, 'La triangulaire neutralise', ha='center', va='center',
            fontsize=10, color='white')
    ax.text(3, 1.5, 'le front républicain et protège', ha='center', va='center',
            fontsize=10, color='white')
    ax.text(3, 1.0, "l'avance de Lemoigne", ha='center', va='center',
            fontsize=10, color='white', fontweight='bold')

    ax.text(3, 0.3, f'Simulation stochastique — {NB_TIRAGES_TXT} scénarios',
            ha='center', va='center', fontsize=7, color='#546E7A', style='italic')

    path4 = os.path.join(OUTPUT_DIR, "img_synthese_story.png")
    fig.savefig(path4, dpi=200, bbox_inches='tight', pad_inches=0.2, facecolor=dark_navy)
    plt.close(fig)
    print(f"Image 4 : {path4}")

    # ── MOCKUPS MOBILE pour annexe bayésienne ──

    # Mockup 1 : Grille des bureaux
    fig, ax = plt.subplots(1, 1, figsize=(4, 7), facecolor='#0D1B2A')
    ax.set_xlim(0, 4)
    ax.set_ylim(0, 7)
    ax.axis('off')

    # Status bar
    ax.add_patch(FancyBboxPatch((0, 6.6), 4, 0.4, boxstyle="square", facecolor='#1B2838', edgecolor='none'))
    ax.text(2, 6.78, 'Soirée électorale — T2', ha='center', fontsize=9, color='white', fontweight='bold')

    ax.text(2, 6.3, 'Bureaux de vote', ha='center', fontsize=8, color='#B0BEC5')
    ax.text(2, 6.0, 'Sélectionnez un bureau pour saisir', ha='center', fontsize=6, color='#546E7A')

    # Grille 4x5 de bureaux
    colors_bv = ['#43A047', '#43A047', '#FF9800', '#43A047', '#43A047',
                 '#FF9800', '#43A047', '#43A047', '#43A047', '#455A64',
                 '#FF9800', '#455A64', '#455A64', '#455A64', '#455A64',
                 '#455A64', '#455A64']
    labels_bv = [f'{i+1:02d}' for i in range(17)]

    for i in range(17):
        row = i // 4
        col = i % 4
        x = 0.3 + col * 0.9
        y = 5.3 - row * 0.7
        c = colors_bv[i]
        box = FancyBboxPatch((x, y), 0.7, 0.55, boxstyle="round,pad=0.05",
            facecolor=c, edgecolor='none', alpha=0.85)
        ax.add_patch(box)
        ax.text(x + 0.35, y + 0.27, labels_bv[i], ha='center', va='center',
                fontsize=8, color='white', fontweight='bold')
        # Sentinelle marker
        if labels_bv[i] in ['03', '07', '11', '12', '17']:
            ax.text(x + 0.62, y + 0.48, '*', ha='center', fontsize=7, color='#FFD54F', fontweight='bold')

    ax.text(2, 1.8, 'Légende :', ha='center', fontsize=6, color='#B0BEC5')
    ax.add_patch(FancyBboxPatch((0.5, 1.3), 0.3, 0.2, boxstyle="round,pad=0.02", facecolor='#43A047', edgecolor='none'))
    ax.text(1.0, 1.37, 'Saisi', fontsize=6, color='#B0BEC5')
    ax.add_patch(FancyBboxPatch((1.5, 1.3), 0.3, 0.2, boxstyle="round,pad=0.02", facecolor='#FF9800', edgecolor='none'))
    ax.text(2.0, 1.37, 'Sentinelle', fontsize=6, color='#FFD54F')
    ax.add_patch(FancyBboxPatch((2.7, 1.3), 0.3, 0.2, boxstyle="round,pad=0.02", facecolor='#455A64', edgecolor='none'))
    ax.text(3.2, 1.37, 'En attente', fontsize=6, color='#B0BEC5')

    # Barre progression
    ax.add_patch(FancyBboxPatch((0.3, 0.7), 3.4, 0.3, boxstyle="round,pad=0.03", facecolor='#263238', edgecolor='none'))
    ax.add_patch(FancyBboxPatch((0.3, 0.7), 3.4 * 8/17, 0.3, boxstyle="round,pad=0.03", facecolor='#4FC3F7', edgecolor='none'))
    ax.text(2, 0.83, '8 / 17 bureaux', ha='center', fontsize=7, color='white', fontweight='bold')

    path_m1 = os.path.join(OUTPUT_DIR, "mockup_soiree_grid.png")
    fig.savefig(path_m1, dpi=200, bbox_inches='tight', pad_inches=0.1, facecolor='#0D1B2A')
    plt.close(fig)
    print(f"Mockup 1 : {path_m1}")

    # Mockup 2 : Saisie d'un bureau
    fig, ax = plt.subplots(1, 1, figsize=(4, 7), facecolor='#0D1B2A')
    ax.set_xlim(0, 4)
    ax.set_ylim(0, 7)
    ax.axis('off')

    ax.add_patch(FancyBboxPatch((0, 6.6), 4, 0.4, boxstyle="square", facecolor='#1B2838', edgecolor='none'))
    ax.text(2, 6.78, 'Bureau n  07  * Sentinelle', ha='center', fontsize=9, color='#FFD54F', fontweight='bold')

    fields = [
        ('Inscrits', '664', '#455A64'),
        ('Votants', '482', '#455A64'),
        ('Blancs', '8', '#455A64'),
        ('Nuls', '3', '#455A64'),
        ('Lemoigne', '206', col_l),
        ('Da Silva', '72', col_d),
        ('Grelet-C.', '193', col_g),
    ]

    y_start = 6.1
    for i, (label, val, color) in enumerate(fields):
        y = y_start - i * 0.65
        ax.text(0.4, y + 0.05, label, fontsize=8, color='#B0BEC5')
        box = FancyBboxPatch((2.0, y - 0.12), 1.6, 0.4, boxstyle="round,pad=0.05",
            facecolor='#1E3250', edgecolor=color, linewidth=1.5 if i >= 4 else 0.5)
        ax.add_patch(box)
        ax.text(2.8, y + 0.05, val, ha='center', fontsize=10, color='white', fontweight='bold')

    # Bouton enregistrer
    btn = FancyBboxPatch((0.8, 1.2), 2.4, 0.5, boxstyle="round,pad=0.08",
        facecolor='#43A047', edgecolor='none')
    ax.add_patch(btn)
    ax.text(2, 1.43, '✓ Enregistrer', ha='center', fontsize=10, color='white', fontweight='bold')

    # Contrôle
    ax.text(2, 0.7, 'Exprimes : 471  |  Total voix : 471  OK', ha='center', fontsize=7, color='#66BB6A')

    path_m2 = os.path.join(OUTPUT_DIR, "mockup_soiree_saisie.png")
    fig.savefig(path_m2, dpi=200, bbox_inches='tight', pad_inches=0.1, facecolor='#0D1B2A')
    plt.close(fig)
    print(f"Mockup 2 : {path_m2}")

    # Mockup 3 : Projection en temps réel
    fig, ax = plt.subplots(1, 1, figsize=(4, 7), facecolor='#0D1B2A')
    ax.set_xlim(0, 4)
    ax.set_ylim(0, 7)
    ax.axis('off')

    ax.add_patch(FancyBboxPatch((0, 6.6), 4, 0.4, boxstyle="square", facecolor='#1B2838', edgecolor='none'))
    ax.text(2, 6.78, 'Projection en direct — 8/17 BV', ha='center', fontsize=9, color='white', fontweight='bold')

    # Probabilité mise à jour
    ax.text(2, 6.15, 'Probabilité de victoire', ha='center', fontsize=8, color='#B0BEC5')
    ax.text(2, 5.5, '96%', ha='center', fontsize=40, color='#4FC3F7', fontweight='bold')
    ax.text(2, 5.1, 'LEMOIGNE', ha='center', fontsize=12, color='white', fontweight='bold')

    # Barres de score
    bar_data = [('Lemoigne', 46.1, col_l), ('Grelet-C.', 40.8, col_g), ('Da Silva', 13.1, col_d)]
    for i, (name, pct, color) in enumerate(bar_data):
        y = 4.3 - i * 0.65
        ax.text(0.3, y + 0.05, name, fontsize=7, color='#B0BEC5')
        ax.add_patch(FancyBboxPatch((1.8, y - 0.05), 1.8, 0.3, boxstyle="round,pad=0.03",
            facecolor='#263238', edgecolor='none'))
        ax.add_patch(FancyBboxPatch((1.8, y - 0.05), 1.8 * pct/60, 0.3, boxstyle="round,pad=0.03",
            facecolor=color, edgecolor='none', alpha=0.8))
        ax.text(1.8 + 1.8 * pct/60 + 0.1, y + 0.07, f'{pct}%', fontsize=7,
                color='white', fontweight='bold')

    # Mini graphe tendance
    ax.add_patch(FancyBboxPatch((0.2, 0.8), 3.6, 1.8, boxstyle="round,pad=0.08",
        facecolor='#1E3250', edgecolor='#455A64', linewidth=0.5))
    ax.text(2, 2.35, 'Évolution de la projection', ha='center', fontsize=7, color='#B0BEC5')

    # Courbe simplifiée
    import numpy as np
    bv_x = np.array([0, 1, 2, 3, 4, 5, 6, 7])
    lem_y_vals = np.array([45.2, 44.8, 45.5, 46.2, 45.8, 46.0, 46.3, 46.1])
    gre_y_vals = np.array([41.4, 41.8, 41.2, 40.6, 41.0, 40.8, 40.5, 40.8])

    x_plot = 0.5 + bv_x * 0.4
    lem_y_plot = 1.0 + (lem_y_vals - 40) * 0.15
    gre_y_plot = 1.0 + (gre_y_vals - 40) * 0.15

    ax.plot(x_plot, lem_y_plot, color=col_l, linewidth=2, marker='o', markersize=3)
    ax.plot(x_plot, gre_y_plot, color=col_g, linewidth=2, marker='o', markersize=3)
    ax.text(0.5, 0.9, '0 BV', fontsize=5, color='#546E7A')
    ax.text(3.3, 0.9, '8 BV', fontsize=5, color='#546E7A')

    path_m3 = os.path.join(OUTPUT_DIR, "mockup_soiree_projection.png")
    fig.savefig(path_m3, dpi=200, bbox_inches='tight', pad_inches=0.1, facecolor='#0D1B2A')
    plt.close(fig)
    print(f"Mockup 3 : {path_m3}")

    return [path1, path2, path3, path4, path_m1, path_m2, path_m3]


if __name__ == '__main__':
    print("=" * 60)
    print("Génération de la note de synthèse T2 — La Flèche 2026")
    print(f"Simulation : {NB_TIRAGES_TXT} tirages")
    print("=" * 60)

    pdf_path = build_pdf()
    print()
    image_paths = generate_images()

    print()
    print("=" * 60)
    print("Fichiers générés :")
    print(f"  PDF  : {pdf_path}")
    for p in image_paths:
        print(f"  IMG  : {p}")
    print("=" * 60)
