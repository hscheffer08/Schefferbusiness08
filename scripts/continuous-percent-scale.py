from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# Area questionnaire: replace discrete 1-5 buttons with continuous 0-100 input.
portal_path = ROOT / 'src/components/AreaMatchPortal.tsx'
portal = portal_path.read_text(encoding='utf-8')
old = '''<div className="grid grid-cols-5 gap-2 md:gap-3 mb-3">{[1,2,3,4,5].map(n=><button key={n} onClick={()=>setAnswers({...answers,[q.id]:n})} className={`h-16 md:h-20 rounded-2xl border font-black text-xl transition-all ${value===n?'border-cyan-300/45 bg-cyan-300/15 text-cyan-100 scale-[1.03]':'border-white/10 bg-white/[0.035] text-ink-400'}`}>{n}</button>)}</div><div className="flex justify-between text-xs text-ink-500 mb-3"><span>{q.low}</span><span>{q.high}</span></div>'''
new = '''<ContinuousPercentInput value={value} low={q.low} high={q.high} onChange={(next)=>setAnswers({...answers,[q.id]:next})}/>'''
if old not in portal and 'function ContinuousPercentInput' not in portal:
    raise SystemExit('Discrete area scale not found')
portal = portal.replace(old, new)
if 'function ContinuousPercentInput' not in portal:
    portal += '''\n\nfunction ContinuousPercentInput({ value, low, high, onChange }: { value: number | undefined; low: string; high: string; onChange: (value:number)=>void }) {\n  const shown = value == null ? 50 : Math.max(0, Math.min(100, value));\n  const commit = (next:number) => { if (Number.isFinite(next)) onChange(Math.max(0, Math.min(100, Number(next.toFixed(2))))); };\n  return <div className="mb-9">\n    <div className="flex items-center justify-center gap-3 mb-5">\n      <input aria-label="Percentual exato" type="number" min={0} max={100} step={0.1} value={value ?? ''} placeholder="50" onChange={e=>{ if(e.target.value==='') return; commit(Number(e.target.value)); }} className="w-32 rounded-2xl border border-cyan-300/25 bg-cyan-300/[0.07] px-4 py-3 text-center text-2xl font-black text-cyan-100 outline-none focus:border-cyan-300/60"/>\n      <span className="text-2xl font-black text-cyan-200">%</span>\n    </div>\n    <input aria-label="Escala contínua de 0 a 100" type="range" min={0} max={100} step={1} value={shown} onChange={e=>commit(Number(e.target.value))} className="w-full accent-cyan-300"/>\n    <div className="flex justify-between text-[11px] text-ink-600 mt-2"><span>0</span><span>25</span><span>50</span><span>75</span><span>100</span></div>\n    <div className="grid grid-cols-6 gap-2 mt-4">{[0,20,40,60,80,100].map(n=><button type="button" key={n} onClick={()=>commit(n)} className={`rounded-xl border py-2 text-xs font-bold transition-all ${value===n?'border-cyan-300/45 bg-cyan-300/15 text-cyan-100':'border-white/10 bg-white/[0.03] text-ink-500 hover:text-ink-200'}`}>{n}%</button>)}</div>\n    <div className="flex justify-between gap-4 text-xs text-ink-500 mt-4"><span className="text-left max-w-[45%]">{low}</span><span className="text-right max-w-[45%]">{high}</span></div>\n    <p className="text-center text-[11px] text-ink-600 mt-3">Use o campo para informar qualquer valor, inclusive decimal (ex.: 72,5).</p>\n  </div>;\n}\n'''
portal_path.write_text(portal, encoding='utf-8')

# Match engine: answers are now native percentages, so compare directly to university profiles.
engine_path = ROOT / 'src/lib/professional-area-match.ts'
engine = engine_path.read_text(encoding='utf-8')
engine = engine.replace('addSignal(dimensionId, raw * 20, question.weight ?? 1)', 'addSignal(dimensionId, Math.max(0, Math.min(100, raw)), question.weight ?? 1)')
engine = engine.replace('addSignal(dimensionId, raw * 20, 1)', 'addSignal(dimensionId, Math.max(0, Math.min(100, raw)), 1)')
engine_path.write_text(engine, encoding='utf-8')

# Adaptive layer: preserve historical calibration in 0-5 space while accepting new 0-100 answers.
adaptive_path = ROOT / 'src/lib/adaptive-area-match.ts'
adaptive = adaptive_path.read_text(encoding='utf-8')
helper = '''\nconst percentToCalibrationScale = (value: number) => Math.max(0, Math.min(5, value / 20));\n'''
if 'percentToCalibrationScale' not in adaptive:
    adaptive = adaptive.replace('const emptyPoint = (): AreaCalibrationPoint => ({', helper + '\nconst emptyPoint = (): AreaCalibrationPoint => ({')
