from pathlib import Path
import re, json

root = Path('.')
# production hardening pass

# 1) Area questionnaire: no implicit neutral answer + safer DB fallback
p = root/'src/components/AreaMatchPortal.tsx'
s = p.read_text()
s = s.replace("if (initialAreaId) setArea(loaded.find(a=>a.id===initialAreaId) ?? null);", "if (initialAreaId) setArea(loaded.find(a=>a.id===initialAreaId) ?? fallback.find(a=>a.id===initialAreaId) ?? null);")
s = s.replace("const value = answers[q.id] ?? 3;\n    const progress", "const value = answers[q.id];\n    const answered = value !== undefined;\n    const progress")
s = s.replace("${value===n?'border-cyan-300/45 bg-cyan-300/15 text-cyan-100 scale-[1.03]':'border-white/10 bg-white/[0.035] text-ink-400'}", "${value===n?'border-cyan-300/45 bg-cyan-300/15 text-cyan-100 scale-[1.03]':'border-white/10 bg-white/[0.035] text-ink-400'}")
old = "<button onClick={()=>{const next={...answers,[q.id]:value};setAnswers(next);if(index===questions.length-1){setStep('results');trackEvent('area_questionnaire_completed',{area_id:area.id,questions:questions.length});}else setIndex(index+1);}} className=\"flex-1 px-5 py-3.5 rounded-xl bg-gradient-to-r from-cyan-300 to-brand-400 text-[#06131c] font-black inline-flex items-center justify-center gap-2\">"
new = "<button disabled={!answered} onClick={()=>{if(!answered)return;if(index===questions.length-1){setStep('results');trackEvent('area_questionnaire_completed',{area_id:area.id,questions:questions.length});}else setIndex(index+1);}} className=\"flex-1 px-5 py-3.5 rounded-xl bg-gradient-to-r from-cyan-300 to-brand-400 text-[#06131c] font-black inline-flex items-center justify-center gap-2 disabled:opacity-35 disabled:cursor-not-allowed\">"
if old not in s:
    raise SystemExit('AreaMatchPortal continue button pattern not found')
s = s.replace(old,new)
s = s.replace("<div className=\"flex justify-between text-xs text-ink-500 mb-12\"><span>{q.low}</span><span>{q.high}</span></div>", "<div className=\"flex justify-between text-xs text-ink-500 mb-3\"><span>{q.low}</span><span>{q.high}</span></div>{!answered&&<p className=\"text-center text-xs text-cyan-200/75 mb-9\">Escolha uma opção para continuar — nenhuma resposta é preenchida automaticamente.</p>}{answered&&<div className=\"mb-9\"/>}")
p.write_text(s)

# 2) Professional scoring: weighted aggregation + minimize uninformed dimensions
p = root/'src/lib/professional-area-match.ts'
s = p.read_text()
old = """  const studentSamples = new Map<string, number[]>();
  const addSignal = (dimensionId: string, value: number) => {
    const current = studentSamples.get(dimensionId) ?? [];
    current.push(value);
    studentSamples.set(dimensionId, current);
  };
"""
new = """  const studentSamples = new Map<string, Array<{value:number;weight:number}>>();
  const addSignal = (dimensionId: string, value: number, weight = 1) => {
    const current = studentSamples.get(dimensionId) ?? [];
    current.push({ value, weight: Math.max(0.1, weight) });
    studentSamples.set(dimensionId, current);
  };
"""
if old not in s:
    raise SystemExit('studentSamples pattern not found')
