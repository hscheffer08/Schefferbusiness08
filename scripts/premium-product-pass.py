from pathlib import Path

home_path = Path('src/components/CourseHome.tsx')
home = home_path.read_text()

old = "import { ArrowRight, BarChart3, BookOpenCheck, Brain, Camera, CheckCircle2, Compass, FileText, GraduationCap, Sparkles, Target, Trophy } from 'lucide-react';\n"
new = old + "import CourseDataProof from '@/components/CourseDataProof';\n"
if "CourseDataProof" not in home:
    assert old in home
    home = home.replace(old, new, 1)

marker = "        <section className=\"border-y border-white/5 bg-[#041027]/75\">"
if "<CourseDataProof />" not in home:
    assert marker in home
    home = home.replace(marker, "        <CourseDataProof />\n\n" + marker, 1)

# Upgrade the hero trust line without changing any routes or CTAs.
old = """            <div className=\"mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold text-[#8da5c5]\">\n              <span className=\"inline-flex items-center gap-1.5\"><CheckCircle2 className=\"h-4 w-4 text-emerald-300\" />Plano salvo na sua conta</span>\n              <span className=\"inline-flex items-center gap-1.5\"><CheckCircle2 className=\"h-4 w-4 text-emerald-300\" />Metas por prova</span>\n              <span className=\"inline-flex items-center gap-1.5\"><CheckCircle2 className=\"h-4 w-4 text-emerald-300\" />Histórico de desempenho</span>\n            </div>"""
new = """            <div className=\"mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold text-[#8da5c5]\">\n              <span className=\"inline-flex items-center gap-1.5\"><CheckCircle2 className=\"h-4 w-4 text-emerald-300\" />Plano salvo na sua conta</span>\n              <span className=\"inline-flex items-center gap-1.5\"><CheckCircle2 className=\"h-4 w-4 text-emerald-300\" />Metas por prova e curso</span>\n              <span className=\"inline-flex items-center gap-1.5\"><CheckCircle2 className=\"h-4 w-4 text-emerald-300\" />Fontes oficiais visíveis</span>\n              <span className=\"inline-flex items-center gap-1.5\"><CheckCircle2 className=\"h-4 w-4 text-emerald-300\" />Histórico de desempenho</span>\n            </div>"""
if old in home:
    home = home.replace(old, new, 1)

home_path.write_text(home)

gate_path = Path('src/components/AdmissionsPlannerGate.tsx')
gate = gate_path.read_text()
old = "import OfficialExamReviewV2 from '@/components/OfficialExamReviewV2';\n"
new = old + "import CourseDataProof from '@/components/CourseDataProof';\n"
if "CourseDataProof" not in gate:
    assert old in gate
    gate = gate.replace(old, new, 1)

marker = """    <div className=\"fixed bottom-[76px] right-3 z-[85] flex flex-col gap-2 md:bottom-5 md:right-5\">"""
if "<CourseDataProof compact />" not in gate:
    assert marker in gate
    gate = gate.replace(marker, "    <CourseDataProof compact />\n\n" + marker, 1)

gate_path.write_text(gate)
print('premium product proof layer integrated')