adaptive = adaptive.replace('Math.abs(answer - learned.mean) / 2', 'Math.abs(percentToCalibrationScale(answer) - learned.mean) / 2')
adaptive = adaptive.replace('answer_value: answers[question.id],', 'answer_value: percentToCalibrationScale(answers[question.id]),')
adaptive = adaptive.replace('const student = raw * 20;', 'const student = Math.max(0, Math.min(100, raw));')
adaptive_path.write_text(adaptive, encoding='utf-8')

# Results profile summary must no longer multiply answers by 20.
results_path = ROOT / 'src/components/CommercialAreaResults.tsx'
results = results_path.read_text(encoding='utf-8')
results = results.replace('values.push(raw*20);', 'values.push(Math.max(0,Math.min(100,raw)));')
results_path.write_text(results, encoding='utf-8')

# Main slider questions: remove 5-point rounding and allow exact decimal entry.
quiz_path = ROOT / 'src/components/Quiz.tsx'
quiz = quiz_path.read_text(encoding='utf-8')
quiz = quiz.replace("  const numValue = value ? parseInt(value, 10) : 50;\n  const sliderValue = Math.round(numValue / 5) * 5;\n  const clamped = Math.max(0, Math.min(100, sliderValue));", "  const numValue = value ? parseFloat(value) : 50;\n  const clamped = Math.max(0, Math.min(100, Number.isFinite(numValue) ? numValue : 50));")
quiz = quiz.replace('          <span className="text-3xl font-bold text-brand-400">{clamped}</span>', '          <span className="text-3xl font-bold text-brand-400">{Number.isInteger(clamped) ? clamped : clamped.toFixed(1)}</span>')
quiz = quiz.replace('          step={5}', '          step={1}')
number_entry = '''\n      <div className="flex items-center justify-center gap-2 mb-4">\n        <input type="number" min={0} max={100} step={0.1} value={value} placeholder="Digite um valor" onChange={(e) => { const raw=e.target.value; if(raw===''){onChange('');return;} const n=Number(raw); if(Number.isFinite(n)) onChange(String(Math.max(0,Math.min(100,n)))); }} className="w-36 rounded-xl border border-brand-700/40 bg-ink-900/60 px-3 py-2 text-center text-sm font-semibold text-ink-100 outline-none focus:border-brand-400"/>\n        <span className="text-sm font-bold text-ink-400">%</span>\n      </div>\n'''
needle = '      {interpretation(clamped) && ('
if 'placeholder="Digite um valor"' not in quiz:
    quiz = quiz.replace(needle, number_entry + '\n' + needle)
quiz_path.write_text(quiz, encoding='utf-8')

# Regression checks.
validator_path = ROOT / 'scripts/validate-questionnaires.mjs'
validator = validator_path.read_text(encoding='utf-8')
checks = """
  [areaPortal.includes('ContinuousPercentInput') && areaPortal.includes('step={0.1}'), 'Area questionnaire accepts arbitrary decimal percentages'],
  [professionalMatch.includes('Math.max(0, Math.min(100, raw))') && !professionalMatch.includes('raw * 20, question.weight'), 'Professional match compares continuous percentages directly'],
  [commercialResults.includes('Math.max(0,Math.min(100,raw))'), 'Profile summary preserves exact percentages'],
  [quiz.includes('parseFloat(value)') && quiz.includes('placeholder=\"Digite um valor\"'), 'Main slider accepts exact decimal percentages'],
"""
marker = "  [commercialResults.includes(\"'Não cadastrados'\"), 'Missing official indicators are labeled as unavailable instead of zero'],\n"
if 'Area questionnaire accepts arbitrary decimal percentages' not in validator:
    validator = validator.replace(marker, marker + checks)
validator_path.write_text(validator, encoding='utf-8')

professional_validator_path = ROOT / 'scripts/validate-professional-match.mjs'
pv = professional_validator_path.read_text(encoding='utf-8')
if 'Continuous percentages are used directly' not in pv:
    pv = pv.replace("  [engine.includes('eligibleUniversities'), 'Universities without dimensional profiles are excluded'],", "  [engine.includes('eligibleUniversities'), 'Universities without dimensional profiles are excluded'],\n  [engine.includes('Math.max(0, Math.min(100, raw))') && !engine.includes('raw * 20, question.weight'), 'Continuous percentages are used directly'],")
professional_validator_path.write_text(pv, encoding='utf-8')

print('Continuous percentage scale applied.')
# rollout trigger