s = s.replace(old,new)
s = s.replace("dimensionIds.forEach((dimensionId) => addSignal(dimensionId, raw * 20));", "dimensionIds.forEach((dimensionId) => addSignal(dimensionId, raw * 20, question.weight ?? 1));", 1)
s = s.replace("dimensionIds.forEach((dimensionId) => addSignal(dimensionId, raw * 20));", "dimensionIds.forEach((dimensionId) => addSignal(dimensionId, raw * 20, 1));", 1)
old = """  const student: Record<string,number> = Object.fromEntries(
    [...studentSamples.entries()].map(([dimensionId, values]) => [
      dimensionId,
      values.reduce((sum, value) => sum + value, 0) / values.length,
    ])
  );
"""
new = """  const student: Record<string,number> = Object.fromEntries(
    [...studentSamples.entries()].map(([dimensionId, samples]) => {
      const weightTotal = samples.reduce((sum, sample) => sum + sample.weight, 0);
      const weightedValue = samples.reduce((sum, sample) => sum + sample.value * sample.weight, 0) / weightTotal;
      return [dimensionId, weightedValue];
    })
  );
"""
if old not in s:
    raise SystemExit('student aggregation pattern not found')
s = s.replace(old,new)
s = s.replace(": 0.22;", ": 0.08;")
p.write_text(s)

# 3) Results: profile summary must use DB question ids/dimensions, not old hard-coded answer ids
p = root/'src/components/CommercialAreaResults.tsx'
s = p.read_text()
old_const = "const PROFILE_LABELS:Record<string,string>={rigor:'Rigor acadêmico',practical:'Aprendizagem prática',research:'Pesquisa',people:'Contato com pessoas',technology:'Tecnologia e dados',leadership:'Liderança',structure:'Estrutura',international:'Internacionalização',flexibility:'Flexibilidade',faculty:'Proximidade com professores',collaboration:'Colaboração',competition:'Competitividade',campus:'Vida universitária',career:'Carreira',entrepreneurship:'Empreendedorismo',impact:'Impacto social',quantitative:'Intensidade quantitativa',theory:'Base teórica'};"
new_const = """const QUESTION_TO_PROFILE_DIMENSION:Record<string,string>={rigor:'academic_rigor',practical:'practical_learning',research:'research_intensity',people:'people_contact',technology:'technology_integration',leadership:'leadership',structure:'structure_support',international:'international_exposure',flexibility:'academic_flexibility',faculty:'faculty_access',collaboration:'collaborative_culture',competition:'competitive_environment',campus:'campus_experience',career:'career_integration',entrepreneurship:'entrepreneurship',impact:'social_impact',quantitative:'quantitative_intensity',theory:'theory_orientation'};
const PROFILE_LABELS:Record<string,string>={academic_rigor:'Rigor acadêmico',practical_learning:'Aprendizagem prática',project_based:'Projetos',research_intensity:'Pesquisa',people_contact:'Contato humano',technology_integration:'Tecnologia e dados',leadership:'Liderança',structure_support:'Estrutura e suporte',international_exposure:'Internacionalização',academic_flexibility:'Flexibilidade curricular',autonomy:'Autonomia',faculty_access:'Acesso a professores',collaborative_culture:'Colaboração',belonging_support:'Pertencimento e suporte',competitive_environment:'Competitividade',campus_experience:'Vida universitária',career_integration:'Integração com carreira',employability_focus:'Empregabilidade',entrepreneurship:'Empreendedorismo',social_impact:'Impacto social',quantitative_intensity:'Intensidade quantitativa',theory_orientation:'Base teórica',academic_value_added:'Valor acadêmico agregado',prestige_network:'Marca e rede'};
function studentProfileSummary(area:ProfessionalArea,answers:Record<string,number>){
  const buckets=new Map<string,number[]>();
  for(const q of area.questions??[]){const raw=answers[q.id];if(raw==null)continue;const d=QUESTION_TO_PROFILE_DIMENSION[q.dimension]??q.dimension;const values=buckets.get(d)??[];values.push(raw*20);buckets.set(d,values)}
  return [...buckets.entries()].map(([dimension,values])=>({label:PROFILE_LABELS[dimension]??dimension.replaceAll('_',' '),value:Math.round(values.reduce((a,b)=>a+b,0)/values.length),dimension})).sort((a,b)=>Math.abs(b.value-60)-Math.abs(a.value-60)||b.value-a.value);
}"""
if old_const not in s:
    raise SystemExit('CommercialAreaResults PROFILE_LABELS pattern not found')
