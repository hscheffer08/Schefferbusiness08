import jsPDF from 'jspdf';
import type { MatchResult } from '@/types';
import { getSubScoreValue, getSubScoreLabel, getStudentProfileAttributes, getCompatibilityBand, type MatchingData } from '@/lib/matching-engine';
import type { AnswerMap } from '@/types';
import type { DatabaseData } from '@/lib/api';

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 18;
const CONTENT_W = PAGE_W - MARGIN * 2;

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

const COLORS = {
  ink: hexToRgb('#0a0e1a'),
  brand: hexToRgb('#3b82f6'),
  accent: hexToRgb('#22d3ee'),
  ink100: hexToRgb('#f1f5f9'),
  ink300: hexToRgb('#cbd5e1'),
  ink400: hexToRgb('#94a3b8'),
  ink500: hexToRgb('#64748b'),
  ink700: hexToRgb('#334155'),
  ink800: hexToRgb('#1e293b'),
  ink900: hexToRgb('#0f172a'),
  white: hexToRgb('#ffffff'),
  amber: hexToRgb('#f59e0b'),
  green: hexToRgb('#22c55e'),
};

export function generateResultsPDF(
  ranked: MatchResult[],
  studentProfile: { name: string; score: number }[],
  answers: AnswerMap,
  dbData: DatabaseData,
  userName?: string | null
): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const topMatch = ranked[0];

  doc.setFillColor(...COLORS.ink900);
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F');

  doc.setFillColor(...COLORS.brand);
  doc.rect(0, 0, PAGE_W, 1.5, 'F');
  doc.setFillColor(...COLORS.accent);
  doc.rect(0, 1.5, PAGE_W * 0.6, 0.8, 'F');

  doc.setTextColor(...COLORS.ink100);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.text('Conectaê', MARGIN, 30);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.ink400);
  doc.text('Relatório de Compatibilidade', MARGIN, 38);

  doc.setFontSize(9);
  doc.setTextColor(...COLORS.ink500);
  doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`, MARGIN, 44);

  if (userName) {
    doc.setFontSize(11);
    doc.setTextColor(...COLORS.ink300);
    doc.text(`Perfil: ${userName}`, MARGIN, 50);
  }

  const boxY = 62;
  const boxH = 88;
  doc.setFillColor(...COLORS.ink800);
  doc.roundedRect(MARGIN, boxY, CONTENT_W, boxH, 4, 4, 'F');

  doc.setFillColor(...COLORS.accent);
  doc.roundedRect(MARGIN, boxY, 2, boxH, 1, 1, 'F');

  doc.setFillColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
  doc.roundedRect(MARGIN + 8, boxY + 8, 28, 8, 2, 2, 'F');
  doc.setTextColor(...COLORS.ink900);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('MATCH #1', MARGIN + 10, boxY + 13);

  doc.setTextColor(...COLORS.ink100);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  const uniName = doc.splitTextToSize(topMatch.university.name, CONTENT_W - 16);
  doc.text(uniName, MARGIN + 8, boxY + 26);

  if (topMatch.university.location) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.ink400);
    doc.text(topMatch.university.location, MARGIN + 8, boxY + 26 + uniName.length * 8 + 2);
  }

  const band = getCompatibilityBand(topMatch.overallScore);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(36);
  doc.setTextColor(...hexToRgb(band.color));
  doc.text(`${topMatch.overallScore}%`, MARGIN + 8, boxY + boxH - 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.ink400);
  doc.text(`${band.label} de compatibilidade`, MARGIN + 8, boxY + boxH - 8);

  if (topMatch.university.positioning) {
    const posY = boxY + boxH + 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.ink300);
    const posLines = doc.splitTextToSize(topMatch.university.positioning, CONTENT_W);
    const trimmedLines = posLines.slice(0, 4);
    doc.text(trimmedLines, MARGIN, posY);
  }

  let reasonsY = boxY + boxH + 32;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.brand);
  doc.text('Por que combina com você', MARGIN, reasonsY);
  reasonsY += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.ink300);
  topMatch.topReasons.slice(0, 3).forEach((reason, i) => {
    const lines = doc.splitTextToSize(`${i + 1}. ${reason}`, CONTENT_W - 4);
    doc.text(lines, MARGIN, reasonsY);
    reasonsY += lines.length * 5 + 2;
  });

  doc.addPage();
  doc.setFillColor(...COLORS.ink900);
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F');

  doc.setTextColor(...COLORS.ink100);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Ranking Completo', MARGIN, 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.ink500);
  doc.text(`${ranked.length} faculdades analisadas`, MARGIN, 28);

  let y = 38;
  ranked.forEach((result, i) => {
    if (y > PAGE_H - 30) {
      doc.addPage();
      doc.setFillColor(...COLORS.ink900);
      doc.rect(0, 0, PAGE_W, PAGE_H, 'F');
      y = 20;
    }

    const r = result;
    const bandR = getCompatibilityBand(r.overallScore);

    if (i % 2 === 0) {
      doc.setFillColor(...COLORS.ink800);
      doc.rect(MARGIN, y - 5, CONTENT_W, 18, 'F');
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...COLORS.ink400);
    doc.text(`${i + 1}`, MARGIN + 3, y + 4);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.ink100);
    const nameLines = doc.splitTextToSize(r.university.name, 90);
    doc.text(nameLines[0], MARGIN + 10, y + 4);

    if (r.university.location) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...COLORS.ink500);
      doc.text(r.university.location, MARGIN + 10, y + 9);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...hexToRgb(bandR.color));
    doc.text(`${r.overallScore}%`, PAGE_W - MARGIN - 22, y + 5);

    const barW = 40;
    const barX = PAGE_W - MARGIN - 22;
    doc.setFillColor(...COLORS.ink800);
    doc.roundedRect(barX, y + 7, barW, 2.5, 1, 1, 'F');
    doc.setFillColor(...hexToRgb(bandR.color));
    doc.roundedRect(barX, y + 7, (barW * r.overallScore) / 100, 2.5, 1, 1, 'F');

    y += 18;
  });

  if (studentProfile.length > 0) {
    doc.addPage();
    doc.setFillColor(...COLORS.ink900);
    doc.rect(0, 0, PAGE_W, PAGE_H, 'F');

    doc.setTextColor(...COLORS.ink100);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Seu Perfil', MARGIN, 22);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.ink500);
    doc.text('Atributos calculados a partir das suas respostas', MARGIN, 28);

    y = 40;
    studentProfile.forEach((attr) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.ink300);
      doc.text(attr.name, MARGIN, y);

      const barX = MARGIN + 60;
      const barW = CONTENT_W - 60 - 14;
      doc.setFillColor(...COLORS.ink800);
      doc.roundedRect(barX, y - 3.5, barW, 3, 1, 1, 'F');
      doc.setFillColor(...COLORS.brand);
      doc.roundedRect(barX, y - 3.5, (barW * attr.score) / 100, 3, 1, 1, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.ink400);
      doc.text(`${attr.score}`, PAGE_W - MARGIN - 2, y, { align: 'right' });

      y += 10;
    });
  }

  doc.addPage();
  doc.setFillColor(...COLORS.ink900);
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F');

  doc.setTextColor(...COLORS.ink100);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Análise Detalhada — Top 3', MARGIN, 22);

  y = 34;
  const subscores = ['academic_fit', 'career_fit', 'entrepreneurship_fit', 'cultural_fit', 'international_fit', 'learning_style_fit'];

  ranked.slice(0, 3).forEach((result, i) => {
    if (y > PAGE_H - 50) {
      doc.addPage();
      doc.setFillColor(...COLORS.ink900);
      doc.rect(0, 0, PAGE_W, PAGE_H, 'F');
      y = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...COLORS.accent);
    doc.text(`${i + 1}. ${result.university.name}`, MARGIN, y);
    y += 7;

    subscores.forEach((sub) => {
      const value = getSubScoreValue(result, sub);
      const label = getSubScoreLabel(sub);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.ink400);
      doc.text(label, MARGIN, y);

      const barX = MARGIN + 50;
      const barW = CONTENT_W - 50 - 14;
      doc.setFillColor(...COLORS.ink800);
      doc.roundedRect(barX, y - 3, barW, 2.5, 1, 1, 'F');
      doc.setFillColor(...COLORS.brand);
      doc.roundedRect(barX, y - 3, (barW * value) / 100, 2.5, 1, 1, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(...COLORS.ink500);
      doc.text(`${value}%`, PAGE_W - MARGIN - 2, y, { align: 'right' });

      y += 6;
    });

    y += 3;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.amber);
    doc.text('Ponto de atenção:', MARGIN, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.ink400);
    const mismatchLines = doc.splitTextToSize(result.mismatchPoint, CONTENT_W);
    doc.text(mismatchLines.slice(0, 3), MARGIN, y);
    y += mismatchLines.slice(0, 3).length * 5 + 8;
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.ink500);
  doc.text('Conectaê — Este relatório mede compatibilidade de perfil, não probabilidade de aprovação.', MARGIN, PAGE_H - 10);

  doc.save(`Conectae-Relatorio-${new Date().toISOString().slice(0, 10)}.pdf`);
}
