import { jsPDF } from 'jspdf';

export type PdfQuestion = {
  area: string;
  skill_name: string;
  difficulty: number;
  prompt: string;
  option_a: string | null;
  option_b: string | null;
  option_c: string | null;
  option_d: string | null;
  option_e: string | null;
  correct_option: string | null;
  explanation: string | null;
};

export type PdfWeek = {
  week: number;
  phase: string;
  focus: string;
  secondary: string;
  checkpoint: string;
  hours: number;
  skills: string[];
  tasks: string[];
  questions: PdfQuestion[];
};

type Args = {
  course: string;
  university: string;
  exam: string;
  readiness: number;
  weeklyHours: number;
  weeks: PdfWeek[];
  singleWeek?: number;
};

const NAVY: [number, number, number] = [8, 17, 31];
const CYAN: [number, number, number] = [33, 202, 230];
const PURPLE: [number, number, number] = [139, 92, 246];
const PALE: [number, number, number] = [241, 245, 249];
const SLATE: [number, number, number] = [71, 85, 105];
const GREEN: [number, number, number] = [16, 185, 129];

function pageHeader(doc: jsPDF, label: string) {
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, 210, 18, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('CONECTAÊ  /  PLANO DE APROVAÇÃO', 14, 11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(165, 243, 252);
  doc.text(label.toUpperCase(), 196, 11, { align: 'right' });
}

function footer(doc: jsPDF, page: number) {
  doc.setDrawColor(226, 232, 240);
  doc.line(14, 284, 196, 284);
  doc.setTextColor(...SLATE);
  doc.setFontSize(8);
  doc.text('Material personalizado - revise suas metas após cada simulado.', 14, 290);
  doc.text(String(page), 196, 290, { align: 'right' });
}

function pill(doc: jsPDF, x: number, y: number, text: string, color: [number, number, number]) {
  const w = Math.max(24, doc.getTextWidth(text) + 10);
  doc.setFillColor(...color);
  doc.roundedRect(x, y - 5, w, 8, 4, 4, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text(text, x + 5, y);
  return w;
}

function visual(doc: jsPDF, area: string, x: number, y: number, w = 44, h = 31) {
  const a = area.toLowerCase();
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(x, y, w, h, 4, 4, 'FD');

  if (a.includes('bio') || a.includes('natureza')) {
    doc.setDrawColor(...CYAN);
    doc.setLineWidth(1.1);
    doc.ellipse(x + 22, y + 15.5, 13, 9);
    doc.setFillColor(224, 242, 254);
    doc.circle(x + 22, y + 15.5, 4.5, 'FD');
    doc.setDrawColor(...PURPLE);
    doc.line(x + 10, y + 10, x + 16, y + 13);
    doc.line(x + 30, y + 18, x + 36, y + 22);
    doc.line(x + 15, y + 22, x + 18, y + 19);
  } else if (a.includes('quím')) {
    doc.setDrawColor(...PURPLE);
    doc.setLineWidth(1);
    const pts = [[13, 17], [21, 10], [30, 15], [28, 24], [18, 25]];
    pts.forEach(([px, py], i) => {
      doc.circle(x + px, y + py, 2.4, 'S');
      const next = pts[(i + 1) % pts.length];
      doc.line(x + px + 2, y + py, x + next[0] - 2, y + next[1]);
    });
  } else if (a.includes('fís') || a.includes('ópt')) {
    doc.setDrawColor(...CYAN);
    doc.line(x + 5, y + 22, x + 39, y + 22);
    doc.setDrawColor(...PURPLE);
    for (let i = 0; i < 30; i++) {
      const x1 = x + 6 + i;
      const yy = y + 15 + Math.sin(i / 3) * 5;
      if (i > 0) {
        const prev = y + 15 + Math.sin((i - 1) / 3) * 5;
        doc.line(x1 - 1, prev, x1, yy);
      }
    }
  } else if (a.includes('mat')) {
    doc.setDrawColor(...SLATE);
    doc.line(x + 8, y + 25, x + 38, y + 25);
    doc.line(x + 10, y + 28, x + 10, y + 5);
    doc.setDrawColor(...CYAN);
    let prevX = x + 10, prevY = y + 24;
    for (let i = 1; i <= 25; i++) {
      const xx = x + 10 + i;
      const yy = y + 24 - (i * i) / 38;
      doc.line(prevX, prevY, xx, yy);
      prevX = xx; prevY = yy;
    }
  } else if (a.includes('ingl') || a.includes('port') || a.includes('ling')) {
    doc.setFillColor(224, 242, 254);
    doc.roundedRect(x + 7, y + 7, 30, 18, 3, 3, 'F');
    doc.setDrawColor(...CYAN);
    doc.line(x + 12, y + 12, x + 32, y + 12);
    doc.line(x + 12, y + 16, x + 29, y + 16);
    doc.line(x + 12, y + 20, x + 34, y + 20);
  } else if (a.includes('lit')) {
    doc.setFillColor(237, 233, 254);
    doc.roundedRect(x + 8, y + 6, 13, 20, 2, 2, 'F');
    doc.roundedRect(x + 23, y + 6, 13, 20, 2, 2, 'F');
    doc.setDrawColor(...PURPLE);
    doc.line(x + 22, y + 6, x + 22, y + 26);
    doc.line(x + 11, y + 11, x + 18, y + 11);
    doc.line(x + 26, y + 11, x + 33, y + 11);
  } else {
    doc.setFillColor(224, 242, 254);
    doc.circle(x + 22, y + 15, 8, 'F');
    doc.setFillColor(...CYAN);
    doc.circle(x + 22, y + 15, 3, 'F');
  }
}

function safeLines(doc: jsPDF, text: string, width: number) {
  return doc.splitTextToSize(text.replace(/\s+/g, ' ').trim(), width) as string[];
}

function addAnswerKey(doc: jsPDF, questions: PdfQuestion[], title: string, pageNo: number) {
  doc.addPage();
  pageHeader(doc, 'Gabarito comentado');
  doc.setTextColor(...NAVY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(title, 14, 32);
  doc.setFontSize(9);
  doc.setTextColor(...SLATE);
  doc.text('Abra somente depois de responder as questões.', 14, 39);
  let y = 50;
  questions.forEach((q, i) => {
    const explanation = q.explanation || 'Revise o conteúdo e compare a justificativa com seu raciocínio.';
    const lines = safeLines(doc, `${i + 1}. ${q.correct_option ? `Resposta ${q.correct_option}. ` : 'Resposta discursiva. '}${explanation}`, 174);
    const h = 9 + lines.length * 4.4;
    if (y + h > 276) {
      footer(doc, pageNo++);
      doc.addPage();
      pageHeader(doc, 'Gabarito comentado');
      y = 31;
    }
    doc.setFillColor(240, 253, 250);
    doc.setDrawColor(167, 243, 208);
    doc.roundedRect(14, y, 182, h, 4, 4, 'FD');
    doc.setTextColor(...GREEN);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(q.area.toUpperCase(), 19, y + 7);
    doc.setTextColor(...NAVY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(lines, 19, y + 14);
    y += h + 5;
  });
  footer(doc, pageNo);
}

export function downloadPremiumStudyPdf(args: Args) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const selectedWeeks = args.singleWeek == null ? args.weeks : args.weeks.filter(w => w.week === args.singleWeek);
  let pageNo = 1;

  doc.setFillColor(...NAVY);
  doc.rect(0, 0, 210, 297, 'F');
  doc.setFillColor(13, 148, 136);
  doc.circle(175, 42, 42, 'F');
  doc.setFillColor(109, 40, 217);
  doc.circle(30, 267, 55, 'F');
  doc.setTextColor(165, 243, 252);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('CONECTAÊ INTELLIGENCE', 16, 28);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.text('Plano de Aprovação', 16, 48);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'normal');
  doc.text(safeLines(doc, `${args.course} - ${args.university}`, 132), 16, 60);
  doc.setTextColor(203, 213, 225);
  doc.setFontSize(10);
  doc.text(args.exam, 16, 79);
  pill(doc, 16, 95, `${args.readiness}% prontidão`, CYAN);
  pill(doc, 63, 95, `${args.weeklyHours}h/semana`, PURPLE);
  doc.setTextColor(226, 232, 240);
  doc.setFontSize(10);
  doc.text('O que este PDF contém', 16, 120);
  const bullets = ['Roteiro semanal por prioridade', 'Conteúdos e habilidades da semana', 'Questões completas com alternativas', 'Espaço para resolver', 'Gabarito comentado separado'];
  bullets.forEach((b, i) => {
    doc.setFillColor(...CYAN); doc.circle(19, 132 + i * 10, 1.4, 'F');
    doc.setTextColor(241, 245, 249); doc.text(b, 25, 134 + i * 10);
  });
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(8.5);
  doc.text('Gerado a partir do seu curso, faculdade, desempenho e prioridades atuais.', 16, 278);

  for (const week of selectedWeeks) {
    doc.addPage(); pageNo++;
    pageHeader(doc, `Semana ${week.week}`);
    doc.setTextColor(...NAVY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(23);
    doc.text(`Semana ${week.week}`, 14, 34);
    doc.setFontSize(10);
    doc.setTextColor(...PURPLE);
    doc.text(week.phase.toUpperCase(), 14, 42);
    visual(doc, week.focus, 151, 28, 45, 31);

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, 51, 182, 30, 5, 5, 'FD');
    doc.setTextColor(...NAVY);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('FOCO PRINCIPAL', 20, 60);
    doc.setFontSize(14);
    doc.text(week.focus, 20, 68);
    doc.setFontSize(8.5);
    doc.setTextColor(...SLATE);
    doc.text(`Secundário: ${week.secondary}  |  Carga: ${week.hours}h  |  Checkpoint: ${week.checkpoint}`, 20, 76);

    let y = 91;
    doc.setTextColor(...NAVY);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.text('Habilidades-alvo', 14, y); y += 6;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...SLATE);
    week.skills.slice(0, 5).forEach(skill => { const lines = safeLines(doc, `• ${skill}`, 176); doc.text(lines, 18, y); y += lines.length * 4.4 + 1; });
    y += 2;
    doc.setTextColor(...NAVY); doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.text('Roteiro da semana', 14, y); y += 6;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...SLATE);
    week.tasks.forEach(task => { const lines = safeLines(doc, `□ ${task}`, 176); doc.text(lines, 18, y); y += lines.length * 4.4 + 1; });
    footer(doc, pageNo);

    const questionStart = week.questions.slice(0, 8);
    questionStart.forEach((q, idx) => {
      doc.addPage(); pageNo++;
      pageHeader(doc, `Semana ${week.week} - Questão ${idx + 1}`);
      visual(doc, q.area, 151, 27, 45, 31);
      pill(doc, 14, 33, q.area, CYAN);
      pill(doc, 14, 44, `Dificuldade ${q.difficulty}/5`, PURPLE);
      doc.setTextColor(...NAVY);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.text(q.skill_name, 14, 57);
      const prompt = safeLines(doc, `${idx + 1}. ${q.prompt}`, 180);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(11); doc.text(prompt, 14, 70);
      let qy = 70 + prompt.length * 5.2 + 6;
      const opts: Array<[string, string | null]> = [['A',q.option_a],['B',q.option_b],['C',q.option_c],['D',q.option_d],['E',q.option_e]];
      opts.filter(([,v]) => v).forEach(([letter, value]) => {
        const lines = safeLines(doc, `${letter}) ${value}`, 170);
        doc.setFillColor(248, 250, 252); doc.setDrawColor(226, 232, 240);
        const hh = Math.max(10, 5 + lines.length * 4.6);
        doc.roundedRect(14, qy - 5, 182, hh, 3, 3, 'FD');
        doc.setTextColor(...NAVY); doc.setFontSize(9.5); doc.text(lines, 19, qy + 1);
        qy += hh + 4;
      });
      doc.setTextColor(...SLATE); doc.setFontSize(8.5); doc.text('Seu raciocínio / cálculo:', 14, 244);
      doc.setDrawColor(203, 213, 225);
      for (let ly = 251; ly <= 273; ly += 7) doc.line(14, ly, 196, ly);
      footer(doc, pageNo);
    });

    addAnswerKey(doc, questionStart, `Semana ${week.week} - Gabarito comentado`, ++pageNo);
  }

  doc.save(`conectae-plano-premium-${args.singleWeek ? `semana-${args.singleWeek}` : 'completo'}.pdf`);
}