s = s.replace(old_const,new_const)
s = s.replace("function confidenceLabel(v:number){return v>=70?'Alta':v>=50?'Média':'Em verificação'}", "function confidenceLabel(v:number){return v>=75?'Alta':v>=60?'Boa':v>=45?'Moderada':'Inicial'}")
s = s.replace("function fitLabel(v:number){return v>=90?'Fit excepcional':v>=82?'Fit muito alto':v>=72?'Fit alto':'Fit relevante'}", "function fitLabel(v:number,confidence:number){const base=v>=90?'Fit muito alto':v>=82?'Fit alto':v>=72?'Fit consistente':'Fit relevante';return confidence<50?`${base} · dados em validação`:base}")
old_profile = "const profile=useMemo(()=>Object.entries(answers).filter(([k])=>PROFILE_LABELS[k]).map(([k,v])=>({label:PROFILE_LABELS[k],value:v*20})).sort((a,b)=>b.value-a.value),[answers]);"
if old_profile not in s:
    raise SystemExit('CommercialAreaResults profile useMemo pattern not found')
s = s.replace(old_profile, "const profile=useMemo(()=>studentProfileSummary(area,answers),[area,answers]);")
s = s.replace("{fitLabel(top.score)}", "{fitLabel(top.score,top.confidence)}")
s = s.replace("Seu resultado combina preferências acadêmicas, ambiente, carreira e propósito em 24 dimensões. Respostas mais marcantes do seu perfil têm mais peso, para o ranking não favorecer sempre faculdades “médias” em tudo.", "Seu resultado combina preferências acadêmicas, ambiente, carreira e propósito em 24 dimensões. As respostas são agregadas pelas dimensões que realmente medem, com pesos específicos da área; dimensões sem resposta têm influência residual mínima.")
p.write_text(s)

# 4) Build-time catalog guard
validator = r'''import fs from 'node:fs';

const mapText = fs.readFileSync('src/lib/course-area-map.ts','utf8');
const vocationalText = fs.readFileSync('src/lib/vocational-data.ts','utf8');
const extraText = fs.readFileSync('src/lib/expanded-course-data.ts','utf8');
const mapEntries = [...mapText.matchAll(/^\s*'([^']+)':\s*'([^']+)'/gm)].map(m=>({course:m[1],area:m[2]}));
const courseNames = new Set([
  ...[...vocationalText.matchAll(/\bc\(\s*'[^']+'\s*,\s*'([^']+)'/g)].map(m=>m[1]),
  ...[...extraText.matchAll(/\bc\(\s*"[^"]+"\s*,\s*"([^"]+)"/g)].map(m=>m[1]),
]);
const errors=[];
if(mapEntries.length!==50) errors.push(`expected 50 course mappings, found ${mapEntries.length}`);
if(new Set(mapEntries.map(x=>x.course)).size!==mapEntries.length) errors.push('duplicate course names in canonical map');
if(new Set(mapEntries.map(x=>x.area)).size!==mapEntries.length) errors.push('duplicate area ids in canonical map');
for(const {course} of mapEntries) if(!courseNames.has(course)) errors.push(`mapped course missing from vocational catalog: ${course}`);
for(const course of courseNames) if(!mapEntries.some(x=>x.course===course)) errors.push(`vocational course missing canonical area mapping: ${course}`);
if(courseNames.size!==50) errors.push(`expected 50 vocational courses, found ${courseNames.size}`);
if(errors.length){console.error('\nCatalog validation failed:');for(const e of errors) console.error(`- ${e}`);process.exit(1)}
console.log(`Catalog validation OK: ${courseNames.size} courses, ${mapEntries.length} canonical mappings.`);
'''
(root/'scripts/validate-catalog.mjs').write_text(validator)

# 5) Make catalog validation part of every production build
p=root/'package.json'
data=json.loads(p.read_text())
data['scripts']['validate:catalog']='node scripts/validate-catalog.mjs'
data['scripts']['build']='npm run validate:catalog && npm run typecheck && vite build'
p.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')

print('Professional polish applied.')
